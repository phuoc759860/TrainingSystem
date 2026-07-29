namespace TrainingSystem.DTOs.Schedule
{
    public class WeeklyScheduleDto
    {
        public int CourseID { get; set; }

        public string CourseTitle { get; set; } = "";

        public List<DayScheduleDto> Days { get; set; } = new();
    }

    public class DayScheduleDto
    {
        public int DayOfWeek { get; set; }

        public string DayName { get; set; } = "";

        public List<ScheduleEntryDto> Entries { get; set; } = new();
    }
}
