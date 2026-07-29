namespace TrainingSystem.Models
{
    public class Material
    {
        public int MaterialID { get; set; }

        public string Title { get; set; } = string.Empty;

        public string FilePath { get; set; } = string.Empty;

        public string? VideoUrl { get; set; }

        public string? MimeType { get; set; }

        public int LessonID { get; set; }

        public int OrderIndex { get; set; }

        public Lesson? Lesson { get; set; }
    }
}
