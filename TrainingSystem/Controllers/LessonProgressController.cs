using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Progress;
using TrainingSystem.Models;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class LessonProgressController : BaseApiController
    {
        public LessonProgressController(AppDbContext context)
            : base(context) { }

        // GET PROGRESS FOR CURRENT USER
        [HttpGet]
        [Authorize(Roles = "Admin,Trainer,Student")]
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public async Task<ActionResult<IEnumerable<LessonProgressDto>>> GetProgress(int? courseId)
        {
            var query = _context.LessonProgress
                .Include(lp => lp.User)
                .Include(lp => lp.Lesson)
                .Include(lp => lp.Course)
                .Include(lp => lp.LastMaterial)
                .Where(lp => lp.UserID == CurrentUserId)
                .AsQueryable();

            if (courseId.HasValue)
            {
                query = query.Where(lp => lp.CourseID == courseId);
            }

            var progress = await query
                .OrderByDescending(lp => lp.LastAccessedAt)
                .Select(lp => new LessonProgressDto
                {
                    LessonProgressID = lp.LessonProgressID,
                    UserID = lp.UserID,
                    UserName = lp.User!.Name,
                    LessonID = lp.LessonID,
                    LessonTitle = lp.Lesson!.Title,
                    CourseID = lp.CourseID,
                    CourseTitle = lp.Course!.Title,
                    IsCompleted = lp.IsCompleted,
                    LastMaterialID = lp.LastMaterialID,
                    LastMaterialTitle = lp.LastMaterial != null ? lp.LastMaterial.Title : null,
                    LastAccessedAt = lp.LastAccessedAt
                })
                .ToListAsync();

            return Ok(progress);
        }

        // GET COURSE PROGRESS SUMMARY
        [HttpGet("course/{courseId}")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<object>> GetCourseProgress(int courseId)
        {
            if (!await IsEnrolled(courseId))
                return Forbid();

            var lessons = await _context.Lessons
                .Where(l => l.CourseID == courseId)
                .OrderBy(l => l.OrderIndex)
                .ThenBy(l => l.LessonID)
                .Select(l => new { l.LessonID, l.Title, l.OrderIndex, l.UnlocksAfterLessonID })
                .ToListAsync();

            var progressRecords = await _context.LessonProgress
                .Include(lp => lp.LastMaterial)
                .Where(lp => lp.CourseID == courseId && lp.UserID == CurrentUserId)
                .ToListAsync();

            var lessonProgress = lessons.Select(l =>
            {
                var record = progressRecords.FirstOrDefault(lp => lp.LessonID == l.LessonID);

                // Drip content check
                bool isUnlocked = true;
                if (l.UnlocksAfterLessonID.HasValue)
                {
                    isUnlocked = progressRecords.Any(p =>
                        p.LessonID == l.UnlocksAfterLessonID.Value && p.IsCompleted);
                }

                return new
                {
                    l.LessonID,
                    l.Title,
                    l.OrderIndex,
                    l.UnlocksAfterLessonID,
                    IsCompleted = record?.IsCompleted ?? false,
                    IsUnlocked = isUnlocked,
                    LastMaterialID = record?.LastMaterialID,
                    LastMaterialTitle = record?.LastMaterial?.Title,
                    LastAccessedAt = record?.LastAccessedAt
                };
            })
            .OrderBy(x => x.OrderIndex)
            .ThenBy(x => x.LessonID)
            .ToList();

            var completedCount = lessonProgress.Count(lp => lp.IsCompleted);
            var totalCount = lessonProgress.Count;

            return Ok(new
            {
                CourseID = courseId,
                TotalLessons = totalCount,
                CompletedLessons = completedCount,
                ProgressPercent = totalCount > 0 ? (int)((double)completedCount / totalCount * 100) : 0,
                Lessons = lessonProgress
            });
        }

        // GET RESUME POINT
        [HttpGet("resume/{courseId}")]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult<object>> GetResumePoint(int courseId)
        {
            if (!await IsEnrolled(courseId))
                return Forbid();

            var lessons = await _context.Lessons
                .Where(l => l.CourseID == courseId)
                .OrderBy(l => l.OrderIndex)
                .ThenBy(l => l.LessonID)
                .Select(l => new { l.LessonID, l.Title, l.OrderIndex, l.UnlocksAfterLessonID })
                .ToListAsync();

            if (!lessons.Any())
                return Ok(new { lessonId = (int?)null, materialId = (int?)null });

            var progressRecords = await _context.LessonProgress
                .Where(lp => lp.CourseID == courseId && lp.UserID == CurrentUserId)
                .ToListAsync();

            // Find first incomplete AND unlocked lesson
            var incompleteLesson = lessons.FirstOrDefault(l =>
                !progressRecords.Any(p => p.LessonID == l.LessonID && p.IsCompleted) &&
                (!l.UnlocksAfterLessonID.HasValue ||
                 progressRecords.Any(p => p.LessonID == l.UnlocksAfterLessonID.Value && p.IsCompleted)));

            if (incompleteLesson == null)
                return Ok(new { lessonId = (int?)null, materialId = (int?)null, completed = true });

            var record = progressRecords.FirstOrDefault(lp => lp.LessonID == incompleteLesson.LessonID);

            return Ok(new
            {
                lessonId = incompleteLesson.LessonID,
                lessonTitle = incompleteLesson.Title,
                materialId = record?.LastMaterialID,
                materialTitle = record?.LastMaterial?.Title,
                completed = false
            });
        }

        // CREATE / START TRACKING
        [HttpPost]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<LessonProgressDto>> StartTracking(CreateProgressDto dto)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Course)
                .FirstOrDefaultAsync(l => l.LessonID == dto.LessonID);

            if (lesson == null)
                return NotFound(new { message = "Lesson does not exist." });

            int courseId = dto.CourseID > 0 ? dto.CourseID : lesson.CourseID;

            if (!await IsEnrolled(courseId))
                return Forbid();

            // Drip content check for students
            if (IsStudent() && lesson.UnlocksAfterLessonID.HasValue)
            {
                var prereqCompleted = await _context.LessonProgress.AnyAsync(lp =>
                    lp.UserID == CurrentUserId &&
                    lp.LessonID == lesson.UnlocksAfterLessonID.Value &&
                    lp.IsCompleted);

                if (!prereqCompleted)
                {
                    var prereqLesson = await _context.Lessons
                        .FindAsync(lesson.UnlocksAfterLessonID.Value);
                    return BadRequest(new
                    {
                        message = $"Complete \"{prereqLesson?.Title ?? "previous lesson"}\" first to unlock this lesson."
                    });
                }
            }

            var existing = await _context.LessonProgress
                .FirstOrDefaultAsync(lp =>
                    lp.UserID == CurrentUserId &&
                    lp.LessonID == dto.LessonID);

            if (existing != null)
            {
                existing.LastAccessedAt = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(new LessonProgressDto
                {
                    LessonProgressID = existing.LessonProgressID,
                    UserID = existing.UserID,
                    UserName = "",
                    LessonID = existing.LessonID,
                    LessonTitle = lesson.Title,
                    CourseID = existing.CourseID,
                    CourseTitle = lesson.Course!.Title,
                    IsCompleted = existing.IsCompleted,
                    LastMaterialID = existing.LastMaterialID,
                    LastAccessedAt = existing.LastAccessedAt
                });
            }

            var progress = new LessonProgress
            {
                UserID = CurrentUserId,
                LessonID = dto.LessonID,
                CourseID = courseId,
                IsCompleted = false,
                LastAccessedAt = DateTime.Now
            };

            _context.LessonProgress.Add(progress);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(CurrentUserId);

            var result = new LessonProgressDto
            {
                LessonProgressID = progress.LessonProgressID,
                UserID = progress.UserID,
                UserName = user?.Name ?? "",
                LessonID = progress.LessonID,
                LessonTitle = lesson.Title,
                CourseID = courseId,
                CourseTitle = lesson.Course!.Title,
                IsCompleted = progress.IsCompleted,
                LastMaterialID = progress.LastMaterialID,
                LastAccessedAt = progress.LastAccessedAt
            };

            return Ok(result);
        }

        // UPDATE PROGRESS
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<IActionResult> UpdateProgress(int id, UpdateProgressDto dto)
        {
            var progress = await _context.LessonProgress
                .Include(lp => lp.Lesson)
                .FirstOrDefaultAsync(lp => lp.LessonProgressID == id);

            if (progress == null)
                return NotFound(new { message = $"Progress record {id} not found." });

            if (progress.UserID != CurrentUserId)
                return Forbid();

            if (dto.IsCompleted.HasValue)
                progress.IsCompleted = dto.IsCompleted.Value;

            if (dto.LastMaterialID.HasValue)
                progress.LastMaterialID = dto.LastMaterialID.Value;

            progress.LastAccessedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                progress.LessonProgressID,
                progress.IsCompleted,
                progress.LastMaterialID,
                progress.LastAccessedAt
            });
        }

        // DELETE
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProgress(int id)
        {
            var progress = await _context.LessonProgress.FindAsync(id);
            if (progress == null) return NotFound();

            _context.LessonProgress.Remove(progress);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // MARK MATERIAL AS VIEWED
        [HttpPost("viewed")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<IActionResult> MarkViewed([FromBody] MarkViewedDto dto)
        {
            var material = await _context.Materials
                .Include(m => m.Lesson)
                .FirstOrDefaultAsync(m => m.MaterialID == dto.MaterialID);

            if (material == null) return NotFound();

            var exists = await _context.MaterialViewed
                .FirstOrDefaultAsync(mv =>
                    mv.UserID == CurrentUserId &&
                    mv.MaterialID == dto.MaterialID);

            if (exists != null)
            {
                exists.ViewedAt = DateTime.Now;
                if (dto.Page.HasValue)
                    exists.LastPage = dto.Page.Value;
            }
            else
            {
                var viewed = new MaterialViewed
                {
                    UserID = CurrentUserId,
                    MaterialID = dto.MaterialID,
                    LessonID = material.LessonID,
                    CourseID = material.Lesson!.CourseID,
                    ViewedAt = DateTime.Now,
                    LastPage = dto.Page ?? 1
                };

                _context.MaterialViewed.Add(viewed);
            }

            await _context.SaveChangesAsync();
            return Ok(new { viewed = true });
        }

        // GET VIEWED MATERIALS FOR A LESSON
        [HttpGet("viewed/{lessonId}")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<IEnumerable<object>>> GetViewedMaterials(int lessonId)
        {
            var viewed = await _context.MaterialViewed
                .Where(mv => mv.UserID == CurrentUserId && mv.LessonID == lessonId)
                .Select(mv => new { mv.MaterialID, mv.LastPage })
                .ToListAsync();

            return Ok(viewed);
        }
    }

    public class MarkViewedDto
    {
        public int MaterialID { get; set; }
        public int? Page { get; set; }
    }
}
