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

        /// <summary>
        /// Draft/publish workflow. Only published exams are available to students.
        /// </summary>
        public bool IsPublished { get; set; } = true;

        /// <summary>
        /// Bumped every time the exam is (re)published so mid-term changes are not silent.
        /// </summary>
        public int ContentVersion { get; set; } = 1;

        /// <summary>
        /// How many questions are randomly drawn per attempt. 0/null = use all questions (current behavior).
        /// </summary>
        public int? QuestionsPerAttempt { get; set; }

        /// <summary>
        /// Percentage score required to pass. Defaults to 50.
        /// </summary>
        public int PassingScore { get; set; } = 50;

        public ICollection<QuestionBank> Questions { get; set; }
            = new List<QuestionBank>();

        public ICollection<ExamResult> ExamResults { get; set; }
            = new List<ExamResult>();
    }
}
