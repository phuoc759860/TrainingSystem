namespace TrainingSystem.DTOs.Quiz
{
    public class QuizAnswerDto
    {
        public int QuizAnswerID { get; set; }
        public int QuizQuestionID { get; set; }
        public string? QuestionText { get; set; }
        public string[]? Options { get; set; }
        public int SelectedIndex { get; set; }
        public int? CorrectIndex { get; set; }
        public bool IsCorrect { get; set; }
    }
}
