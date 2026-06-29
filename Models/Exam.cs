using System.ComponentModel.DataAnnotations;
namespace TrainingSystem.Models

{
    public class Exam
    {
        [Key]
        public int ExamID { get; set; }

        public string Title { get; set; } = string.Empty;

        public int CourseID { get; set; }

        public Course? Course { get; set; }

        public ICollection<QuestionBank> Questions { get; set; }
            = new List<QuestionBank>();

        public ICollection<ExamResult> ExamResults { get; set; }
            = new List<ExamResult>();
    }
}