namespace TrainingSystem.Models
{
    public class LessonVersion
    {
        public int LessonVersionID { get; set; }

        public int LessonID { get; set; }
        public Lesson? Lesson { get; set; }

        public int VersionNumber { get; set; }

        public string Title { get; set; } = "";
        public string? Description { get; set; }

        public int EditedByUserID { get; set; }
        public User? EditedByUser { get; set; }

        public DateTime SavedAt { get; set; } = DateTime.UtcNow;
    }
}
