using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Common;
using TrainingSystem.DTOs.Enrollment;
using TrainingSystem.Models;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EnrollmentController : BaseApiController
    {
        public EnrollmentController(AppDbContext context) : base(context) { }

        [HttpGet]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<PaginatedResult<EnrollmentDto>>> GetEnrollments(
            [FromQuery] PaginationQuery pg)
        {
            var query = _context.Enrollments
                .Include(e => e.User)
                .Include(e => e.Course)
                .AsQueryable();

            if (IsTrainer())
            {
                query = query.Where(e => e.Course != null && e.Course.TrainerID == CurrentUserId);
            }

            var totalCount = await query.CountAsync();

            var enrollments = await query
                .OrderByDescending(e => e.EnrollDate)
                .Skip((pg.Page - 1) * pg.PageSize)
                .Take(pg.PageSize)
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

            return Ok(new PaginatedResult<EnrollmentDto>
            {
                Items = enrollments,
                TotalCount = totalCount,
                Page = pg.Page,
                PageSize = pg.PageSize
            });
        }

        [HttpGet("my")]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult<List<EnrollmentDto>>> GetMyEnrollments()
        {
            var enrollments = await _context.Enrollments
                .Include(e => e.Course)
                .Where(e => e.UserID == CurrentUserId)
                .OrderByDescending(e => e.EnrollDate)
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

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
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

        [HttpPost]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<EnrollmentDto>> CreateEnrollment(CreateEnrollmentDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserID);
            if (user == null)
                return NotFound(new { message = "User does not exist." });

            var course = await _context.Courses.FindAsync(dto.CourseID);
            if (course == null)
                return NotFound(new { message = "Course does not exist." });

            bool exists = await _context.Enrollments.AnyAsync(e =>
                e.UserID == dto.UserID &&
                e.CourseID == dto.CourseID);

            if (exists)
                return Conflict(new { message = "User already enrolled." });

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

        [HttpPost("enroll")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> EnrollSelf(EnrollSelfDto dto)
        {
            var course = await _context.Courses.FindAsync(dto.CourseID);
            if (course == null)
                return NotFound(new { message = "Course does not exist." });

            var alreadyEnrolled = await _context.Enrollments.AnyAsync(e =>
                e.UserID == CurrentUserId && e.CourseID == dto.CourseID);

            if (alreadyEnrolled)
                return Conflict(new { message = "You are already enrolled in this course." });

            var enrollment = new Enrollment
            {
                UserID = CurrentUserId,
                CourseID = dto.CourseID,
                EnrollDate = DateTime.UtcNow,
                Status = "Enrolled"
            };

            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                enrollment.EnrollmentID,
                courseID = course.CourseID,
                courseTitle = course.Title,
                message = "Successfully enrolled."
            });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> UpdateEnrollment(int id, UpdateEnrollmentDto dto)
        {
            var enrollment = await _context.Enrollments.FindAsync(id);

            if (enrollment == null)
                return NotFound();

            enrollment.Status = dto.Status;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
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
