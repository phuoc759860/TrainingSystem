namespace TrainingSystem.DTOs.Progress
{
    public class LessonProgressDto
    {
        public int LessonProgressID { get; set; }

        public int UserID { get; set; }

        public string UserName { get; set; } = "";

        public int LessonID { get; set; }

        public string LessonTitle { get; set; } = "";

        public int CourseID { get; set; }

        public string CourseTitle { get; set; } = "";

        public bool IsCompleted { get; set; }

        public int? LastMaterialID { get; set; }

        public string? LastMaterialTitle { get; set; }

        public DateTime LastAccessedAt { get; set; }
    }
}
