using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Common;
using TrainingSystem.DTOs.ExamResult;
using TrainingSystem.Models;
using TrainingSystem.Services;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ExamResultController : BaseApiController
    {
        private readonly IEmailNotificationService _emailNotifications;

        public ExamResultController(AppDbContext context, IEmailNotificationService emailNotifications) : base(context)
        {
            _emailNotifications = emailNotifications;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<PaginatedResult<ExamResultDto>>> GetAllResults(
            string? search, string? grading, [FromQuery] PaginationQuery pg)
        {
            var query = _context.ExamResult
                .Include(r => r.User)
                .Include(r => r.Exam)
                .AsQueryable();

            if (IsTrainer())
            {
                query = query.Where(r => r.Exam != null &&
                    _context.Courses.Any(c => c.CourseID == r.Exam.CourseID && c.TrainerID == CurrentUserId));
            }

            if (grading == "needsGrading")
            {
                query = query.Where(r => r.NeedsGrading);
            }
            else if (grading == "graded")
            {
                query = query.Where(r => !r.NeedsGrading);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower();
                query = query.Where(r =>
                    r.User != null && r.User.Name.ToLower().Contains(search) ||
                    r.Exam != null && r.Exam.Title.ToLower().Contains(search));
            }

            var totalCount = await query.CountAsync();

            var results = await query
                .OrderByDescending(r => r.SubmittedAt)
                .Skip((pg.Page - 1) * pg.PageSize)
                .Take(pg.PageSize)
                .Select(r => new ExamResultDto
                {
                    ResultID = r.ResultID,
                    UserID = r.UserID,
                    ExamID = r.ExamID,
                    UserName = r.User!.Name,
                    ExamTitle = r.Exam!.Title,
                    Score = r.Score,
                    Passed = r.Passed,
                    NeedsGrading = r.NeedsGrading,
                    SubmittedAt = r.SubmittedAt
                })
                .ToListAsync();

            return Ok(new PaginatedResult<ExamResultDto>
            {
                Items = results,
                TotalCount = totalCount,
                Page = pg.Page,
                PageSize = pg.PageSize
            });
        }

        [HttpGet("{id}/attempt")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<ExamAttemptDto>> GetAttempt(int id)
        {
            var result = await _context.ExamResult
                .Include(r => r.User)
                .Include(r => r.Exam)
                .Include(r => r.Answers)
                    .ThenInclude(a => a.Question)
                .FirstOrDefaultAsync(r => r.ResultID == id);

            if (result == null)
                return NotFound(new { message = "Attempt not found." });

            if (IsTrainer() && !await OwnsCourse(result.Exam!.CourseID))
                return Forbid();

            var dto = new ExamAttemptDto
            {
                ResultID = result.ResultID,
                UserID = result.UserID,
                UserName = result.User!.Name,
                ExamID = result.ExamID,
                ExamTitle = result.Exam!.Title,
                Score = result.Score,
                Passed = result.Passed,
                NeedsGrading = result.NeedsGrading,
                SubmittedAt = result.SubmittedAt,
                Answers = result.Answers.Select(a => new ExamAnswerDetailDto
                {
                    ExamAnswerID = a.ExamAnswerID,
                    QuestionID = a.QuestionID,
                    Content = a.Question!.Content,
                    QuestionType = a.Question.QuestionType,
                    Answer = a.Answer,
                    CorrectAnswer = a.Question.QuestionType == "MultipleChoice"
                        ? a.Question.CorrectAnswer
                        : null,
                    IsCorrect = a.IsCorrect,
                    MaxScore = a.Question.Score,
                    PointsEarned = a.PointsEarned,
                    NeedsGrading = a.NeedsGrading,
                    Rubric = DeserializeRubric(a.Question.RubricJson) ?? new()
                }).ToList()
            };

            return Ok(dto);
        }

        [HttpPut("{id}/grade")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> GradeAttempt(int id, GradeExamDto dto)
        {
            var result = await _context.ExamResult
                .Include(r => r.User)
                .Include(r => r.Exam)
                .Include(r => r.Answers)
                    .ThenInclude(a => a.Question)
                .FirstOrDefaultAsync(r => r.ResultID == id);

            if (result == null)
                return NotFound(new { message = "Attempt not found." });

            if (IsTrainer() && !await OwnsCourse(result.Exam!.CourseID))
                return Forbid();

            var updateMap = dto.Answers
                .GroupBy(a => a.ExamAnswerID)
                .ToDictionary(g => g.Key, g => g.Last());

            foreach (var answer in result.Answers.Where(a => a.NeedsGrading))
            {
                if (!updateMap.TryGetValue(answer.ExamAnswerID, out var update))
                    continue;

                var maxScore = answer.Question!.Score;

                // Essay rubric: when the trainer submits per-criterion scores,
                // their sum is used. Falls back to PointsEarned otherwise.
                var points = update.PointsEarned;
                if (update.CriterionScores is { Count: > 0 })
                    points = update.CriterionScores.Sum(c => c.Points);

                points = Math.Clamp(points, 0, maxScore);

                answer.PointsEarned = points;
                answer.IsCorrect = points >= maxScore;
                answer.NeedsGrading = false;
            }

            var totalPossible = result.Answers.Sum(a => a.Question!.Score);
            var earned = result.Answers.Sum(a => a.PointsEarned);

            result.Score = totalPossible > 0
                ? Math.Round(earned / totalPossible * 100, 2)
                : 0;
            result.Passed = result.Score >= 50;
            var fullyGraded = !result.Answers.Any(a => a.NeedsGrading);
            result.NeedsGrading = !fullyGraded;

            await _context.SaveChangesAsync();

            if (fullyGraded && result.User != null)
                await _emailNotifications.NotifyExamGradedAsync(result.User, result.Exam, result);

            return NoContent();
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<ExamResultDto>> CreateResult(CreateExamResultDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserID);
            if (user == null)
                return NotFound(new { message = "User not found." });

            var exam = await _context.Exams.FindAsync(dto.ExamID);
            if (exam == null)
                return NotFound(new { message = "Exam not found." });

            if (IsTrainer() && !await OwnsCourse(exam.CourseID))
                return Forbid();

            var enrolled = await _context.Enrollments.AnyAsync(e =>
                e.UserID == dto.UserID && e.CourseID == exam.CourseID);
            if (!enrolled)
                return BadRequest(new { message = "User is not enrolled in this course." });

            var result = new ExamResult
            {
                UserID = dto.UserID,
                ExamID = dto.ExamID,
                Score = dto.Score,
                Passed = dto.Score >= 50,
                SubmittedAt = DateTime.Now
            };

            _context.ExamResult.Add(result);
            await _context.SaveChangesAsync();

            var response = new ExamResultDto
            {
                ResultID = result.ResultID,
                UserID = result.UserID,
                ExamID = result.ExamID,
                UserName = user.Name,
                ExamTitle = exam.Title,
                Score = result.Score,
                Passed = result.Passed,
                SubmittedAt = result.SubmittedAt
            };

            return Ok(response);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> UpdateExamResult(
            int id,
            UpdateExamResultDto dto)
        {
            var result = await _context.ExamResult
                .Include(r => r.Exam)
                .FirstOrDefaultAsync(r => r.ResultID == id);

            if (result == null)
                return NotFound();

            var newExam = await _context.Exams.FindAsync(dto.ExamID);
            if (newExam == null)
                return NotFound(new { message = "Exam does not exist." });

            if (IsTrainer() && !await OwnsCourse(newExam.CourseID))
                return Forbid();

            var userExists = await _context.Users.AnyAsync(u => u.UserID == dto.UserID);
            if (!userExists)
                return NotFound(new { message = "User does not exist." });

            var enrolled = await _context.Enrollments.AnyAsync(e =>
                e.UserID == dto.UserID && e.CourseID == newExam.CourseID);
            if (!enrolled)
                return BadRequest(new { message = "User is not enrolled in the target course." });

            result.UserID = dto.UserID;
            result.ExamID = dto.ExamID;
            result.Score = dto.Score;
            result.Passed = dto.Score >= 50;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> DeleteResult(int id)
        {
            var result = await _context.ExamResult
                .Include(r => r.Exam)
                .FirstOrDefaultAsync(r => r.ResultID == id);

            if (result == null)
                return NotFound("Exam result not found.");

            if (IsTrainer() && !await OwnsCourse(result.Exam!.CourseID))
                return Forbid();

            _context.ExamResult.Remove(result);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static List<RubricCriterionDto>? DeserializeRubric(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            try { return JsonSerializer.Deserialize<List<RubricCriterionDto>>(json); }
            catch { return null; }
        }
    }
}
