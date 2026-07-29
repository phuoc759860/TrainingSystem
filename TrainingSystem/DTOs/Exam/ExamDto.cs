namespace TrainingSystem.DTOs.Exam
{
    public class ExamDto
    {
        public int ExamID { get; set; }

        public string Title { get; set; } = "";

        public int CourseID { get; set; }

        public string CourseTitle { get; set; } = "";

        public int MaxAttempts { get; set; }

        public int TimeLimitMinutes { get; set; }

        public int AttemptCount { get; set; }
    }
}
