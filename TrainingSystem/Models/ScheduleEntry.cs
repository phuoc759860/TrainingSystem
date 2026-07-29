namespace TrainingSystem.Models
{
    public class ScheduleEntry
    {
        public int ScheduleEntryID { get; set; }

        public int CourseID { get; set; }

        public Course? Course { get; set; }

        public int LessonID { get; set; }

        public Lesson? Lesson { get; set; }

        public int DayOfWeek { get; set; }

        public TimeOnly StartTime { get; set; }

        public TimeOnly EndTime { get; set; }

        public int Position { get; set; }
    }
}
