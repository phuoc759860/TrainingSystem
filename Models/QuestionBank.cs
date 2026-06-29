using System.ComponentModel.DataAnnotations;
namespace TrainingSystem.Models
{
    public class QuestionBank
    {
        [Key]
        public int QuestionID { get; set; }

        public int ExamID { get; set; }

        public string Content { get; set; } = "";

        public string QuestionType { get; set; } = ""; // MultipleChoice, Essay

        public string? OptionA { get; set; }

        public string? OptionB { get; set; }

        public string? OptionC { get; set; }

        public string? OptionD { get; set; }

        public string? CorrectAnswer { get; set; }

        public decimal Score { get; set; }

        public Exam? Exam { get; set; }
    }
}