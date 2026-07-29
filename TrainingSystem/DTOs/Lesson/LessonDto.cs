namespace TrainingSystem.DTOs.Lesson
{
    public class LessonDto
    {
        public int LessonID { get; set; }

        public string Title { get; set; } = "";

        public string? Description { get; set; }

        public int CourseID { get; set; }

        public string CourseTitle { get; set; } = "";

        public int OrderIndex { get; set; }

        public int? UnlocksAfterLessonID { get; set; }

        public string? UnlocksAfterLessonTitle { get; set; }

        /// <summary>
        /// For students: whether this lesson is currently unlocked.
        /// Null for Admin/Trainer (always unlocked for management).
        /// </summary>
        public bool? IsUnlocked { get; set; }
    }
}
