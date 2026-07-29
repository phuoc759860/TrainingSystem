namespace TrainingSystem.DTOs.Schedule
{
    public class ScheduleEntryDto
    {
        public int ScheduleEntryID { get; set; }

        public int CourseID { get; set; }

        public string CourseTitle { get; set; } = "";

        public int LessonID { get; set; }

        public string LessonTitle { get; set; } = "";

        public int DayOfWeek { get; set; }

        public string StartTime { get; set; } = "";

        public string EndTime { get; set; } = "";

        public int Position { get; set; }
    }
}
