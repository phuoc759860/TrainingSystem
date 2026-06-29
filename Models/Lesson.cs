namespace TrainingSystem.Models
{
    public class Lesson
    {
        public int LessonID { get; set; }

        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }

        public int CourseID { get; set; }

        public Course? Course { get; set; }

        public ICollection<Material>? Materials { get; set; }
    }
}