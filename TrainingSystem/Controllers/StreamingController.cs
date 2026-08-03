using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.Models;
using TrainingSystem.Services;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StreamingController : BaseApiController
    {
        private readonly IFileStorageService _storage;

        public StreamingController(AppDbContext context, IFileStorageService storage)
            : base(context)
        {
            _storage = storage;
        }

        [HttpGet("{**path}")]
        public async Task<IActionResult> Stream(string path)
        {
            // Normalize: path comes in as "uploads/filename.ext"
            var relativePath = "/" + path.Replace('\\', '/');
            var requestedKey = NormalizePath(relativePath);

            // Only stream files that belong to a course material the user is entitled to.
            // Match either "/uploads/<key>" (paths produced by the file storage service)
            // or "/<key>" (paths stored directly, e.g. seeded content).
            var material = await _context.Materials
                .Include(m => m.Lesson)
                .FirstOrDefaultAsync(m =>
                    m.FilePath == "/uploads/" + requestedKey ||
                    m.FilePath == "/" + requestedKey);

            if (material?.Lesson == null)
                return NotFound();

            if (!await CanAccessCourse(material.Lesson.CourseID))
                return Forbid();

            var result = await _storage.OpenFileStreamAsync(relativePath);
            if (result == null)
                return NotFound();

            var (stream, contentType, totalLength) = result.Value;

            // Check for range request
            var rangeHeader = Request.Headers.Range.ToString();
            if (!string.IsNullOrEmpty(rangeHeader) && TryParseRange(rangeHeader, totalLength, out long start, out long end))
            {
                var contentLength = end - start + 1;
                Response.StatusCode = 206;
                Response.Headers["Content-Range"] = $"bytes {start}-{end}/{totalLength}";
                Response.Headers["Accept-Ranges"] = "bytes";
                Response.Headers["Content-Length"] = contentLength.ToString();
                Response.Headers["Content-Type"] = contentType;

                // For .ts (HLS segments), allow CORS for cross-origin playback
                if (relativePath.EndsWith(".ts", StringComparison.OrdinalIgnoreCase))
                {
                    Response.Headers["Access-Control-Allow-Origin"] = "*";
                }

                try
                {
                    stream.Seek(start, SeekOrigin.Begin);
                    var buffer = new byte[Math.Min(contentLength, 81920)];
                    long remaining = contentLength;

                    while (remaining > 0)
                    {
                        var toRead = (int)Math.Min(buffer.Length, remaining);
                        var read = await stream.ReadAsync(buffer.AsMemory(0, toRead));
                        if (read == 0) break;
                        await Response.Body.WriteAsync(buffer.AsMemory(0, read));
                        remaining -= read;
                    }
                }
                finally
                {
                    await stream.DisposeAsync();
                }

                return new EmptyResult();
            }

            // Full file response
            Response.Headers["Accept-Ranges"] = "bytes";
            Response.Headers["Content-Length"] = totalLength.ToString();

            return File(stream, contentType, enableRangeProcessing: true);
        }

        private static string NormalizePath(string path)
        {
            path = path.Replace('\\', '/').TrimStart('/');
            if (path.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
                path = path["uploads/".Length..];
            return path;
        }

        private async Task<bool> CanAccessCourse(int courseId)
        {
            if (IsAdmin())
                return true;

            if (IsTrainer())
                return await OwnsCourse(courseId);

            return await IsEnrolled(courseId);
        }

        private static bool TryParseRange(string rangeHeader, long totalLength, out long start, out long end)
        {
            start = 0;
            end = totalLength - 1;

            if (string.IsNullOrEmpty(rangeHeader) || !rangeHeader.StartsWith("bytes="))
                return false;

            var rangeValue = rangeHeader["bytes=".Length..].Trim();
            var parts = rangeValue.Split('-', 2);
            if (parts.Length != 2) return false;

            if (string.IsNullOrEmpty(parts[0]))
            {
                // suffix: -N means last N bytes
                if (!long.TryParse(parts[1], out var suffix) || suffix <= 0) return false;
                start = Math.Max(0, totalLength - suffix);
            }
            else
            {
                if (!long.TryParse(parts[0], out start) || start < 0) return false;
                if (!string.IsNullOrEmpty(parts[1]))
                {
                    if (!long.TryParse(parts[1], out end) || end < start) return false;
                }
            }

            if (start >= totalLength) return false;
            end = Math.Min(end, totalLength - 1);
            return true;
        }

        /// <summary>
        /// Generates a simple HLS-style manifest listing all video materials for a lesson.
        /// For a real system, this would generate actual HLS playlists from transcoded segments.
        /// </summary>
        [HttpGet("hls/lesson/{lessonId}/manifest")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<IActionResult> GetHlsManifest(int lessonId)
        {
            var lesson = await _context.Lessons.FindAsync(lessonId);
            if (lesson == null)
                return NotFound();

            if (!await CanAccessCourse(lesson.CourseID))
                return Forbid();

            // In a production system, this would query pre-transcoded HLS segments.
            // For now, return a JSON manifest that the frontend can use for custom playback.
            return Ok(new
            {
                message = "HLS transcoding not configured. Use direct video playback.",
                note = "To enable HLS, deploy with ffmpeg sidecar or use a cloud transcoding service (AWS MediaConvert, Mux, etc.)."
            });
        }
    }
}
