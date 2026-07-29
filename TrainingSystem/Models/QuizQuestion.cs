namespace TrainingSystem.Models
{
    public class QuizQuestion
    {
        public int QuizQuestionID { get; set; }
        public int QuizID { get; set; }
        public Quiz? Quiz { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string Options { get; set; } = "[]";
        public int CorrectIndex { get; set; }
        public int Points { get; set; } = 1;
    }
}
