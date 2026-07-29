namespace TrainingSystem.DTOs.Quiz
{
    public class QuizDto
    {
        public int QuizID { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int LessonID { get; set; }
        public string? LessonTitle { get; set; }
        public string? CourseTitle { get; set; }
        public int TimeLimitMinutes { get; set; }
        public int PassingScore { get; set; }
        public bool IsActive { get; set; }
        public int QuestionCount { get; set; }
        public int? BestScore { get; set; }
        public int? AttemptsCount { get; set; }
    }
}
