using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.Models;

namespace TrainingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EnrollmentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EnrollmentController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Enrollment
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Enrollment>>> GetEnrollments()
        {
            return await _context.Enrollments
                .Include(e => e.User)
                .Include(e => e.Course)
                .ToListAsync();
        }

        // GET: api/Enrollment/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Enrollment>> GetEnrollment(int id)
        {
            var enrollment = await _context.Enrollments
                .Include(e => e.User)
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e => e.EnrollmentID == id);

            if (enrollment == null)
            {
                return NotFound("Enrollment not found.");
            }

            return enrollment;
        }

        // POST: api/Enrollment
        [HttpPost]
        public async Task<ActionResult<Enrollment>> CreateEnrollment(Enrollment enrollment)
        {
            // Check User exists
            var userExists = await _context.Users.AnyAsync(u => u.UserID == enrollment.UserID);

            if (!userExists)
            {
                return BadRequest("User does not exist.");
            }

            // Check Course exists
            var courseExists = await _context.Courses.AnyAsync(c => c.CourseID == enrollment.CourseID);

            if (!courseExists)
            {
                return BadRequest("Course does not exist.");
            }

            // Prevent duplicate enrollment
            bool alreadyEnrolled = await _context.Enrollments.AnyAsync(e =>
                e.UserID == enrollment.UserID &&
                e.CourseID == enrollment.CourseID);

            if (alreadyEnrolled)
            {
                return BadRequest("User is already enrolled in this course.");
            }

            _context.Enrollments.Add(enrollment);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetEnrollment),
                new { id = enrollment.EnrollmentID },
                enrollment);
        }

        // PUT: api/Enrollment/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEnrollment(int id, Enrollment enrollment)
        {
            if (id != enrollment.EnrollmentID)
            {
                return BadRequest();
            }

            _context.Entry(enrollment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Enrollments.Any(e => e.EnrollmentID == id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        // DELETE: api/Enrollment/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEnrollment(int id)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);

            if (enrollment == null)
            {
                return NotFound();
            }

            _context.Enrollments.Remove(enrollment);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}