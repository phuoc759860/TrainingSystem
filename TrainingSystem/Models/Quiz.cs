namespace TrainingSystem.Models
{
    public class Quiz
    {
        public int QuizID { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int LessonID { get; set; }
        public Lesson? Lesson { get; set; }
        public int TimeLimitMinutes { get; set; } = 10;
        public int PassingScore { get; set; } = 70;
        public bool IsActive { get; set; } = true;
        public ICollection<QuizQuestion> Questions { get; set; } = new List<QuizQuestion>();
    }
}
