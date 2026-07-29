using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Quiz
{
    public class CreateQuizDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        [Required]
        public int LessonID { get; set; }
        public int TimeLimitMinutes { get; set; } = 10;
        public int PassingScore { get; set; } = 70;
    }
}
