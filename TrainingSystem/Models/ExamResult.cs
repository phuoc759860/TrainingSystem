using System.ComponentModel.DataAnnotations;
namespace TrainingSystem.Models
{
    public class ExamResult
    {
        [Key]
        public int ResultID { get; set; }

        public int UserID { get; set; }
        public User? User { get; set; }

        public int ExamID { get; set; }
        public Exam? Exam { get; set; }

        public decimal Score { get; set; }
        public bool Passed { get; set; }

        public bool NeedsGrading { get; set; }

        public string? AttemptToken { get; set; }

        public string? ServedQuestionIds { get; set; }

        /// <summary>
        /// "InProgress" while the student is taking the exam, set to "Submitted" on submit.
        /// </summary>
        public string Status { get; set; } = "Submitted";

        public DateTime SubmittedAt { get; set; } = DateTime.Now;

        public ICollection<ExamAnswer> Answers { get; set; } = new List<ExamAnswer>();
    }
}