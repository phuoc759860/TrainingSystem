using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.QuestionBank
{
    public class CreateQuestionDto
    {
        [Required]
        public int ExamID { get; set; }

        [Required]
        public string Content { get; set; } = "";

        [Required]
        public string QuestionType { get; set; } = "";

        public string? OptionA { get; set; }

        public string? OptionB { get; set; }

        public string? OptionC { get; set; }

        public string? OptionD { get; set; }

        public string? CorrectAnswer { get; set; }

        public int Score { get; set; }
    }
}