using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Exam;
using TrainingSystem.Models;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExamController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExamController(AppDbContext context)
        {
            _context = context;
        }

        // GET ALL
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ExamDto>>> GetExams()
        {
            var exams = await _context.Exams
                .Include(e => e.Course)
                .Select(e => new ExamDto
                {
                    ExamID = e.ExamID,
                    Title = e.Title,
                    CourseID = e.CourseID,
                    CourseTitle = e.Course!.Title
                })
                .ToListAsync();

            return Ok(exams);
        }

        // GET BY ID
        [HttpGet("{id}")]
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
                    CourseTitle = e.Course!.Title
                })
                .FirstOrDefaultAsync();

            if (exam == null)
                return NotFound();

            return Ok(exam);
        }

        // CREATE
        [HttpPost]
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
                CourseID = dto.CourseID
            };

            _context.Exams.Add(exam);

            await _context.SaveChangesAsync();

            var result = new ExamDto
            {
                ExamID = exam.ExamID,
                Title = exam.Title,
                CourseID = course.CourseID,
                CourseTitle = course.Title
            };

            return CreatedAtAction(nameof(GetExam),
                new { id = exam.ExamID },
                result);
        }

        // UPDATE
        [HttpPut("{id}")]
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

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
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