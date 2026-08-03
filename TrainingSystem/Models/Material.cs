namespace TrainingSystem.Models
{
    public class Material
    {
        public int MaterialID { get; set; }

        public string Title { get; set; } = string.Empty;

        public string FilePath { get; set; } = string.Empty;

        public string? VideoUrl { get; set; }

        public string? MimeType { get; set; }

        /// <summary>
        /// File size in bytes when the material was uploaded (used for storage quotas).
        /// </summary>
        public long? SizeBytes { get; set; }

        public int LessonID { get; set; }

        /// <summary>
        /// The user who uploaded the file (used for per-user storage quotas).
        /// </summary>
        public int UploadedByUserID { get; set; }

        public int OrderIndex { get; set; }

        public Lesson? Lesson { get; set; }
    }
}
