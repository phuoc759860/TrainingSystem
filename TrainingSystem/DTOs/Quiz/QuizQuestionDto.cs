namespace TrainingSystem.DTOs.Quiz
{
    public class QuizQuestionDto
    {
        public int QuizQuestionID { get; set; }
        public int QuizID { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string[] Options { get; set; } = Array.Empty<string>();
        public int Points { get; set; }
    }
}
