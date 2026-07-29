namespace TrainingSystem.Models
{
    public class ExamAnswer
    {
        public int ExamAnswerID { get; set; }

        public int ResultID { get; set; }
        public ExamResult? Result { get; set; }

        public int QuestionID { get; set; }
        public QuestionBank? Question { get; set; }

        public string? Answer { get; set; }

        public bool? IsCorrect { get; set; }

        public decimal PointsEarned { get; set; }

        public bool NeedsGrading { get; set; }
    }
}