namespace TrainingSystem.DTOs.Quiz
{
    public class UpdateQuizDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int? LessonID { get; set; }
        public int? TimeLimitMinutes { get; set; }
        public int? PassingScore { get; set; }
        public bool? IsActive { get; set; }
    }
}
