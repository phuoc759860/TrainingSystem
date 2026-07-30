using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Common;
using TrainingSystem.DTOs.Exam;
using TrainingSystem.Models;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ExamController : BaseApiController
    {
        private const int TimeGraceMinutes = 2;

        public ExamController(AppDbContext context) : base(context)
        {    }

        // GET ALL
        [HttpGet]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<PaginatedResult<ExamDto>>> GetExams(
            string? search, [FromQuery] PaginationQuery pg)
        {
            var query = _context.Exams
                .Include(e => e.Course)
                .AsQueryable();

            if (IsStudent())
            {
                query = query.Where(e => MyCourseIds().Contains(e.CourseID));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(e => e.Title.Contains(search) || e.Course!.Title.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var exams = await query
                .OrderBy(e => e.Title)
                .Skip((pg.Page - 1) * pg.PageSize)
                .Take(pg.PageSize)
                .Select(e => new ExamDto
                {
                    ExamID = e.ExamID,
                    Title = e.Title,
                    CourseID = e.CourseID,
                    CourseTitle = e.Course!.Title,
                    MaxAttempts = e.MaxAttempts ?? 0,
                    TimeLimitMinutes = e.TimeLimitMinutes ?? 0,
                    AttemptCount = e.ExamResults.Count(r => r.UserID == CurrentUserId)
                })
                .ToListAsync();

            return Ok(new PaginatedResult<ExamDto>
            {
                Items = exams,
                TotalCount = totalCount,
                Page = pg.Page,
                PageSize = pg.PageSize
            });
        }

        // GET BY ID
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<ExamDto>> GetExam(int id)
        {
            var exam = await _context.Exams
                .Include(e => e.Course)
                .Where(e => e.ExamID == id)
                .Select(e => new ExamDto
                {
                    ExamID = e.ExamID,
                    Title = e.Title,
                    CourseID = e.CourseID,
                    CourseTitle = e.Course!.Title,
                    MaxAttempts = e.MaxAttempts ?? 0,
                    TimeLimitMinutes = e.TimeLimitMinutes ?? 0,
                    AttemptCount = e.ExamResults.Count(r => r.UserID == CurrentUserId)
                })
                .FirstOrDefaultAsync();

            if (exam == null)
                return NotFound();

            if (!await IsEnrolled(exam.CourseID))
                return Forbid();

            return Ok(exam);
        }

        // GET QUESTIONS FOR TAKING — shuffled, no correct answers leaked
        [HttpGet("{id}/questions")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<object>> GetExamQuestions(int id)
        {
            var exam = await _context.Exams
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e => e.ExamID == id);

            if (exam == null)
                return NotFound();

            if (!await IsEnrolled(exam.CourseID))
                return Forbid();

            var userId = CurrentUserId;
            var maxAttempts = exam.MaxAttempts ?? 0;

            if (IsStudent() && maxAttempts > 0)
            {
                var attemptCount = await _context.ExamResult
                    .CountAsync(r => r.ExamID == id && r.UserID == userId);

                if (attemptCount >= maxAttempts)
                    return Conflict(new
                    {
                        message = $"You have used all {maxAttempts} attempt(s) for this exam."
                    });
            }

            var questions = await _context.QuestionBanks
                .Where(q => q.ExamID == id)
                .Select(q => new
                {
                    q.QuestionID,
                    q.Content,
                    q.QuestionType,
                    q.OptionA,
                    q.OptionB,
                    q.OptionC,
                    q.OptionD,
                    q.Score
                })
                .ToListAsync();

            // Fisher-Yates shuffle
            var rng = new Random();
            for (int i = questions.Count - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1);
                (questions[i], questions[j]) = (questions[j], questions[i]);
            }

            return Ok(new
            {
                examID = exam.ExamID,
                title = exam.Title,
                courseTitle = exam.Course!.Title,
                maxAttempts,
                timeLimitMinutes = exam.TimeLimitMinutes ?? 0,
                attemptCount = await _context.ExamResult
                    .CountAsync(r => r.ExamID == id && r.UserID == userId),
                totalQuestions = questions.Count,
                totalPoints = questions.Sum(q => q.Score),
                questions
            });
        }

        // EXAM SUBMIT
        [HttpPost("{id}/submit")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<ExamSubmissionResultDto>> SubmitExam(int id, SubmitExamDto dto)
        {
            var exam = await _context.Exams
                .Include(e => e.Questions)
                .FirstOrDefaultAsync(e => e.ExamID == id);

            if (exam == null)
                return NotFound(new { message = "Exam not found." });

            if (!await IsEnrolled(exam.CourseID))
                return Forbid();

            if (exam.Questions == null || exam.Questions.Count == 0)
                return BadRequest(new { message = "This exam has no questions yet." });

            var userId = CurrentUserId;

            // Attempt limit check
            var maxAttempts = exam.MaxAttempts ?? 0;
            if (IsStudent() && maxAttempts > 0)
            {
                var attemptCount = await _context.ExamResult
                    .CountAsync(r => r.ExamID == id && r.UserID == userId);

                if (attemptCount >= maxAttempts)
                    return Conflict(new
                    {
                        message = $"You have used all {maxAttempts} attempt(s) for this exam."
                    });
            }

            // Time limit validation
            var timeLimit = exam.TimeLimitMinutes ?? 0;
            if (timeLimit > 0 && dto.StartedAt.HasValue)
            {
                var elapsed = DateTime.UtcNow - dto.StartedAt.Value;
                var allowed = TimeSpan.FromMinutes(timeLimit + TimeGraceMinutes);

                if (elapsed > allowed)
                {
                    return Conflict(new
                    {
                        message = $"Time limit exceeded. You had {timeLimit} minutes; {Math.Round(elapsed.TotalMinutes, 1)} minutes elapsed."
                    });
                }
            }

            var answerMap = dto.Answers
                .Where(a => a.QuestionID > 0)
                .GroupBy(a => a.QuestionID)
                .ToDictionary(g => g.Key, g => g.Last().Answer);

            decimal totalPossible = exam.Questions.Sum(q => q.Score);
            decimal earned = 0;

            var feedback = new List<QuestionFeedbackDto>();
            var answerEntities = new List<ExamAnswer>();
            bool anyNeedsGrading = false;

            foreach (var q in exam.Questions)
            {
                answerMap.TryGetValue(q.QuestionID, out var selected);

                bool isMultipleChoice = q.QuestionType == "MultipleChoice";
                bool? isCorrect = null;
                decimal pointsEarned = 0;
                bool needsGrading = false;

                if (isMultipleChoice && !string.IsNullOrWhiteSpace(q.CorrectAnswer))
                {
                    isCorrect = string.Equals(
                        selected?.Trim(),
                        q.CorrectAnswer.Trim(),
                        StringComparison.OrdinalIgnoreCase);

                    if (isCorrect == true)
                    {
                        pointsEarned = q.Score;
                    }
                }
                else
                {
                    needsGrading = true;
                    anyNeedsGrading = true;
                }

                earned += pointsEarned;

                feedback.Add(new QuestionFeedbackDto
                {
                    QuestionID = q.QuestionID,
                    Content = q.Content,
                    QuestionType = q.QuestionType,
                    SelectedAnswer = selected,
                    CorrectAnswer = isMultipleChoice ? q.CorrectAnswer : null,
                    IsCorrect = isCorrect,
                    Score = q.Score,
                    PointsEarned = pointsEarned
                });

                answerEntities.Add(new ExamAnswer
                {
                    QuestionID = q.QuestionID,
                    Answer = selected,
                    IsCorrect = isCorrect,
                    PointsEarned = pointsEarned,
                    NeedsGrading = needsGrading
                });
            }

            decimal percentage = totalPossible > 0
                ? Math.Round(earned / totalPossible * 100, 2)
                : 0;

            var result = new ExamResult
            {
                UserID = userId,
                ExamID = exam.ExamID,
                Score = percentage,
                Passed = percentage >= 50,
                NeedsGrading = anyNeedsGrading,
                SubmittedAt = DateTime.Now
            };

            _context.ExamResult.Add(result);
            await _context.SaveChangesAsync(); 

            foreach (var a in answerEntities)
                a.ResultID = result.ResultID;

            _context.ExamAnswers.AddRange(answerEntities);
            await _context.SaveChangesAsync();

            return Ok(new ExamSubmissionResultDto
            {
                ResultID = result.ResultID,
                ExamID = exam.ExamID,
                Score = percentage,
                Passed = result.Passed,
                TotalQuestions = exam.Questions.Count,
                CorrectCount = feedback.Count(f => f.IsCorrect == true),
                Questions = feedback
            });
        }

        // CREATE
        [HttpPost]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<ExamDto>> CreateExam(CreateExamDto dto)
        {
            var course = await _context.Courses.FindAsync(dto.CourseID);

            if (course == null)
                return NotFound(new
                {
                    message = "Course does not exist."
                });

            var exam = new Exam
            {
                Title = dto.Title,
                CourseID = dto.CourseID,
                MaxAttempts = dto.MaxAttempts > 0 ? dto.MaxAttempts : null,
                TimeLimitMinutes = dto.TimeLimitMinutes > 0 ? dto.TimeLimitMinutes : null
            };

            _context.Exams.Add(exam);

            await _context.SaveChangesAsync();

            var result = new ExamDto
            {
                ExamID = exam.ExamID,
                Title = exam.Title,
                CourseID = course.CourseID,
                CourseTitle = course.Title,
                MaxAttempts = exam.MaxAttempts ?? 0,
                TimeLimitMinutes = exam.TimeLimitMinutes ?? 0
            };

            return CreatedAtAction(nameof(GetExam),
                new { id = exam.ExamID },
                result);
        }

        // UPDATE
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> UpdateExam(int id, UpdateExamDto dto)
        {
            var exam = await _context.Exams.FindAsync(id);

            if (exam == null)
                return NotFound();

            var courseExists = await _context.Courses
                .AnyAsync(c => c.CourseID == dto.CourseID);

            if (!courseExists)
                return NotFound(new
                {
                    message = "Course does not exist."
                });

            exam.Title = dto.Title;
            exam.CourseID = dto.CourseID;
            exam.MaxAttempts = dto.MaxAttempts > 0 ? dto.MaxAttempts : null;
            exam.TimeLimitMinutes = dto.TimeLimitMinutes > 0 ? dto.TimeLimitMinutes : null;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> DeleteExam(int id)
        {
            var exam = await _context.Exams.FindAsync(id);

            if (exam == null)
                return NotFound();

            _context.Exams.Remove(exam);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
