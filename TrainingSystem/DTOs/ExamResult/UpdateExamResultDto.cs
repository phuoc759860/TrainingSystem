using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.ExamResult
{
    public class UpdateExamResultDto
    {
        [Required]
        public int UserID { get; set; }

        [Required]
        public int ExamID { get; set; }

        [Required]
        public decimal Score { get; set; }

    }
}