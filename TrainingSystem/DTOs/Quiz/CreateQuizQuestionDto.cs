using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Quiz
{
    public class CreateQuizQuestionDto
    {
        [Required]
        public string QuestionText { get; set; } = string.Empty;
        [Required]
        public string[] Options { get; set; } = Array.Empty<string>();
        [Required]
        public int CorrectIndex { get; set; }
        public int Points { get; set; } = 1;
    }
}
