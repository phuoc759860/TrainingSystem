using System.IO;

namespace TrainingSystem.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _uploadsRoot;

        public LocalFileStorageService(IWebHostEnvironment env)
        {
            _uploadsRoot = Path.GetFullPath(Path.Combine(env.ContentRootPath, "uploads"));
            Directory.CreateDirectory(_uploadsRoot);
        }

        public async Task<string> SaveFileAsync(IFormFile file, string? subDirectory = null)
        {
            var dir = string.IsNullOrEmpty(subDirectory)
                ? _uploadsRoot
                : ResolveSafePath(subDirectory);

            Directory.CreateDirectory(dir);

            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var fullPath = Path.Combine(dir, fileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return subDirectory != null
                ? $"/uploads/{subDirectory}/{fileName}"
                : $"/uploads/{fileName}";
        }

        public Task<bool> DeleteFileAsync(string relativePath)
        {
            var fullPath = GetPhysicalPath(relativePath);
            if (File.Exists(fullPath))
            {
                try { File.Delete(fullPath); return Task.FromResult(true); }
                catch { return Task.FromResult(false); }
            }
            return Task.FromResult(false);
        }

        public string GetPhysicalPath(string relativePath)
        {
            var normalized = relativePath.Replace('\\', '/').TrimStart('/');
            string candidate;
            if (normalized.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
            {
                var relative = normalized["uploads/".Length..];
                candidate = Path.Combine(_uploadsRoot, relative);
            }
            else
            {
                candidate = Path.Combine(_uploadsRoot, Path.GetFileName(relativePath) ?? "");
            }
            return EnsureInsideUploads(candidate);
        }

        public async Task<(Stream stream, string contentType, long totalLength)?> OpenFileStreamAsync(
            string relativePath, long? startBytes = null, long? endBytes = null)
        {
            var fullPath = GetPhysicalPath(relativePath);
            if (!File.Exists(fullPath))
                return null;

            var ext = Path.GetExtension(fullPath).ToLowerInvariant();
            var contentType = GetContentType(ext);
            var fileInfo = new FileInfo(fullPath);
            var totalLength = fileInfo.Length;

            var stream = new FileStream(
                fullPath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                81920,
                FileOptions.Asynchronous | FileOptions.SequentialScan);

            return (stream, contentType, totalLength);
        }

        public bool FileExists(string relativePath)
        {
            return File.Exists(GetPhysicalPath(relativePath));
        }

        private string ResolveSafePath(string relativePath)
        {
            var candidate = Path.Combine(_uploadsRoot, relativePath);
            return EnsureInsideUploads(candidate);
        }

        private string EnsureInsideUploads(string candidate)
        {
            var resolved = Path.GetFullPath(candidate);
            var rootWithTrailing = Path.GetFullPath(_uploadsRoot);
            // Ensure the resolved path starts with _uploadsRoot and the boundary is exact
            // (i.e., uploads/app is NOT allowed to match uploads/apples).
            if (!resolved.StartsWith(rootWithTrailing, StringComparison.OrdinalIgnoreCase) ||
                (resolved.Length > rootWithTrailing.Length &&
                 resolved[rootWithTrailing.Length] != Path.DirectorySeparatorChar &&
                 resolved[rootWithTrailing.Length] != Path.AltDirectorySeparatorChar))
            {
                throw new ArgumentException("Path attempts to escape the uploads directory.");
            }
            return resolved;
        }

        private static string GetContentType(string ext) => ext switch
        {
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".ogg" => "video/ogg",
            ".mov" => "video/quicktime",
            ".m3u8" => "application/x-mpegURL",
            ".ts" => "video/mp2t",
            ".pdf" => "application/pdf",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".svg" => "image/svg+xml",
            ".webp" => "image/webp",
            ".mp3" => "audio/mpeg",
            ".wav" => "audio/wav",
            ".m4a" => "audio/mp4",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".ppt" => "application/vnd.ms-powerpoint",
            ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".txt" => "text/plain",
            _ => "application/octet-stream"
        };
    }
}
