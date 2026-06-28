using System.ComponentModel.DataAnnotations;
namespace TrainingSystem.Models
{
    public class ExamResult
    {
        [Key]
        public int ResultID { get; set; }

        public int UserID { get; set; }

        public int ExamID { get; set; }

        public decimal Score { get; set; }
    }
}