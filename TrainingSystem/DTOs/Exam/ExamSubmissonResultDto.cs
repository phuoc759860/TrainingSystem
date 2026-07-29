namespace TrainingSystem.DTOs.Exam
{
    public class QuestionFeedbackDto
    {
        public int QuestionID { get; set; }
        public string Content { get; set; } = "";
        public string QuestionType { get; set; } = "";
        public string? SelectedAnswer { get; set; }

        // Only populated for auto-gradable (multiple choice) questions.
        public string? CorrectAnswer { get; set; }

        // null when the question can't be auto-graded (e.g. Essay).
        public bool? IsCorrect { get; set; }

        public decimal Score { get; set; }
        public decimal PointsEarned { get; set; }
    }

    public class ExamSubmissionResultDto
    {
        public int ResultID { get; set; }
        public int ExamID { get; set; }
        public decimal Score { get; set; }
        public bool Passed { get; set; }
        public int TotalQuestions { get; set; }
        public int CorrectCount { get; set; }
        public List<QuestionFeedbackDto> Questions { get; set; } = new();
    }
}