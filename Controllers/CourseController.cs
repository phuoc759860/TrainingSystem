using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Course;
using TrainingSystem.Models;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CourseController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CourseController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Course
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetCourses()
        {
            var courses = await _context.Courses
                .Include(c => c.Trainer)
                .Select(c => new CourseDto
                {
                    CourseID = c.CourseID,
                    Title = c.Title,
                    Description = c.Description,
                    TrainerID = c.TrainerID,
                    TrainerName = c.Trainer!.Name
                })
                .ToListAsync();

            return Ok(courses);
        }

        // GET: api/Course/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CourseDto>> GetCourse(int id)
        {
            var course = await _context.Courses
                .Include(c => c.Trainer)
                .Where(c => c.CourseID == id)
                .Select(c => new CourseDto
                {
                    CourseID = c.CourseID,
                    Title = c.Title,
                    Description = c.Description,
                    TrainerID = c.TrainerID,
                    TrainerName = c.Trainer!.Name
                })
                .FirstOrDefaultAsync();

            if (course == null)
                return NotFound();

            return Ok(course);
        }

        // POST: api/Course
        [HttpPost]
        public async Task<ActionResult<CourseDto>> CreateCourse(CreateCourseDto dto)
        {
            var trainer = await _context.Users.FindAsync(dto.TrainerID);

            if (trainer == null)
                return NotFound(new
                {
                  message = "Trainer does not exist."  
                });

            var course = new Course
            {
                Title = dto.Title,
                Description = dto.Description,
                TrainerID = dto.TrainerID
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            var result = new CourseDto
            {
                CourseID = course.CourseID,
                Title = course.Title,
                Description = course.Description,
                TrainerID = trainer.UserID,
                TrainerName = trainer.Name
            };

            return CreatedAtAction(nameof(GetCourse),
                new { id = course.CourseID }, result);
        }

        // PUT: api/Course/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCourse(int id, UpdateCourseDto dto)
        {
            var course = await _context.Courses.FindAsync(id);

            if (course == null)
                return NotFound();

            var trainerExists = await _context.Users
                .AnyAsync(u => u.UserID == dto.TrainerID);

            if (!trainerExists)
                return NotFound(new
                {
                    message = "Trainer does not exist."
                });

            course.Title = dto.Title;
            course.Description = dto.Description;
            course.TrainerID = dto.TrainerID;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Course/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _context.Courses.FindAsync(id);

            if (course == null)
                return NotFound();

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}