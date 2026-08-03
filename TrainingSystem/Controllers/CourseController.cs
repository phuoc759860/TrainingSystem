using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Common;
using TrainingSystem.DTOs.Course;
using TrainingSystem.Models;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CourseController : BaseApiController
    {
        public CourseController(AppDbContext context)
            : base(context)
        {
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<PaginatedResult<CourseDto>>> GetCourses(
            string? search, [FromQuery] PaginationQuery pg)
        {
            var query = _context.Courses
                .Include(c => c.Trainer)
                .Where(c => !c.IsDeleted)
                .AsQueryable();

            if (IsTrainer())
            {
                query = query.Where(c => c.TrainerID == CurrentUserId);
            }
            else if (IsStudent())
            {
                // Students only see published courses.
                query = query.Where(c => c.IsPublished);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(c =>
                    c.Title.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var courses = await query
                .OrderBy(c => c.Title)
                .Skip((pg.Page - 1) * pg.PageSize)
                .Take(pg.PageSize)
                .Select(c => new CourseDto
                {
                    CourseID = c.CourseID,
                    Title = c.Title,
                    Description = c.Description,
                    TrainerID = c.TrainerID,
                    TrainerName = c.Trainer!.Name,
                    Price = c.Price,
                    Currency = c.Currency,
                    IsPublished = c.IsPublished,
                    ContentVersion = c.ContentVersion,
                    StartDate = c.StartDate
                })
                .ToListAsync();

            return Ok(new PaginatedResult<CourseDto>
            {
                Items = courses,
                TotalCount = totalCount,
                Page = pg.Page,
                PageSize = pg.PageSize
            });
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<CourseDto>> GetCourse(int id)
        {
            var course = await _context.Courses
                .Include(c => c.Trainer)
                .Where(c => c.CourseID == id && !c.IsDeleted)
                .Select(c => new CourseDto
                {
                    CourseID = c.CourseID,
                    Title = c.Title,
                    Description = c.Description,
                    TrainerID = c.TrainerID,
                    TrainerName = c.Trainer!.Name,
                    Price = c.Price,
                    Currency = c.Currency,
                    IsPublished = c.IsPublished,
                    ContentVersion = c.ContentVersion,
                    StartDate = c.StartDate
                })
                .FirstOrDefaultAsync();

            if (course == null)
                return NotFound();

            // Drafts are invisible to students (even enrolled ones) until published.
            if (IsStudent() && !course.IsPublished)
                return NotFound();

            if (!await IsEnrolled(course.CourseID))
                return Forbid();

            return Ok(course);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<CourseDto>> CreateCourse(CreateCourseDto dto)
        {
            if (IsTrainer())
            {
                dto.TrainerID = CurrentUserId;
            }

            var trainer = await _context.Users.FindAsync(dto.TrainerID);

            if (trainer == null)
                return NotFound(new { message = "Trainer does not exist." });

            var course = new Course
            {
                Title = dto.Title,
                Description = dto.Description,
                TrainerID = dto.TrainerID,
                Price = dto.Price > 0 ? dto.Price : 0,
                StartDate = dto.StartDate,
                IsPublished = false
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCourse),
                new { id = course.CourseID },
                new CourseDto
                {
                    CourseID = course.CourseID,
                    Title = course.Title,
                    Description = course.Description,
                    TrainerID = trainer.UserID,
                    TrainerName = trainer.Name,
                    Price = course.Price,
                    Currency = course.Currency,
                    IsPublished = course.IsPublished,
                    ContentVersion = course.ContentVersion,
                    StartDate = course.StartDate
                });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> UpdateCourse(int id, UpdateCourseDto dto)
        {
            var course = await _context.Courses.FindAsync(id);

            if (course == null || course.IsDeleted)
                return NotFound();

            var result = await CheckCourseOwner(course.CourseID);
            if (result != null)
                return result;

            var trainerExists = await _context.Users
                .AnyAsync(u => u.UserID == dto.TrainerID);

            if (!trainerExists)
                return NotFound(new { message = "Trainer does not exist." });

            course.Title = dto.Title;
            course.Description = dto.Description;
            course.TrainerID = dto.TrainerID;
            course.Price = dto.Price > 0 ? dto.Price : 0;
            course.StartDate = dto.StartDate;

            // Editing a live course silently changes it for enrolled students.
            // Send it back to draft; the trainer republishes when ready.
            if (course.IsPublished)
                course.IsPublished = false;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/publish")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> PublishCourse(int id)
        {
            var course = await _context.Courses.FindAsync(id);

            if (course == null || course.IsDeleted)
                return NotFound();

            var result = await CheckCourseOwner(course.CourseID);
            if (result != null)
                return result;

            if (!course.IsPublished)
            {
                course.IsPublished = true;
                course.ContentVersion++;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Course published.", contentVersion = course.ContentVersion });
        }

        [HttpPost("{id}/unpublish")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> UnpublishCourse(int id)
        {
            var course = await _context.Courses.FindAsync(id);

            if (course == null || course.IsDeleted)
                return NotFound();

            var result = await CheckCourseOwner(course.CourseID);
            if (result != null)
                return result;

            course.IsPublished = false;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Course unpublished." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _context.Courses.FindAsync(id);

            if (course == null || course.IsDeleted)
                return NotFound();

            var result = await CheckCourseOwner(course.CourseID);
            if (result != null)
                return result;

            course.IsDeleted = true;
            course.DeletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RestoreCourse(int id)
        {
            var course = await _context.Courses.FindAsync(id);

            if (course == null)
                return NotFound();

            if (!course.IsDeleted)
                return BadRequest(new { message = "Course is not deleted." });

            course.IsDeleted = false;
            course.DeletedAt = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Course restored." });
        }
    }
}
