using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.QuestionBank;
using TrainingSystem.Models;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuestionBankController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QuestionBankController(AppDbContext context)
        {
            _context = context;
        }
        
        // GET ALL QUESTIONS
        [HttpGet]
        public async Task<IActionResult> GetQuestions()
        {
            var questions = await _context.QuestionBanks
                .Include(q => q.Exam)
                .Select(q => new QuestionDto
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

            return Ok(questions);
        }

        // GET QUESTION BY ID
        [HttpGet("{id}")]
        public async Task<ActionResult<QuestionDto>> GetQuestion(int id)
        {
            var question = await _context.QuestionBanks
                .Include(q => q.Exam)
                .Where(q => q.QuestionID == id)
                .Select(q => new QuestionDto
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

            return Ok(question);
        }

        // CREATE QUESTION
        [HttpPost]
        public async Task<ActionResult<QuestionDto>> CreateQuestion(CreateQuestionDto dto)
        {
            var exam = await _context.Exams.FindAsync(dto.ExamID);

            if (exam == null)
                return NotFound(new
                {
                    message = "Exam not found."
                });

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

            return Ok(new QuestionDto
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

        // UPDATE QUESTION
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuestion(int id, UpdateQuestionDto dto)
        {
            var question = await _context.QuestionBanks.FindAsync(id);

            if (question == null)
                return NotFound();

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

        // DELETE QUESTION
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var question = await _context.QuestionBanks.FindAsync(id);

            if (question == null)
                return NotFound();

            _context.QuestionBanks.Remove(question);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}