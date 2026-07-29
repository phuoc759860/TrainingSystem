using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TrainingSystem.Data;
using TrainingSystem.Models;

namespace TrainingSystem.Controllers
{
    [ApiController]
    public abstract class BaseApiController : ControllerBase
    {
        protected readonly AppDbContext _context;

        public BaseApiController(AppDbContext context)
        {
            _context = context;
        }

        protected int CurrentUserId
        {
            get
            {
                return int.Parse(
                    User.FindFirst("UserID")!.Value
                );
            }
        }

        protected bool IsAdmin()
        {
            return User.IsInRole("Admin");
        }

        protected bool IsTrainer()
        {
            return User.IsInRole("Trainer");
        }

        protected bool IsStudent()
        {
            return User.IsInRole("Student");
        }

        protected async Task<bool> IsEnrolled(int courseId)
        {
            if (!IsStudent())
                return true;

            return await _context.Enrollments.AnyAsync(e =>
                e.UserID == CurrentUserId &&
                e.CourseID == courseId);
        }

        protected async Task<IActionResult?> CheckEnrollment(int courseId)
        {
            if (!await IsEnrolled(courseId))
                return Forbid();

            return null;
        }

        protected async Task<bool> OwnsCourse(int courseId)
        {
            if (IsAdmin())
                return true;

            return await _context.Courses.AnyAsync(c =>
                c.CourseID == courseId &&
                c.TrainerID == CurrentUserId);
        }

        protected async Task<IActionResult?> CheckCourseOwner(int courseId)
        {
            if (!await OwnsCourse(courseId))
                return Forbid();

            return null;
        }

        protected IQueryable<int> MyCourseIds()
            {
                return _context.Enrollments
                    .Where(e => e.UserID == CurrentUserId)
                    .Select(e => e.CourseID);
            }
    }   
}