namespace TrainingSystem.Models
{
    public class QuizAnswer
    {
        public int QuizAnswerID { get; set; }
        public int QuizAttemptID { get; set; }
        public QuizAttempt? QuizAttempt { get; set; }
        public int QuizQuestionID { get; set; }
        public QuizQuestion? QuizQuestion { get; set; }
        public int SelectedIndex { get; set; }
        public bool IsCorrect { get; set; }
    }
}
