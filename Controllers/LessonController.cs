using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Lesson;
using TrainingSystem.Models;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LessonController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LessonController(AppDbContext context)
        {
            _context = context;
        }

        // GET ALL
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LessonDto>>> GetLessons()
        {
            var lessons = await _context.Lessons
                .Include(l => l.Course)
                .Select(l => new LessonDto
                {
                    LessonID = l.LessonID,
                    Title = l.Title,
                    Description = l.Description,
                    CourseID = l.CourseID,
                    CourseTitle = l.Course!.Title
                })
                .ToListAsync();

            return Ok(lessons);
        }

        // GET BY ID
        [HttpGet("{id}")]
        public async Task<ActionResult<LessonDto>> GetLesson(int id)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Course)
                .Where(l => l.LessonID == id)
                .Select(l => new LessonDto
                {
                    LessonID = l.LessonID,
                    Title = l.Title,
                    Description = l.Description,
                    CourseID = l.CourseID,
                    CourseTitle = l.Course!.Title
                })
                .FirstOrDefaultAsync();

            if (lesson == null)
                return NotFound();

            return Ok(lesson);
        }

        // CREATE
        [HttpPost]
        public async Task<ActionResult<LessonDto>> CreateLesson(CreateLessonDto dto)
        {
            var course = await _context.Courses.FindAsync(dto.CourseID);

            if (course == null)
                return NotFound(new
                {
                    message = "Course does not exist."
                });

            var lesson = new Lesson
            {
                Title = dto.Title,
                Description = dto.Description,
                CourseID = dto.CourseID
            };

            _context.Lessons.Add(lesson);

            await _context.SaveChangesAsync();

            var result = new LessonDto
            {
                LessonID = lesson.LessonID,
                Title = lesson.Title,
                Description = lesson.Description,
                CourseID = lesson.CourseID,
                CourseTitle = course.Title
            };

            return CreatedAtAction(nameof(GetLesson),
                new { id = lesson.LessonID },
                result);
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLesson(int id, UpdateLessonDto dto)
        {
            var lesson = await _context.Lessons.FindAsync(id);

            if (lesson == null)
                return NotFound();

            lesson.Title = dto.Title;
            lesson.Description = dto.Description;
            lesson.CourseID = dto.CourseID;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLesson(int id)
        {
            var lesson = await _context.Lessons.FindAsync(id);

            if (lesson == null)
                return NotFound();

            _context.Lessons.Remove(lesson);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}