using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Common;
using TrainingSystem.DTOs.Exam;
using TrainingSystem.DTOs.ExamResult;
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

        private readonly int _defaultMaxAttempts;

        public ExamController(AppDbContext context, IConfiguration configuration) : base(context)
        {
            _defaultMaxAttempts = configuration.GetValue("Exam:DefaultMaxAttempts", 3);
        }

        private int EffectiveMaxAttempts(Exam exam)
            => exam.MaxAttempts is > 0 ? exam.MaxAttempts.Value : _defaultMaxAttempts;

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
                query = query.Where(e => MyCourseIds().Contains(e.CourseID) && e.IsPublished);
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
                    MaxAttempts = e.MaxAttempts ?? _defaultMaxAttempts,
                    TimeLimitMinutes = e.TimeLimitMinutes ?? 0,
                    AttemptCount = e.ExamResults.Count(r => r.UserID == CurrentUserId),
                    IsPublished = e.IsPublished,
                    ContentVersion = e.ContentVersion,
                    QuestionsPerAttempt = e.QuestionsPerAttempt
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
                    MaxAttempts = e.MaxAttempts ?? _defaultMaxAttempts,
                    TimeLimitMinutes = e.TimeLimitMinutes ?? 0,
                    AttemptCount = e.ExamResults.Count(r => r.UserID == CurrentUserId),
                    IsPublished = e.IsPublished,
                    ContentVersion = e.ContentVersion,
                    QuestionsPerAttempt = e.QuestionsPerAttempt
                })
                .FirstOrDefaultAsync();

            if (exam == null)
                return NotFound();

            if (!await IsEnrolled(exam.CourseID))
                return Forbid();

            if (IsStudent() && !exam.IsPublished)
                return NotFound();

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
            var maxAttempts = exam.MaxAttempts ?? _defaultMaxAttempts;

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
                    q.Score,
                    q.RubricJson
                })
                .ToListAsync();

            var questionDtos = questions.Select(q => new
            {
                q.QuestionID,
                q.Content,
                q.QuestionType,
                q.OptionA,
                q.OptionB,
                q.OptionC,
                q.OptionD,
                q.Score,
                Rubric = DeserializeRubric(q.RubricJson)
            }).ToList();

            // Fisher-Yates shuffle
            var rng = new Random();
            for (int i = questionDtos.Count - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1);
                (questionDtos[i], questionDtos[j]) = (questionDtos[j], questionDtos[i]);
            }

            // Question pool randomization: pick QuestionsPerAttempt random questions.
            var poolSize = exam.QuestionsPerAttempt ?? 0;
            if (poolSize > 0 && poolSize < questionDtos.Count)
                questionDtos = questionDtos.Take(poolSize).ToList();

            return Ok(new
            {
                examID = exam.ExamID,
                title = exam.Title,
                courseTitle = exam.Course!.Title,
                maxAttempts,
                timeLimitMinutes = exam.TimeLimitMinutes ?? 0,
                attemptCount = await _context.ExamResult
                    .CountAsync(r => r.ExamID == id && r.UserID == userId),
                totalQuestions = questionDtos.Count,
                totalPoints = questionDtos.Sum(q => q.Score),
                questions = questionDtos
            });
        }

        private static List<RubricCriterionDto>? DeserializeRubric(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            try { return JsonSerializer.Deserialize<List<RubricCriterionDto>>(json); }
            catch { return null; }
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
            var maxAttempts = exam.MaxAttempts ?? _defaultMaxAttempts;
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

            // Question pool randomization: when the exam draws N random questions per
            // attempt, grade only the questions that were actually served to this student.
            var servedIds = dto.QuestionIDs?.Where(id => id > 0).ToHashSet();
            var gradedQuestions = exam.Questions;
            if (servedIds is { Count: > 0 })
                gradedQuestions = exam.Questions.Where(q => servedIds.Contains(q.QuestionID)).ToList();

            if (gradedQuestions.Count == 0)
                return BadRequest(new { message = "No questions were served for this attempt." });

            decimal totalPossible = gradedQuestions.Sum(q => q.Score);
            decimal earned = 0;

            var feedback = new List<QuestionFeedbackDto>();
            var answerEntities = new List<ExamAnswer>();
            bool anyNeedsGrading = false;

            foreach (var q in gradedQuestions)
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
                TotalQuestions = gradedQuestions.Count,
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

            if (IsTrainer() && !await OwnsCourse(dto.CourseID))
                return Forbid();

            var exam = new Exam
            {
                Title = dto.Title,
                CourseID = dto.CourseID,
                MaxAttempts = dto.MaxAttempts > 0 ? dto.MaxAttempts : _defaultMaxAttempts,
                TimeLimitMinutes = dto.TimeLimitMinutes > 0 ? dto.TimeLimitMinutes : null,
                QuestionsPerAttempt = dto.QuestionsPerAttempt > 0 ? dto.QuestionsPerAttempt : null,
                IsPublished = false
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
                TimeLimitMinutes = exam.TimeLimitMinutes ?? 0,
                IsPublished = exam.IsPublished,
                ContentVersion = exam.ContentVersion,
                QuestionsPerAttempt = exam.QuestionsPerAttempt
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

            if (IsTrainer() && !await OwnsCourse(exam.CourseID))
                return Forbid();

            var courseExists = await _context.Courses
                .AnyAsync(c => c.CourseID == dto.CourseID);

            if (!courseExists)
                return NotFound(new
                {
                    message = "Course does not exist."
                });

            if (IsTrainer() && !await OwnsCourse(dto.CourseID))
                return Forbid();

            exam.Title = dto.Title;
            exam.CourseID = dto.CourseID;
            exam.MaxAttempts = dto.MaxAttempts > 0 ? dto.MaxAttempts : _defaultMaxAttempts;
            exam.TimeLimitMinutes = dto.TimeLimitMinutes > 0 ? dto.TimeLimitMinutes : null;
            exam.QuestionsPerAttempt = dto.QuestionsPerAttempt > 0 ? dto.QuestionsPerAttempt : null;

            // Editing a live exam mid-term silently changes it for everyone.
            // Send it back to draft; the trainer republishes when ready.
            if (exam.IsPublished)
                exam.IsPublished = false;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/publish")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> PublishExam(int id)
        {
            var exam = await _context.Exams.FindAsync(id);

            if (exam == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(exam.CourseID))
                return Forbid();

            if (!exam.IsPublished)
            {
                exam.IsPublished = true;
                exam.ContentVersion++;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Exam published.", contentVersion = exam.ContentVersion });
        }

        [HttpPost("{id}/unpublish")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> UnpublishExam(int id)
        {
            var exam = await _context.Exams.FindAsync(id);

            if (exam == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(exam.CourseID))
                return Forbid();

            exam.IsPublished = false;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Exam unpublished." });
        }

        // DELETE
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> DeleteExam(int id)
        {
            var exam = await _context.Exams.FindAsync(id);

            if (exam == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(exam.CourseID))
                return Forbid();

            _context.Exams.Remove(exam);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
