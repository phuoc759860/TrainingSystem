using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.ExamResult
{
    public class UpdateExamResultDto
    {
        [Required]
        public int UserID { get; set; }

        [Required]
        public int ExamID { get; set; }

        private decimal _score;
        [Required]
        public decimal Score
        {
            get => _score;
            set => _score = Math.Clamp(value, 0, 100);
        }

    }
}