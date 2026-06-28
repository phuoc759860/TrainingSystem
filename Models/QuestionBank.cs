using System.ComponentModel.DataAnnotations;
namespace TrainingSystem.Models
{
    public class QuestionBank
    {
        [Key]
        public int QuestionID { get; set; }

        public string Content { get; set; } = string.Empty;

        public string QuestionType { get; set; } = string.Empty;
    }
}