namespace TrainingSystem.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _uploadsRoot;

        public LocalFileStorageService(IWebHostEnvironment env)
        {
            _uploadsRoot = Path.Combine(env.ContentRootPath, "uploads");
            Directory.CreateDirectory(_uploadsRoot);
        }

        public async Task<string> SaveFileAsync(IFormFile file, string? subDirectory = null)
        {
            var dir = string.IsNullOrEmpty(subDirectory)
                ? _uploadsRoot
                : Path.Combine(_uploadsRoot, subDirectory);

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
            if (normalized.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
            {
                var relative = normalized["uploads/".Length..];
                return Path.Combine(_uploadsRoot, relative);
            }
            return Path.Combine(_uploadsRoot, Path.GetFileName(relativePath));
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
