using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.ExamResult;
using TrainingSystem.Models;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExamResultController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExamResultController(AppDbContext context)
        {
            _context = context;
        }

        // =====================================
        // GET ALL EXAM RESULTS
        // =====================================
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ExamResultDto>>> GetAllResults()
        {
            var results = await _context.ExamResult
                .Include(r => r.User)
                .Include(r => r.Exam)
                .Select(r => new ExamResultDto
                {
                    ResultID = r.ResultID,
                    UserID = r.UserID,
                    ExamID = r.ExamID,
                    UserName = r.User!.Name,
                    ExamTitle = r.Exam!.Title,
                    Score = r.Score,
                    Passed = r.Passed,
                    SubmittedAt = r.SubmittedAt
                })
                .ToListAsync();

            return Ok(results);
        }

        // =====================================
        // GET RESULT BY ID
        // =====================================
        [HttpGet("{id}")]
        public async Task<ActionResult<ExamResultDto>> GetResult(int id)
        {
            var result = await _context.ExamResult
                .Include(r => r.User)
                .Include(r => r.Exam)
                .Where(r => r.ResultID == id)
                .Select(r => new ExamResultDto
                {
                    ResultID = r.ResultID,
                    UserID = r.UserID,
                    ExamID = r.ExamID,
                    UserName = r.User!.Name,
                    ExamTitle = r.Exam!.Title,
                    Score = r.Score,
                    Passed = r.Passed,
                    SubmittedAt = r.SubmittedAt
                })
                .FirstOrDefaultAsync();

            if (result == null)
                return NotFound("Exam result not found.");

            return Ok(result);
        }

        // =====================================
        // CREATE RESULT
        // =====================================
        [HttpPost]
        public async Task<ActionResult<ExamResultDto>> CreateResult(CreateExamResultDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserID);

            if (user == null)
                return BadRequest("User not found.");

            var exam = await _context.Exams.FindAsync(dto.ExamID);

            if (exam == null)
                return BadRequest("Exam not found.");

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

        // =====================================
        // UPDATE RESULT
        // =====================================
        [HttpPut("{id}")]
        public async Task<ActionResult<ExamResultDto>> UpdateResult(int id, CreateExamResultDto dto)
        {
            var result = await _context.ExamResult.FindAsync(id);

            if (result == null)
                return NotFound("Exam result not found.");

            var user = await _context.Users.FindAsync(dto.UserID);

            if (user == null)
                return BadRequest("User not found.");

            var exam = await _context.Exams.FindAsync(dto.ExamID);

            if (exam == null)
                return BadRequest("Exam not found.");

            result.UserID = dto.UserID;
            result.ExamID = dto.ExamID;
            result.Score = dto.Score;
            result.Passed = dto.Score >= 50;

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

        // =====================================
        // DELETE RESULT
        // =====================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResult(int id)
        {
            var result = await _context.ExamResult.FindAsync(id);

            if (result == null)
                return NotFound("Exam result not found.");

            _context.ExamResult.Remove(result);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}