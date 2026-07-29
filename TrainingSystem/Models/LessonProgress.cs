namespace TrainingSystem.Models
{
    public class LessonProgress
    {
        public int LessonProgressID { get; set; }

        public int UserID { get; set; }

        public User? User { get; set; }

        public int LessonID { get; set; }

        public Lesson? Lesson { get; set; }

        public int CourseID { get; set; }

        public Course? Course { get; set; }

        public bool IsCompleted { get; set; } = false;

        public int? LastMaterialID { get; set; }

        public Material? LastMaterial { get; set; }

        public DateTime LastAccessedAt { get; set; } = DateTime.Now;
    }
}
