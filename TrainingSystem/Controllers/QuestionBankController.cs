using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Common;
using TrainingSystem.DTOs.QuestionBank;
using TrainingSystem.Models;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class QuestionBankController : BaseApiController
    {
        public QuestionBankController(AppDbContext context)
            : base(context)
        {
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<IActionResult> GetQuestions(int? examId, [FromQuery] PaginationQuery pg)
        {
            var query = _context.QuestionBanks
                .Include(q => q.Exam)
                .AsQueryable();

            if (examId.HasValue)
            {
                query = query.Where(q => q.ExamID == examId);
            }

            if (IsStudent())
            {
                query = query.Where(q =>
                    MyCourseIds().Contains(q.Exam!.CourseID));
            }

            var totalCount = await query.CountAsync();

            var questions = await query
                .OrderBy(q => q.QuestionID)
                .Skip((pg.Page - 1) * pg.PageSize)
                .Take(pg.PageSize)
                .Select(q => new QuestionBankDto
                {
                    QuestionID = q.QuestionID,
                    ExamID = q.ExamID,
                    ExamTitle = q.Exam!.Title,
                    Content = q.Content,
                    QuestionType = q.QuestionType,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    CorrectAnswer = q.CorrectAnswer,
                    Score = q.Score
                })
                .ToListAsync();

            if (IsStudent())
            {
                foreach (var q in questions)
                    q.CorrectAnswer = "";
            }

            return Ok(new PaginatedResult<QuestionBankDto>
            {
                Items = questions,
                TotalCount = totalCount,
                Page = pg.Page,
                PageSize = pg.PageSize
            });
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<QuestionBankDto>> GetQuestion(int id)
        {
            var question = await _context.QuestionBanks
                .Include(q => q.Exam)
                .Where(q => q.QuestionID == id)
                .Select(q => new QuestionBankDto
                {
                    QuestionID = q.QuestionID,
                    ExamID = q.ExamID,
                    ExamTitle = q.Exam!.Title,
                    Content = q.Content,
                    QuestionType = q.QuestionType,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    CorrectAnswer = q.CorrectAnswer,
                    Score = q.Score
                })
                .FirstOrDefaultAsync();

            if (question == null)
                return NotFound();

            var courseId = await _context.Exams
                .Where(e => e.ExamID == question.ExamID)
                .Select(e => e.CourseID)
                .FirstOrDefaultAsync();

            if (!await IsEnrolled(courseId))
                return Forbid();

            if (IsStudent())
                question.CorrectAnswer = "";

            return Ok(question);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<QuestionBankDto>> CreateQuestion(CreateQuestionDto dto)
        {
            var exam = await _context.Exams.FindAsync(dto.ExamID);

            if (exam == null)
                return NotFound(new { message = "Exam not found." });

            if (IsTrainer() && !await OwnsCourse(exam.CourseID))
                return Forbid();

            var question = new QuestionBank
            {
                ExamID = dto.ExamID,
                Content = dto.Content,
                QuestionType = dto.QuestionType,
                OptionA = dto.OptionA,
                OptionB = dto.OptionB,
                OptionC = dto.OptionC,
                OptionD = dto.OptionD,
                CorrectAnswer = dto.CorrectAnswer,
                Score = dto.Score
            };

            _context.QuestionBanks.Add(question);
            await _context.SaveChangesAsync();

            return Ok(new QuestionBankDto
            {
                QuestionID = question.QuestionID,
                ExamID = question.ExamID,
                ExamTitle = exam.Title,
                Content = question.Content,
                QuestionType = question.QuestionType,
                OptionA = question.OptionA,
                OptionB = question.OptionB,
                OptionC = question.OptionC,
                OptionD = question.OptionD,
                CorrectAnswer = question.CorrectAnswer,
                Score = question.Score
            });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> UpdateQuestion(int id, UpdateQuestionDto dto)
        {
            var question = await _context.QuestionBanks
                .Include(q => q.Exam)
                .FirstOrDefaultAsync(q => q.QuestionID == id);

            if (question == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(question.Exam!.CourseID))
                return Forbid();

            question.Content = dto.Content;
            question.QuestionType = dto.QuestionType;
            question.OptionA = dto.OptionA;
            question.OptionB = dto.OptionB;
            question.OptionC = dto.OptionC;
            question.OptionD = dto.OptionD;
            question.CorrectAnswer = dto.CorrectAnswer;
            question.Score = dto.Score;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var question = await _context.QuestionBanks
                .Include(q => q.Exam)
                .FirstOrDefaultAsync(q => q.QuestionID == id);

            if (question == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(question.Exam!.CourseID))
                return Forbid();

            _context.QuestionBanks.Remove(question);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
