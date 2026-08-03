using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Common;
using TrainingSystem.DTOs.QuestionBank;
using TrainingSystem.Models;

namespace TrainingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Trainer")]
    public class QuestionBankController : BaseApiController
    {
        public QuestionBankController(AppDbContext context) : base(context) { }

        [HttpGet]
        public async Task<ActionResult<PaginatedResult<QuestionBankDto>>> GetQuestions(
            int? examId, string? search, [FromQuery] PaginationQuery pg)
        {
            var query = _context.QuestionBanks
                .Include(q => q.Exam)
                .AsQueryable();

            if (IsTrainer())
            {
                query = query.Where(q => q.Exam != null &&
                    _context.Courses.Any(c => c.CourseID == q.Exam.CourseID && c.TrainerID == CurrentUserId));
            }

            if (examId.HasValue)
                query = query.Where(q => q.ExamID == examId.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower();
                query = query.Where(q =>
                    q.Content.ToLower().Contains(search) ||
                    (q.Exam != null && q.Exam.Title.ToLower().Contains(search)) ||
                    q.QuestionType.ToLower().Contains(search));
            }

            var totalCount = await query.CountAsync();

            var entities = await query
                .OrderBy(q => q.QuestionID)
                .Skip((pg.Page - 1) * pg.PageSize)
                .Take(pg.PageSize)
                .ToListAsync();

            var items = entities.Select(ToDto).ToList();

            return Ok(new PaginatedResult<QuestionBankDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pg.Page,
                PageSize = pg.PageSize
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<QuestionBankDto>> GetQuestion(int id)
        {
            var question = await _context.QuestionBanks
                .Include(q => q.Exam)
                .FirstOrDefaultAsync(q => q.QuestionID == id);

            if (question?.Exam == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(question.Exam.CourseID))
                return Forbid();

            return Ok(ToDto(question));
        }

        [HttpPost]
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
                Score = dto.Score,
                RubricJson = dto.Rubric != null && dto.Rubric.Count > 0
                    ? JsonSerializer.Serialize(dto.Rubric)
                    : null
            };

            _context.QuestionBanks.Add(question);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetQuestion), new { id = question.QuestionID },
                new QuestionBankDto
                {
                    QuestionID = question.QuestionID,
                    ExamID = question.ExamID,
                    ExamTitle = exam.Title,
                    Content = question.Content,
                    QuestionType = question.QuestionType,
                    OptionA = question.OptionA ?? "",
                    OptionB = question.OptionB ?? "",
                    OptionC = question.OptionC ?? "",
                    OptionD = question.OptionD ?? "",
                    CorrectAnswer = question.CorrectAnswer ?? "",
                    Score = question.Score,
                    Rubric = DeserializeRubric(question.RubricJson)
                });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<QuestionBankDto>> UpdateQuestion(int id, UpdateQuestionDto dto)
        {
            var question = await _context.QuestionBanks
                .Include(q => q.Exam)
                .FirstOrDefaultAsync(q => q.QuestionID == id);

            if (question?.Exam == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(question.Exam.CourseID))
                return Forbid();

            question.Content = dto.Content;
            question.QuestionType = dto.QuestionType;
            question.OptionA = dto.OptionA;
            question.OptionB = dto.OptionB;
            question.OptionC = dto.OptionC;
            question.OptionD = dto.OptionD;
            question.CorrectAnswer = dto.CorrectAnswer;
            question.Score = dto.Score;
            question.RubricJson = dto.Rubric != null && dto.Rubric.Count > 0
                ? JsonSerializer.Serialize(dto.Rubric)
                : null;

            await _context.SaveChangesAsync();

            return Ok(ToDto(question));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteQuestion(int id)
        {
            var question = await _context.QuestionBanks
                .Include(q => q.Exam)
                .FirstOrDefaultAsync(q => q.QuestionID == id);

            if (question?.Exam == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(question.Exam.CourseID))
                return Forbid();

            _context.QuestionBanks.Remove(question);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static QuestionBankDto ToDto(QuestionBank q)
        {
            return new QuestionBankDto
            {
                QuestionID = q.QuestionID,
                ExamID = q.ExamID,
                ExamTitle = q.Exam?.Title ?? "",
                Content = q.Content,
                QuestionType = q.QuestionType,
                OptionA = q.OptionA ?? "",
                OptionB = q.OptionB ?? "",
                OptionC = q.OptionC ?? "",
                OptionD = q.OptionD ?? "",
                CorrectAnswer = q.CorrectAnswer ?? "",
                Score = q.Score,
                Rubric = DeserializeRubric(q.RubricJson)
            };
        }

        private static List<RubricCriterionDto>? DeserializeRubric(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            try
            {
                return JsonSerializer.Deserialize<List<RubricCriterionDto>>(json);
            }
            catch
            {
                return null;
            }
        }
    }
}
