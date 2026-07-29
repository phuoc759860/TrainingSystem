namespace TrainingSystem.DTOs.Quiz
{
    public class QuizAttemptDto
    {
        public int QuizAttemptID { get; set; }
        public int QuizID { get; set; }
        public string? QuizTitle { get; set; }
        public int UserID { get; set; }
        public string? UserName { get; set; }
        public int Score { get; set; }
        public int TotalPoints { get; set; }
        public bool Passed { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public List<QuizAnswerDto>? Answers { get; set; }
    }
}
