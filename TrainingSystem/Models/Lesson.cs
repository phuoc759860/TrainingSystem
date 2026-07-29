namespace TrainingSystem.Models
{
    public class Lesson
    {
        public int LessonID { get; set; }

        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }

        public int CourseID { get; set; }

        public Course? Course { get; set; }

        /// <summary>
        /// Ordering within the course (0, 1, 2, ...).
        /// </summary>
        public int OrderIndex { get; set; }

        /// <summary>
        /// If set, this lesson only unlocks after the referenced lesson is completed.
        /// Null means always available.
        /// </summary>
        public int? UnlocksAfterLessonID { get; set; }
        public Lesson? UnlocksAfterLesson { get; set; }

        public ICollection<Material>? Materials { get; set; }

        public ICollection<ScheduleEntry>? ScheduleEntries { get; set; }

        public ICollection<LessonProgress>? ProgressRecords { get; set; }
    }
}
