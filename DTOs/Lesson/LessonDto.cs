namespace TrainingSystem.DTOs.Lesson
{
    public class LessonDto
    {
        public int LessonID { get; set; }

        public string Title { get; set; } = "";

        public string? Description { get; set; }

        public int CourseID { get; set; }

        public string CourseTitle { get; set; } = "";
    }
}