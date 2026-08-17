using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Exam
{
    public class UpdateExamDto
    {
        [Required]
        public string Title { get; set; } = "";

        [Required]
        public int CourseID { get; set; }

        /// <summary>Max attempts per student. 0 = unlimited.</summary>
        public int MaxAttempts { get; set; } = 0;

        /// <summary>Time limit in minutes. 0 = no limit.</summary>
        public int TimeLimitMinutes { get; set; } = 0;

        /// <summary>Random question pool size per attempt. 0 = use all questions.</summary>
        public int QuestionsPerAttempt { get; set; } = 0;

        /// <summary>Percentage required to pass. 0 defaults to 50 server-side.</summary>
        public int PassingScore { get; set; } = 0;
    }
}
