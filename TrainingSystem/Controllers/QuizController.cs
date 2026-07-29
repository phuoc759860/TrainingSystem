using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Quiz;
using TrainingSystem.Models;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;

namespace TrainingSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class QuizController : BaseApiController
    {
        public QuizController(AppDbContext context) : base(context) { }

        // GET ALL QUIZZES
        [HttpGet]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<IEnumerable<QuizDto>>> GetQuizzes(int? lessonId, int? courseId)
        {
            var query = _context.Quizzes
                .Include(q => q.Lesson).ThenInclude(l => l!.Course)
                .Include(q => q.Questions)
                .AsQueryable();

            if (IsStudent())
            {
                query = query.Where(q => q.Lesson!.Course != null &&
                    _context.Enrollments.Any(e => e.UserID == CurrentUserId && e.CourseID == q.Lesson.CourseID));
            }

            if (lessonId.HasValue)
                query = query.Where(q => q.LessonID == lessonId);

            if (courseId.HasValue)
                query = query.Where(q => q.Lesson!.CourseID == courseId);

            var quizzes = await query.OrderByDescending(q => q.QuizID).Select(q => new QuizDto
            {
                QuizID = q.QuizID,
                Title = q.Title,
                Description = q.Description,
                LessonID = q.LessonID,
                LessonTitle = q.Lesson!.Title,
                CourseTitle = q.Lesson.Course!.Title,
                TimeLimitMinutes = q.TimeLimitMinutes,
                PassingScore = q.PassingScore,
                IsActive = q.IsActive,
                QuestionCount = q.Questions.Count
            }).ToListAsync();

            return Ok(quizzes);
        }

        // GET QUIZ BY ID (with questions, no answers for students)
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<object>> GetQuiz(int id)
        {
            var quiz = await _context.Quizzes
                .Include(q => q.Lesson).ThenInclude(l => l!.Course)
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.QuizID == id);

            if (quiz == null) return NotFound();

            if (IsStudent())
            {
                var attempts = await _context.QuizAttempts
                    .Where(a => a.QuizID == id && a.UserID == CurrentUserId)
                    .OrderByDescending(a => a.CompletedAt)
                    .ToListAsync();

                var bestScore = attempts.Where(a => a.CompletedAt != null).MaxBy(a => (double)a.Score / a.TotalPoints * 100);

                return Ok(new
                {
                    quiz.QuizID,
                    quiz.Title,
                    quiz.Description,
                    quiz.LessonID,
                    LessonTitle = quiz.Lesson!.Title,
                    CourseTitle = quiz.Lesson.Course!.Title,
                    quiz.TimeLimitMinutes,
                    quiz.PassingScore,
                    quiz.IsActive,
                    Questions = quiz.Questions.Select(q => new QuizQuestionDto
                    {
                        QuizQuestionID = q.QuizQuestionID,
                        QuizID = q.QuizID,
                        QuestionText = q.QuestionText,
                        Options = JsonSerializer.Deserialize<string[]>(q.Options) ?? Array.Empty<string>(),
                        Points = q.Points
                    }),
                    AttemptsCount = attempts.Count,
                    BestScore = bestScore != null ? (int)(bestScore.Score * 100 / bestScore.TotalPoints) : (int?)null,
                    BestPassed = bestScore?.Passed
                });
            }

            return Ok(new
            {
                quiz.QuizID,
                quiz.Title,
                quiz.Description,
                quiz.LessonID,
                LessonTitle = quiz.Lesson!.Title,
                CourseTitle = quiz.Lesson.Course!.Title,
                quiz.TimeLimitMinutes,
                quiz.PassingScore,
                quiz.IsActive,
                Questions = quiz.Questions.Select(q => new
                {
                    q.QuizQuestionID,
                    q.QuizID,
                    q.QuestionText,
                    Options = JsonSerializer.Deserialize<string[]>(q.Options) ?? Array.Empty<string>(),
                    q.CorrectIndex,
                    q.Points
                })
            });
        }

        // GET QUIZ FOR TAKING (student view, no correct answers)
        [HttpGet("{id}/take")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<object>> GetQuizForTaking(int id)
        {
            var quiz = await _context.Quizzes
                .Include(q => q.Lesson).ThenInclude(l => l!.Course)
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.QuizID == id && q.IsActive);

            if (quiz == null) return NotFound();

            if (!await IsEnrolled(quiz.Lesson!.CourseID))
                return Forbid();

            var existingAttempt = await _context.QuizAttempts
                .FirstOrDefaultAsync(a => a.QuizID == id && a.UserID == CurrentUserId && a.CompletedAt == null);

            return Ok(new
            {
                quiz.QuizID,
                quiz.Title,
                quiz.Description,
                quiz.TimeLimitMinutes,
                LessonTitle = quiz.Lesson.Title,
                Questions = quiz.Questions.Select(q => new QuizQuestionDto
                {
                    QuizQuestionID = q.QuizQuestionID,
                    QuizID = q.QuizID,
                    QuestionText = q.QuestionText,
                    Options = JsonSerializer.Deserialize<string[]>(q.Options) ?? Array.Empty<string>(),
                    Points = q.Points
                }),
                ExistingAttemptId = existingAttempt?.QuizAttemptID
            });
        }

        // CREATE QUIZ
        [HttpPost]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<QuizDto>> CreateQuiz(CreateQuizDto dto)
        {
            var lesson = await _context.Lessons.FindAsync(dto.LessonID);
            if (lesson == null) return NotFound();

            if (IsTrainer() && !await OwnsCourse(lesson.CourseID))
                return Forbid();

            var quiz = new Quiz
            {
                Title = dto.Title,
                Description = dto.Description,
                LessonID = dto.LessonID,
                TimeLimitMinutes = dto.TimeLimitMinutes,
                PassingScore = dto.PassingScore,
                IsActive = true
            };

            _context.Quizzes.Add(quiz);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetQuiz), new { id = quiz.QuizID }, new QuizDto
            {
                QuizID = quiz.QuizID,
                Title = quiz.Title,
                Description = quiz.Description,
                LessonID = quiz.LessonID,
                TimeLimitMinutes = quiz.TimeLimitMinutes,
                PassingScore = quiz.PassingScore,
                IsActive = quiz.IsActive,
                QuestionCount = 0
            });
        }

        // UPDATE QUIZ
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> UpdateQuiz(int id, UpdateQuizDto dto)
        {
            var quiz = await _context.Quizzes.FindAsync(id);
            if (quiz == null) return NotFound();

            if (dto.LessonID.HasValue && dto.LessonID.Value != quiz.LessonID)
            {
                var newLesson = await _context.Lessons.FindAsync(dto.LessonID.Value);
                if (newLesson == null) return BadRequest("Lesson not found.");

                if (IsTrainer() && !await OwnsCourse(newLesson.CourseID))
                    return Forbid();

                quiz.LessonID = dto.LessonID.Value;
            }
            else if (IsTrainer() && !await OwnsCourse(_context.Lessons.Where(l => l.LessonID == quiz.LessonID).Select(l => l.CourseID).FirstOrDefault()))
            {
                return Forbid();
            }

            if (dto.Title != null) quiz.Title = dto.Title;
            if (dto.Description != null) quiz.Description = dto.Description;
            if (dto.TimeLimitMinutes.HasValue) quiz.TimeLimitMinutes = dto.TimeLimitMinutes.Value;
            if (dto.PassingScore.HasValue) quiz.PassingScore = dto.PassingScore.Value;
            if (dto.IsActive.HasValue) quiz.IsActive = dto.IsActive.Value;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE QUIZ
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> DeleteQuiz(int id)
        {
            var quiz = await _context.Quizzes.FindAsync(id);
            if (quiz == null) return NotFound();

            if (IsTrainer() && !await OwnsCourse(_context.Lessons.Where(l => l.LessonID == quiz.LessonID).Select(l => l.CourseID).FirstOrDefault()))
                return Forbid();

            _context.Quizzes.Remove(quiz);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ADD QUESTION
        [HttpPost("{quizId}/questions")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<QuizQuestionDto>> AddQuestion(int quizId, CreateQuizQuestionDto dto)
        {
            var quiz = await _context.Quizzes.FindAsync(quizId);
            if (quiz == null) return NotFound();

            if (IsTrainer() && !await OwnsCourse(_context.Lessons.Where(l => l.LessonID == quiz.LessonID).Select(l => l.CourseID).FirstOrDefault()))
                return Forbid();

            var question = new QuizQuestion
            {
                QuizID = quizId,
                QuestionText = dto.QuestionText,
                Options = JsonSerializer.Serialize(dto.Options),
                CorrectIndex = dto.CorrectIndex,
                Points = dto.Points
            };

            _context.QuizQuestions.Add(question);
            await _context.SaveChangesAsync();

            return Ok(new QuizQuestionDto
            {
                QuizQuestionID = question.QuizQuestionID,
                QuizID = question.QuizID,
                QuestionText = question.QuestionText,
                Options = dto.Options,
                Points = question.Points
            });
        }

        // DELETE QUESTION
        [HttpDelete("questions/{questionId}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> DeleteQuestion(int questionId)
        {
            var question = await _context.QuizQuestions.FindAsync(questionId);
            if (question == null) return NotFound();

            _context.QuizQuestions.Remove(question);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // SUBMIT QUIZ
        [HttpPost("{quizId}/submit")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<QuizAttemptDto>> SubmitQuiz(int quizId, SubmitQuizDto dto)
        {
            var quiz = await _context.Quizzes
                .Include(q => q.Questions)
                .Include(q => q.Lesson)
                .FirstOrDefaultAsync(q => q.QuizID == quizId && q.IsActive);

            if (quiz == null) return NotFound();

            if (!await IsEnrolled(quiz.Lesson!.CourseID))
                return Forbid();

            var attempt = new QuizAttempt
            {
                QuizID = quizId,
                UserID = CurrentUserId,
                StartedAt = DateTime.Now,
                CompletedAt = DateTime.Now
            };

            int score = 0;
            int totalPoints = quiz.Questions.Sum(q => q.Points);

            foreach (var ans in dto.Answers)
            {
                var question = quiz.Questions.FirstOrDefault(q => q.QuizQuestionID == ans.QuizQuestionID);
                if (question == null) continue;

                var isCorrect = ans.SelectedIndex == question.CorrectIndex;
                if (isCorrect) score += question.Points;

                attempt.Answers.Add(new QuizAnswer
                {
                    QuizQuestionID = ans.QuizQuestionID,
                    SelectedIndex = ans.SelectedIndex,
                    IsCorrect = isCorrect
                });
            }

            attempt.Score = score;
            attempt.TotalPoints = totalPoints;
            attempt.Passed = totalPoints > 0 && (score * 100 / totalPoints) >= quiz.PassingScore;

            _context.QuizAttempts.Add(attempt);
            await _context.SaveChangesAsync();

            var questionDict = quiz.Questions.ToDictionary(q => q.QuizQuestionID, q => q);

            return Ok(new QuizAttemptDto
            {
                QuizAttemptID = attempt.QuizAttemptID,
                QuizID = attempt.QuizID,
                QuizTitle = quiz.Title,
                UserID = attempt.UserID,
                Score = attempt.Score,
                TotalPoints = attempt.TotalPoints,
                Passed = attempt.Passed,
                StartedAt = attempt.StartedAt,
                CompletedAt = attempt.CompletedAt,
                Answers = attempt.Answers.Select(a => new QuizAnswerDto
                {
                    QuizAnswerID = a.QuizAnswerID,
                    QuizQuestionID = a.QuizQuestionID,
                    QuestionText = questionDict.GetValueOrDefault(a.QuizQuestionID)?.QuestionText,
                    Options = JsonSerializer.Deserialize<string[]>(questionDict.GetValueOrDefault(a.QuizQuestionID)?.Options ?? "[]"),
                    SelectedIndex = a.SelectedIndex,
                    CorrectIndex = questionDict.GetValueOrDefault(a.QuizQuestionID)?.CorrectIndex,
                    IsCorrect = a.IsCorrect
                }).ToList()
            });
        }

        // GET MY ATTEMPTS
        [HttpGet("{quizId}/attempts")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<IEnumerable<QuizAttemptDto>>> GetMyAttempts(int quizId)
        {
            var query = _context.QuizAttempts
                .Include(a => a.Quiz)
                .Include(a => a.User)
                .Where(a => a.QuizID == quizId && a.CompletedAt != null)
                .AsQueryable();

            if (IsStudent())
                query = query.Where(a => a.UserID == CurrentUserId);

            var attempts = await query
                .OrderByDescending(a => a.CompletedAt)
                .Select(a => new QuizAttemptDto
                {
                    QuizAttemptID = a.QuizAttemptID,
                    QuizID = a.QuizID,
                    QuizTitle = a.Quiz!.Title,
                    UserID = a.UserID,
                    UserName = a.User!.Name,
                    Score = a.Score,
                    TotalPoints = a.TotalPoints,
                    Passed = a.Passed,
                    StartedAt = a.StartedAt,
                    CompletedAt = a.CompletedAt
                })
                .ToListAsync();

            return Ok(attempts);
        }

        // GET ATTEMPT DETAIL
        [HttpGet("attempts/{attemptId}")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<QuizAttemptDto>> GetAttemptDetail(int attemptId)
        {
            var attempt = await _context.QuizAttempts
                .Include(a => a.Quiz).ThenInclude(q => q!.Questions)
                .Include(a => a.User)
                .Include(a => a.Answers).ThenInclude(a => a.QuizQuestion)
                .FirstOrDefaultAsync(a => a.QuizAttemptID == attemptId);

            if (attempt == null) return NotFound();

            if (IsStudent() && attempt.UserID != CurrentUserId)
                return Forbid();

            return Ok(new QuizAttemptDto
            {
                QuizAttemptID = attempt.QuizAttemptID,
                QuizID = attempt.QuizID,
                QuizTitle = attempt.Quiz!.Title,
                UserID = attempt.UserID,
                UserName = attempt.User!.Name,
                Score = attempt.Score,
                TotalPoints = attempt.TotalPoints,
                Passed = attempt.Passed,
                StartedAt = attempt.StartedAt,
                CompletedAt = attempt.CompletedAt,
                Answers = attempt.Answers.Select(a => new QuizAnswerDto
                {
                    QuizAnswerID = a.QuizAnswerID,
                    QuizQuestionID = a.QuizQuestionID,
                    QuestionText = a.QuizQuestion?.QuestionText,
                    Options = JsonSerializer.Deserialize<string[]>(a.QuizQuestion?.Options ?? "[]"),
                    SelectedIndex = a.SelectedIndex,
                    CorrectIndex = a.QuizQuestion?.CorrectIndex,
                    IsCorrect = a.IsCorrect
                }).ToList()
            });
        }
    }
}
