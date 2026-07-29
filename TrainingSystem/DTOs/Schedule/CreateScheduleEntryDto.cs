using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Schedule
{
    public class CreateScheduleEntryDto
    {
        [Required]
        public int CourseID { get; set; }

        [Required]
        public int LessonID { get; set; }

        [Required]
        [Range(0, 6)]
        public int DayOfWeek { get; set; }

        [Required]
        public string StartTime { get; set; } = "";

        [Required]
        public string EndTime { get; set; } = "";

        public int Position { get; set; }
    }
}
