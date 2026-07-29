using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Common;
using TrainingSystem.DTOs.Material;
using TrainingSystem.Models;
using TrainingSystem.Services;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MaterialController : BaseApiController
    {
        private readonly IFileStorageService _storage;
        private readonly FileValidationService _fileValidator;

        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
            ".txt", ".csv", ".rtf", ".odt", ".ods", ".odp",
            ".mp4", ".webm", ".ogg", ".mov",
            ".mp3", ".wav", ".m4a",
            ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp"
        };

        private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "application/pdf",
            "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain", "text/csv", "application/rtf",
            "video/mp4", "video/webm", "video/ogg", "video/quicktime",
            "audio/mpeg", "audio/wav", "audio/mp4",
            "image/png", "image/jpeg", "image/gif", "image/svg+xml", "image/webp", "image/bmp"
        };

        private const long MaxFileSize = 50 * 1024 * 1024; // 50 MB

        public MaterialController(AppDbContext context, IFileStorageService storage, FileValidationService fileValidator)
            : base(context)
        {
            _storage = storage;
            _fileValidator = fileValidator;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<PaginatedResult<MaterialDto>>> GetMaterials(
            [FromQuery] PaginationQuery pg)
        {
            var query = _context.Materials
                .Include(m => m.Lesson)
                .ThenInclude(l => l.Course)
                .AsQueryable();

            if (IsStudent())
            {
                query = query.Where(m =>
                    MyCourseIds().Contains(m.Lesson!.CourseID));
            }

            var totalCount = await query.CountAsync();

            var materials = await query
                .OrderBy(m => m.Title)
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
                Items = materials,
                TotalCount = totalCount,
                Page = pg.Page,
                PageSize = pg.PageSize
            });
        }

        [HttpGet("bylesson/{lessonId}")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<IEnumerable<MaterialDto>>> GetMaterialsByLesson(int lessonId)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Course)
                .FirstOrDefaultAsync(l => l.LessonID == lessonId);

            if (lesson == null) return NotFound();

            if (!await IsEnrolled(lesson.CourseID))
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
                    LessonTitle = lesson.Title,
                    OrderIndex = m.OrderIndex
                })
                .ToListAsync();

            return Ok(materials);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<MaterialDto>> GetMaterial(int id)
        {
            var material = await _context.Materials
                .Include(m => m.Lesson)
                .ThenInclude(l => l.Course)
                .FirstOrDefaultAsync(m => m.MaterialID == id);

            if (material == null)
                return NotFound();

            if (!await IsEnrolled(material.Lesson!.CourseID))
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
        public async Task<IActionResult> Create(
            [FromForm] CreateMaterialDto dto)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Course)
                .FirstOrDefaultAsync(l => l.LessonID == dto.LessonID);

            if (lesson == null)
                return NotFound(new { message = "Lesson does not exist." });

            if (IsTrainer() && !await OwnsCourse(lesson.CourseID))
                return Forbid();

            string filePath = "";

            if (dto.File != null)
            {
                var validationError = ValidateFile(dto.File);
                if (validationError != null)
                    return BadRequest(new { message = validationError });

                filePath = await _storage.SaveFileAsync(dto.File);
            }

            var material = new Material
            {
                Title = dto.Title,
                LessonID = dto.LessonID,
                FilePath = filePath,
                VideoUrl = dto.VideoUrl
            };

            _context.Materials.Add(material);
            await _context.SaveChangesAsync();

            return Ok(material);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> UpdateMaterial(
            int id,
            [FromForm] UpdateMaterialDto dto)
        {
            var material = await _context.Materials
                .Include(m => m.Lesson)
                .FirstOrDefaultAsync(m => m.MaterialID == id);

            if (material == null) return NotFound();

            if (IsTrainer() && !await OwnsCourse(material.Lesson!.CourseID))
                return Forbid();

            var lessonExists = await _context.Lessons
                .AnyAsync(l => l.LessonID == dto.LessonID);

            if (!lessonExists)
                return NotFound(new { message = "Lesson does not exist." });

            // Snapshot version before updating
            var maxVersion = await _context.MaterialVersions
                .Where(mv => mv.MaterialID == id)
                .MaxAsync(mv => (int?)mv.VersionNumber) ?? 0;

            _context.MaterialVersions.Add(new MaterialVersion
            {
                MaterialID = id,
                VersionNumber = maxVersion + 1,
                Title = material.Title,
                FilePath = material.FilePath,
                VideoUrl = material.VideoUrl,
                EditedByUserID = CurrentUserId,
                SavedAt = DateTime.UtcNow
            });

            material.Title = dto.Title;
            material.LessonID = dto.LessonID;

            if (dto.VideoUrl != null)
                material.VideoUrl = dto.VideoUrl;

            if (dto.File != null)
            {
                var validationError = ValidateFile(dto.File);
                if (validationError != null)
                    return BadRequest(new { message = validationError });

                await _storage.DeleteFileAsync(material.FilePath);
                material.FilePath = await _storage.SaveFileAsync(dto.File);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("{id}/versions")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<IEnumerable<MaterialVersionDto>>> GetVersions(int id)
        {
            var versions = await _context.MaterialVersions
                .Include(mv => mv.EditedByUser)
                .Where(mv => mv.MaterialID == id)
                .OrderByDescending(mv => mv.VersionNumber)
                .Select(mv => new MaterialVersionDto
                {
                    MaterialVersionID = mv.MaterialVersionID,
                    MaterialID = mv.MaterialID,
                    VersionNumber = mv.VersionNumber,
                    Title = mv.Title,
                    FilePath = mv.FilePath,
                    VideoUrl = mv.VideoUrl,
                    EditedByUserName = mv.EditedByUser!.Name,
                    SavedAt = mv.SavedAt
                })
                .ToListAsync();

            return Ok(versions);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> DeleteMaterial(int id)
        {
            var material = await _context.Materials
                .Include(m => m.Lesson)
                .FirstOrDefaultAsync(m => m.MaterialID == id);

            if (material == null)
                return NotFound();

            if (IsTrainer() && !await OwnsCourse(material.Lesson!.CourseID))
                return Forbid();

            if (!string.IsNullOrEmpty(material.FilePath))
            {
                await _storage.DeleteFileAsync(material.FilePath);
            }

            _context.Materials.Remove(material);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private string? ValidateFile(IFormFile file)
        {
            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
                return $"File extension '{ext}' is not allowed. Allowed: {string.Join(", ", AllowedExtensions)}";

            if (!AllowedMimeTypes.Contains(file.ContentType))
                return $"File type '{file.ContentType}' is not allowed.";

            if (file.Length > MaxFileSize)
                return $"File size ({file.Length / 1024 / 1024}MB) exceeds the {MaxFileSize / 1024 / 1024}MB limit.";

            using var stream = file.OpenReadStream();
            if (!_fileValidator.ValidateMagicBytes(stream, file.ContentType, out var detectedMime))
                return $"File content does not match declared type '{file.ContentType}'. Detected: {detectedMime}.";

            return null;
        }
    }
}
