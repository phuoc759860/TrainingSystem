namespace TrainingSystem.Services
{
    public interface IFileStorageService
    {
        /// <summary>
        /// Saves a file and returns the relative path (e.g. /uploads/guid.ext).
        /// </summary>
        Task<string> SaveFileAsync(IFormFile file, string? subDirectory = null);

        /// <summary>
        /// Deletes a file by its relative path.
        /// </summary>
        Task<bool> DeleteFileAsync(string relativePath);

        /// <summary>
        /// Gets the full physical path for a relative path.
        /// </summary>
        string GetPhysicalPath(string relativePath);

        /// <summary>
        /// Opens a read stream for range-request video streaming.
        /// Returns (stream, contentType, totalLength) or null if not found.
        /// </summary>
        Task<(Stream stream, string contentType, long totalLength)?> OpenFileStreamAsync(
            string relativePath, long? startBytes = null, long? endBytes = null);

        /// <summary>
        /// Returns true if the file exists.
        /// </summary>
        bool FileExists(string relativePath);
    }
}
