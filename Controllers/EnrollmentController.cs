using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Enrollment;
using TrainingSystem.Models;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EnrollmentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EnrollmentController(AppDbContext context)
        {
            _context = context;
        }

        // GET ALL
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnrollmentDto>>> GetEnrollments()
        {
            var enrollments = await _context.Enrollments
                .Include(e => e.User)
                .Include(e => e.Course)
                .Select(e => new EnrollmentDto
                {
                    EnrollmentID = e.EnrollmentID,
                    UserID = e.UserID,
                    UserName = e.User!.Name,
                    CourseID = e.CourseID,
                    CourseTitle = e.Course!.Title,
                    EnrollDate = e.EnrollDate,
                    Status = e.Status
                })
                .ToListAsync();

            return Ok(enrollments);
        }

        // GET BY ID
        [HttpGet("{id}")]
        public async Task<ActionResult<EnrollmentDto>> GetEnrollment(int id)
        {
            var enrollment = await _context.Enrollments
                .Include(e => e.User)
                .Include(e => e.Course)
                .Where(e => e.EnrollmentID == id)
                .Select(e => new EnrollmentDto
                {
                    EnrollmentID = e.EnrollmentID,
                    UserID = e.UserID,
                    UserName = e.User!.Name,
                    CourseID = e.CourseID,
                    CourseTitle = e.Course!.Title,
                    EnrollDate = e.EnrollDate,
                    Status = e.Status
                })
                .FirstOrDefaultAsync();

            if (enrollment == null)
                return NotFound();

            return Ok(enrollment);
        }

        // CREATE
        [HttpPost]
        public async Task<ActionResult<EnrollmentDto>> CreateEnrollment(CreateEnrollmentDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserID);

            if (user == null)
                return NotFound(new
                {
                    message = "User does not exist."
                });

            var course = await _context.Courses.FindAsync(dto.CourseID);

            if (course == null)
                return NotFound(new
                {
                    message = "Course does not exist."
                });

            bool exists = await _context.Enrollments.AnyAsync(e =>
                e.UserID == dto.UserID &&
                e.CourseID == dto.CourseID);

            if (exists)
                return NotFound(new
                {
                    message = "User already enrolled."
                });

            var enrollment = new Enrollment
            {
                UserID = dto.UserID,
                CourseID = dto.CourseID,
                EnrollDate = dto.EnrollDate,
                Status = dto.Status
            };

            _context.Enrollments.Add(enrollment);

            await _context.SaveChangesAsync();

            var result = new EnrollmentDto
            {
                EnrollmentID = enrollment.EnrollmentID,
                UserID = user.UserID,
                UserName = user.Name,
                CourseID = course.CourseID,
                CourseTitle = course.Title,
                EnrollDate = enrollment.EnrollDate,
                Status = enrollment.Status
            };

            return CreatedAtAction(nameof(GetEnrollment),
                new { id = enrollment.EnrollmentID }, result);
        }

        // UPDATE STATUS
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEnrollment(int id, UpdateEnrollmentDto dto)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);

            if (enrollment == null)
                return NotFound();

            enrollment.Status = dto.Status;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnrollment(int id)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);

            if (enrollment == null)
                return NotFound();

            _context.Enrollments.Remove(enrollment);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}