using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Certificate;
using TrainingSystem.Models;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CertificateController : BaseApiController
    {
        public CertificateController(AppDbContext context) : base(context) { }

        private async Task<CourseCompletionDto> GetCompletion(int courseId, int userId)
        {
            var course = await _context.Courses
                .Include(c => c.Lessons)
                .Include(c => c.Exams)
                .FirstOrDefaultAsync(c => c.CourseID == courseId);

            if (course == null)
                return new CourseCompletionDto { Complete = false, Reason = "Course not found." };

            var lessonsTotal = course.Lessons.Count;
            var lessonsCompleted = await _context.LessonProgress
                .CountAsync(p => p.CourseID == courseId && p.UserID == userId && p.IsCompleted);

            var allLessonsDone = lessonsTotal == 0 || lessonsCompleted >= lessonsTotal;

            // A course is complete when all lessons are done AND any exam is passed
            // (or no exam exists at all).
            var passedExam = false;
            var exam = course.Exams.FirstOrDefault();
            if (exam != null)
            {
                passedExam = await _context.ExamResult.AnyAsync(r =>
                    r.ExamID == exam.ExamID && r.UserID == userId && r.Passed);
            }

            var complete = allLessonsDone && (exam == null || passedExam);

            return new CourseCompletionDto
            {
                Complete = complete,
                LessonsCompleted = lessonsCompleted,
                LessonsTotal = lessonsTotal,
                PassedExam = passedExam,
                Reason = complete
                    ? null
                    : (allLessonsDone
                        ? "You must pass the course exam."
                        : "Complete all lessons first.")
            };
        }

        // GET api/certificate/my
        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<CertificateDto>>> GetMyCertificates()
        {
            var certificates = await _context.Certificates
                .Include(c => c.Course)
                    .ThenInclude(c => c!.Trainer)
                .Where(c => c.UserID == CurrentUserId)
                .OrderByDescending(c => c.IssueDate)
                .Select(c => new CertificateDto
                {
                    CertificateID = c.CertificateID,
                    CertificateNumber = c.CertificateNumber,
                    UserID = c.UserID,
                    UserName = c.User!.Name,
                    CourseID = c.CourseID,
                    CourseTitle = c.Course!.Title,
                    TrainerName = c.Course.Trainer != null ? c.Course.Trainer.Name : "",
                    IssueDate = c.IssueDate
                })
                .ToListAsync();

            return Ok(certificates);
        }

        // GET api/certificate/course/{courseId}  -- my certificate for one course
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<object>> GetCertificateForCourse(int courseId)
        {
            var cert = await _context.Certificates
                .Include(c => c.Course)
                    .ThenInclude(c => c!.Trainer)
                .FirstOrDefaultAsync(c => c.CourseID == courseId && c.UserID == CurrentUserId);

            if (cert == null)
                return Ok(new { issued = false });

            return Ok(new CertificateDto
            {
                CertificateID = cert.CertificateID,
                CertificateNumber = cert.CertificateNumber,
                UserID = cert.UserID,
                UserName = cert.User!.Name,
                CourseID = cert.CourseID,
                CourseTitle = cert.Course!.Title,
                TrainerName = cert.Course.Trainer != null ? cert.Course.Trainer.Name : "",
                IssueDate = cert.IssueDate
            });
        }

        // GET api/certificate/course/{courseId}/completion
        [HttpGet("course/{courseId}/completion")]
        public async Task<ActionResult<CourseCompletionDto>> GetCompletionStatus(int courseId)
        {
            if (!await IsEnrolled(courseId))
                return Forbid();

            return Ok(await GetCompletion(courseId, CurrentUserId));
        }

        // POST api/certificate/issue/{courseId}  -- issue a certificate once completed
        [HttpPost("issue/{courseId}")]
        public async Task<ActionResult<CertificateDto>> IssueCertificate(int courseId)
        {
            if (!await IsEnrolled(courseId))
                return Forbid();

            var existing = await _context.Certificates
                .AnyAsync(c => c.CourseID == courseId && c.UserID == CurrentUserId);

            if (existing)
                return Conflict(new { message = "Certificate already issued for this course." });

            var completion = await GetCompletion(courseId, CurrentUserId);
            if (!completion.Complete)
                return BadRequest(new { message = completion.Reason ?? "Course not completed yet." });

            var user = await _context.Users.FindAsync(CurrentUserId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            var course = await _context.Courses
                .Include(c => c.Trainer)
                .FirstOrDefaultAsync(c => c.CourseID == courseId);
            if (course == null)
                return NotFound(new { message = "Course not found." });

            var certificate = new Certificate
            {
                CertificateNumber = GenerateCertificateNumber(),
                UserID = CurrentUserId,
                CourseID = courseId,
                IssueDate = DateTime.UtcNow
            };

            _context.Certificates.Add(certificate);
            await _context.SaveChangesAsync();

            return Ok(new CertificateDto
            {
                CertificateID = certificate.CertificateID,
                CertificateNumber = certificate.CertificateNumber,
                UserID = certificate.UserID,
                UserName = user.Name,
                CourseID = certificate.CourseID,
                CourseTitle = course.Title,
                TrainerName = course.Trainer?.Name ?? "",
                IssueDate = certificate.IssueDate
            });
        }

        private static string GenerateCertificateNumber()
        {
            // e.g. CERT-2026-8F3A9B2C
            var stamp = DateTime.UtcNow.ToString("yyyy");
            var random = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
            return $"CERT-{stamp}-{random}";
        }
    }
}
