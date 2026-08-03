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

        public bool IsPublished { get; set; } = true;

        public int ContentVersion { get; set; } = 1;

        /// <summary>0/null = use all questions per attempt.</summary>
        public int? QuestionsPerAttempt { get; set; }
    }
}
