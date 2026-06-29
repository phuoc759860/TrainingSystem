using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Exam
{
    public class UpdateExamDto
    {
        [Required]
        public string Title { get; set; } = "";

        [Required]
        public int CourseID { get; set; }
    }
}