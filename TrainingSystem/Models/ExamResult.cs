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

        public DateTime SubmittedAt { get; set; } = DateTime.Now;

        public ICollection<ExamAnswer> Answers { get; set; } = new List<ExamAnswer>();
    }
}