namespace TrainingSystem.Models
{
    public class Course
    {
        public int CourseID { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public int TrainerID { get; set; }

        public User? Trainer { get; set; }

        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }

        /// <summary>
        /// Draft/publish workflow. Only published courses are visible to students.
        /// </summary>
        public bool IsPublished { get; set; } = true;

        /// <summary>
        /// Bumped every time the course is (re)published. Lets enrolled students know content changed.
        /// </summary>
        public int ContentVersion { get; set; } = 1;

        /// <summary>
        /// Price in <see cref="Currency"/>. 0 or less means the course is free.
        /// </summary>
        public decimal Price { get; set; }

        public string Currency { get; set; } = "USD";

        /// <summary>
        /// Optional course start date (used for "course starting soon" notifications).
        /// </summary>
        public DateTime? StartDate { get; set; }

        public ICollection<Lesson> Lessons { get; set; }
            = new List<Lesson>();

        public ICollection<Exam> Exams { get; set; }
            = new List<Exam>();

        public ICollection<Enrollment> Enrollments { get; set; }
            = new List<Enrollment>();

        public ICollection<ScheduleEntry> ScheduleEntries { get; set; }
            = new List<ScheduleEntry>();

        public ICollection<LessonProgress> LessonProgressRecords { get; set; }
            = new List<LessonProgress>();
    }
}
