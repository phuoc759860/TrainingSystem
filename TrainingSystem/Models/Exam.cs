using System.ComponentModel.DataAnnotations;
namespace TrainingSystem.Models

{
    public class Exam
    {
        [Key]
        public int ExamID { get; set; }

        public string Title { get; set; } = string.Empty;

        public int CourseID { get; set; }

        public Course? Course { get; set; }

        /// <summary>
        /// Max attempts allowed per student. 0 or null = unlimited.
        /// </summary>
        public int? MaxAttempts { get; set; }

        /// <summary>
        /// Time limit in minutes. 0 or null = no limit.
        /// </summary>
        public int? TimeLimitMinutes { get; set; }

        public ICollection<QuestionBank> Questions { get; set; }
            = new List<QuestionBank>();

        public ICollection<ExamResult> ExamResults { get; set; }
            = new List<ExamResult>();
    }
}
