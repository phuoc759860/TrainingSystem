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

        public ICollection<Lesson> Lessons { get; set; }
            = new List<Lesson>();

        public ICollection<Enrollment> Enrollments { get; set; }
            = new List<Enrollment>();

        public ICollection<ScheduleEntry> ScheduleEntries { get; set; }
            = new List<ScheduleEntry>();

        public ICollection<LessonProgress> LessonProgressRecords { get; set; }
            = new List<LessonProgress>();
    }
}
