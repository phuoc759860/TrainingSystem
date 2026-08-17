using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Common;
using TrainingSystem.DTOs.Lesson;
using TrainingSystem.Models;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class LessonController : BaseApiController
    {
        private readonly IWebHostEnvironment _env;

        public LessonController(AppDbContext context, IWebHostEnvironment env)
            : base(context)
        {
            _env = env;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<PaginatedResult<LessonDto>>> GetLessons(
            string? search, int? courseId, [FromQuery] PaginationQuery pg)
        {
            var query = _context.Lessons
                .Include(l => l.Course)
                .Include(l => l.UnlocksAfterLesson)
                .AsQueryable();

            if (IsStudent())
            {
                query = query.Where(l =>
                    MyCourseIds().Contains(l.CourseID));
            }

            if (IsTrainer())
            {
                query = query.Where(l =>
                    l.Course!.TrainerID == CurrentUserId);
            }

            if (courseId.HasValue)
            {
                query = query.Where(l =>
                    l.CourseID == courseId);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(l =>
                    l.Title.Contains(search));
            }

            var totalCount = await query.CountAsync();

            // For students, compute unlock status
            var lessons = await query
                .OrderBy(l => l.OrderIndex)
                .ThenBy(l => l.LessonID)
                .Skip((pg.Page - 1) * pg.PageSize)
                .Take(pg.PageSize)
                .ToListAsync();

            // For students, batch-fetch progress records for correct unlock status
            Dictionary<int, List<Models.LessonProgress>> progressByCourse = new();
            if (IsStudent())
            {
                var courseIds = lessons.Select(l => l.CourseID).Distinct().ToList();
                var progressRecords = await _context.LessonProgress
                    .Where(lp => lp.UserID == CurrentUserId && courseIds.Contains(lp.CourseID))
                    .ToListAsync();
                progressByCourse = progressRecords
                    .GroupBy(lp => lp.CourseID)
                    .ToDictionary(g => g.Key, g => g.ToList());
            }

            var dtos = lessons.Select(l => new LessonDto
            {
                LessonID = l.LessonID,
                Title = l.Title,
                Description = l.Description,
                CourseID = l.CourseID,
                CourseTitle = l.Course!.Title,
                OrderIndex = l.OrderIndex,
                UnlocksAfterLessonID = l.UnlocksAfterLessonID,
                UnlocksAfterLessonTitle = l.UnlocksAfterLesson?.Title,
                IsUnlocked = IsStudent() ? IsLessonUnlocked(l, progressByCourse.GetValueOrDefault(l.CourseID)) : (bool?)null
            }).ToList();

            return Ok(new PaginatedResult<LessonDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                Page = pg.Page,
                PageSize = pg.PageSize
            });
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<LessonDto>> GetLesson(int id)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Course)
                .Include(l => l.UnlocksAfterLesson)
                .FirstOrDefaultAsync(l => l.LessonID == id);

            if (lesson == null)
                return NotFound();

            if (!await IsEnrolled(lesson.CourseID))
                return Forbid();

            bool? isUnlocked = null;
            if (IsStudent())
            {
                var progressRecords = await _context.LessonProgress
                    .Where(lp => lp.UserID == CurrentUserId && lp.CourseID == lesson.CourseID)
                    .ToListAsync();
                isUnlocked = IsLessonUnlocked(lesson, progressRecords);
            }

            return Ok(new LessonDto
            {
                LessonID = lesson.LessonID,
                Title = lesson.Title,
                Description = lesson.Description,
                CourseID = lesson.CourseID,
                CourseTitle = lesson.Course!.Title,
                OrderIndex = lesson.OrderIndex,
                UnlocksAfterLessonID = lesson.UnlocksAfterLessonID,
                UnlocksAfterLessonTitle = lesson.UnlocksAfterLesson?.Title,
                IsUnlocked = isUnlocked
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<LessonDto>> CreateLesson(CreateLessonDto dto)
        {
            var course = await _context.Courses.FindAsync(dto.CourseID);

            if (course == null)
                return NotFound(new { message = "Course does not exist." });

            if (IsTrainer() && !await OwnsCourse(dto.CourseID))
                return Forbid();

            if (dto.UnlocksAfterLessonID.HasValue)
            {
                var prereq = await _context.Lessons
                    .FirstOrDefaultAsync(l => l.LessonID == dto.UnlocksAfterLessonID && l.CourseID == dto.CourseID);
                if (prereq == null)
                    return BadRequest(new { message = "Prerequisite lesson not found in this course." });
            }

            var lesson = new Lesson
            {
                Title = dto.Title,
                Description = dto.Description,
                CourseID = dto.CourseID,
                OrderIndex = dto.OrderIndex,
                UnlocksAfterLessonID = dto.UnlocksAfterLessonID
            };

            _context.Lessons.Add(lesson);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLesson),
                new { id = lesson.LessonID },
                new LessonDto
                {
                    LessonID = lesson.LessonID,
                    Title = lesson.Title,
                    Description = lesson.Description,
                    CourseID = lesson.CourseID,
                    CourseTitle = course.Title,
                    OrderIndex = lesson.OrderIndex,
                    UnlocksAfterLessonID = lesson.UnlocksAfterLessonID
                });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> UpdateLesson(int id, UpdateLessonDto dto)
        {
            var lesson = await _context.Lessons.FindAsync(id);

            if (lesson == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(lesson.CourseID))
                return Forbid();

            // Snapshot version before updating
            var maxVersion = await _context.LessonVersions
                .Where(lv => lv.LessonID == id)
                .MaxAsync(lv => (int?)lv.VersionNumber) ?? 0;

            _context.LessonVersions.Add(new LessonVersion
            {
                LessonID = id,
                VersionNumber = maxVersion + 1,
                Title = lesson.Title,
                Description = lesson.Description,
                EditedByUserID = CurrentUserId,
                SavedAt = DateTime.UtcNow
            });

            lesson.Title = dto.Title;
            lesson.Description = dto.Description;
            lesson.CourseID = dto.CourseID;
            lesson.OrderIndex = dto.OrderIndex;
            lesson.UnlocksAfterLessonID = dto.UnlocksAfterLessonID;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/versions")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<IEnumerable<LessonVersionDto>>> GetVersions(int id)
        {
            var versions = await _context.LessonVersions
                .Include(lv => lv.EditedByUser)
                .Where(lv => lv.LessonID == id)
                .OrderByDescending(lv => lv.VersionNumber)
                .Select(lv => new LessonVersionDto
                {
                    LessonVersionID = lv.LessonVersionID,
                    LessonID = lv.LessonID,
                    VersionNumber = lv.VersionNumber,
                    Title = lv.Title,
                    Description = lv.Description,
                    EditedByUserName = lv.EditedByUser!.Name,
                    SavedAt = lv.SavedAt
                })
                .ToListAsync();

            return Ok(versions);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> DeleteLesson(int id)
        {
            var lesson = await _context.Lessons.FindAsync(id);

            if (lesson == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(lesson.CourseID))
                return Forbid();

            // Update any lessons that reference this as prerequisite
            var dependent = await _context.Lessons
                .Where(l => l.UnlocksAfterLessonID == id)
                .ToListAsync();
            foreach (var d in dependent)
                d.UnlocksAfterLessonID = lesson.UnlocksAfterLessonID;

            var materialFiles = await _context.Materials
                .Where(m => m.LessonID == id && !string.IsNullOrEmpty(m.FilePath))
                .Select(m => m.FilePath)
                .ToListAsync();

            foreach (var path in materialFiles)
            {
                var fileName = Path.GetFileName(path);
                var filePath = Path.Combine(_env.ContentRootPath, "uploads", fileName);
                if (System.IO.File.Exists(filePath))
                {
                    try { System.IO.File.Delete(filePath); } catch { }
                }
            }

            _context.Lessons.Remove(lesson);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool IsLessonUnlocked(Lesson lesson, List<LessonProgress>? progressRecords)
        {
            if (!lesson.UnlocksAfterLessonID.HasValue)
                return true;

            if (progressRecords == null)
                return false;

            return progressRecords.Any(p =>
                p.LessonID == lesson.UnlocksAfterLessonID.Value && p.IsCompleted);
        }
    }
}
