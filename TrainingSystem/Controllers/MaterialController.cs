using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Common;
using TrainingSystem.DTOs.Material;
using TrainingSystem.Models;
using TrainingSystem.Services;

namespace TrainingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Trainer,Student")]
    public class MaterialController : BaseApiController
    {
        private readonly IFileStorageService _fileStorage;

        public MaterialController(AppDbContext context, IFileStorageService fileStorage) : base(context)
        {
            _fileStorage = fileStorage;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResult<MaterialDto>>> GetMaterials(
            int? lessonId, string? search, [FromQuery] PaginationQuery pg)
        {
            var query = _context.Materials
                .Include(m => m.Lesson)
                .AsQueryable();

            if (IsTrainer())
            {
                query = query.Where(m => m.Lesson != null &&
                    _context.Courses.Any(c => c.CourseID == m.Lesson.CourseID && c.TrainerID == CurrentUserId));
            }
            else if (IsStudent())
            {
                var courseIds = MyCourseIds();
                query = query.Where(m => m.Lesson != null && courseIds.Contains(m.Lesson.CourseID));
            }

            if (lessonId.HasValue)
                query = query.Where(m => m.LessonID == lessonId.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower();
                query = query.Where(m =>
                    m.Title.ToLower().Contains(search) ||
                    (m.Lesson != null && m.Lesson.Title.ToLower().Contains(search)));
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(m => m.Lesson!.CourseID)
                .ThenBy(m => m.Lesson!.OrderIndex)
                .ThenBy(m => m.OrderIndex)
                .Skip((pg.Page - 1) * pg.PageSize)
                .Take(pg.PageSize)
                .Select(m => new MaterialDto
                {
                    MaterialID = m.MaterialID,
                    Title = m.Title,
                    FilePath = m.FilePath,
                    VideoUrl = m.VideoUrl,
                    LessonID = m.LessonID,
                    LessonTitle = m.Lesson!.Title,
                    OrderIndex = m.OrderIndex
                })
                .ToListAsync();

            return Ok(new PaginatedResult<MaterialDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = pg.Page,
                PageSize = pg.PageSize
            });
        }

        [HttpGet("bylesson/{lessonId}")]
        public async Task<ActionResult<List<MaterialDto>>> GetMaterialsByLesson(int lessonId)
        {
            var lesson = await _context.Lessons.FindAsync(lessonId);
            if (lesson == null)
                return NotFound();

            if (!await IsEnrolled(lesson.CourseID))
                return Forbid();

            if (IsTrainer() && !await OwnsCourse(lesson.CourseID))
                return Forbid();

            var materials = await _context.Materials
                .Where(m => m.LessonID == lessonId)
                .OrderBy(m => m.OrderIndex)
                .Select(m => new MaterialDto
                {
                    MaterialID = m.MaterialID,
                    Title = m.Title,
                    FilePath = m.FilePath,
                    VideoUrl = m.VideoUrl,
                    LessonID = m.LessonID,
                    LessonTitle = m.Lesson!.Title,
                    OrderIndex = m.OrderIndex
                })
                .ToListAsync();

            return Ok(materials);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MaterialDto>> GetMaterial(int id)
        {
            var material = await _context.Materials
                .Include(m => m.Lesson)
                .FirstOrDefaultAsync(m => m.MaterialID == id);

            if (material?.Lesson == null)
                return NotFound();

            if (!await IsEnrolled(material.Lesson.CourseID))
                return Forbid();

            if (IsTrainer() && !await OwnsCourse(material.Lesson.CourseID))
                return Forbid();

            return Ok(new MaterialDto
            {
                MaterialID = material.MaterialID,
                Title = material.Title,
                FilePath = material.FilePath,
                VideoUrl = material.VideoUrl,
                LessonID = material.LessonID,
                LessonTitle = material.Lesson.Title,
                OrderIndex = material.OrderIndex
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<MaterialDto>> CreateMaterial([FromForm] CreateMaterialDto dto)
        {
            var lesson = await _context.Lessons.FindAsync(dto.LessonID);
            if (lesson == null)
                return NotFound(new { message = "Lesson not found." });

            if (IsTrainer() && !await OwnsCourse(lesson.CourseID))
                return Forbid();

            string? filePath = null;
            string? mimeType = null;

            if (dto.File != null)
            {
                filePath = await _fileStorage.SaveFileAsync(dto.File);
                mimeType = dto.File.ContentType;
            }

            var material = new Models.Material
            {
                Title = dto.Title,
                FilePath = filePath ?? "",
                VideoUrl = dto.VideoUrl,
                MimeType = mimeType,
                LessonID = dto.LessonID,
                OrderIndex = await _context.Materials
                    .Where(m => m.LessonID == dto.LessonID)
                    .CountAsync()
            };

            _context.Materials.Add(material);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMaterial), new { id = material.MaterialID },
                new MaterialDto
                {
                    MaterialID = material.MaterialID,
                    Title = material.Title,
                    FilePath = material.FilePath,
                    VideoUrl = material.VideoUrl,
                    LessonID = material.LessonID,
                    LessonTitle = lesson.Title,
                    OrderIndex = material.OrderIndex
                });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<MaterialDto>> UpdateMaterial(int id, [FromForm] UpdateMaterialDto dto)
        {
            var material = await _context.Materials
                .Include(m => m.Lesson)
                .FirstOrDefaultAsync(m => m.MaterialID == id);

            if (material?.Lesson == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(material.Lesson.CourseID))
                return Forbid();

            var lesson = await _context.Lessons.FindAsync(dto.LessonID);
            if (lesson == null)
                return NotFound(new { message = "Lesson not found." });

            if (IsTrainer() && !await OwnsCourse(lesson.CourseID))
                return Forbid();

            var oldVersion = new MaterialVersion
            {
                MaterialID = material.MaterialID,
                VersionNumber = await _context.MaterialVersions
                    .CountAsync(v => v.MaterialID == id) + 1,
                Title = material.Title,
                FilePath = material.FilePath,
                VideoUrl = material.VideoUrl,
                EditedByUserID = CurrentUserId,
                SavedAt = DateTime.UtcNow
            };
            _context.MaterialVersions.Add(oldVersion);

            if (dto.File != null)
            {
                if (!string.IsNullOrEmpty(material.FilePath))
                    await _fileStorage.DeleteFileAsync(material.FilePath);

                material.FilePath = await _fileStorage.SaveFileAsync(dto.File);
                material.MimeType = dto.File.ContentType;
                material.VideoUrl = null;
            }

            material.Title = dto.Title;
            material.LessonID = dto.LessonID;
            if (dto.VideoUrl != null)
                material.VideoUrl = dto.VideoUrl;

            await _context.SaveChangesAsync();

            return Ok(new MaterialDto
            {
                MaterialID = material.MaterialID,
                Title = material.Title,
                FilePath = material.FilePath,
                VideoUrl = material.VideoUrl,
                LessonID = material.LessonID,
                LessonTitle = lesson.Title,
                OrderIndex = material.OrderIndex
            });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult> DeleteMaterial(int id)
        {
            var material = await _context.Materials
                .Include(m => m.Lesson)
                .FirstOrDefaultAsync(m => m.MaterialID == id);

            if (material?.Lesson == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(material.Lesson.CourseID))
                return Forbid();

            _context.Materials.Remove(material);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(material.FilePath))
                await _fileStorage.DeleteFileAsync(material.FilePath);

            return NoContent();
        }

        [HttpGet("{id}/versions")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<List<MaterialVersionDto>>> GetMaterialVersions(int id)
        {
            var material = await _context.Materials
                .Include(m => m.Lesson)
                .FirstOrDefaultAsync(m => m.MaterialID == id);

            if (material?.Lesson == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(material.Lesson.CourseID))
                return Forbid();

            var versions = await _context.MaterialVersions
                .Where(v => v.MaterialID == id)
                .OrderByDescending(v => v.VersionNumber)
                .Select(v => new MaterialVersionDto
                {
                    MaterialVersionID = v.MaterialVersionID,
                    MaterialID = v.MaterialID,
                    VersionNumber = v.VersionNumber,
                    Title = v.Title,
                    FilePath = v.FilePath,
                    VideoUrl = v.VideoUrl,
                    EditedByUserName = v.EditedByUser!.Name,
                    SavedAt = v.SavedAt
                })
                .ToListAsync();

            return Ok(versions);
        }
    }
}
