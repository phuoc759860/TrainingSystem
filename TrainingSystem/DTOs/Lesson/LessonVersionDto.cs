namespace TrainingSystem.DTOs.Lesson
{
    public class LessonVersionDto
    {
        public int LessonVersionID { get; set; }
        public int LessonID { get; set; }
        public int VersionNumber { get; set; }
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public string EditedByUserName { get; set; } = "";
        public DateTime SavedAt { get; set; }
    }
}
