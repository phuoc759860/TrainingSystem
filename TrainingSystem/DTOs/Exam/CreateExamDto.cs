using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Exam
{
    public class CreateExamDto
    {
        [Required]
        public string Title { get; set; } = "";

        [Required]
        public int CourseID { get; set; }

        /// <summary>Max attempts per student. 0 = unlimited.</summary>
        public int MaxAttempts { get; set; } = 0;

        /// <summary>Time limit in minutes. 0 = no limit.</summary>
        public int TimeLimitMinutes { get; set; } = 0;
    }
}
