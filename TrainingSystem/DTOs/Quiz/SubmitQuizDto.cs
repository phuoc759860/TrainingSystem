using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Quiz
{
    public class SubmitQuizDto
    {
        [Required]
        public List<QuizAnswerInput> Answers { get; set; } = new();
    }

    public class QuizAnswerInput
    {
        [Required]
        public int QuizQuestionID { get; set; }
        [Required]
        public int SelectedIndex { get; set; }
    }
}
