namespace TrainingSystem.Models
{
    public class QuizAttempt
    {
        public int QuizAttemptID { get; set; }
        public int QuizID { get; set; }
        public Quiz? Quiz { get; set; }
        public int UserID { get; set; }
        public User? User { get; set; }
        public int Score { get; set; }
        public int TotalPoints { get; set; }
        public bool Passed { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.Now;
        public DateTime? CompletedAt { get; set; }
        public ICollection<QuizAnswer> Answers { get; set; } = new List<QuizAnswer>();
    }
}
