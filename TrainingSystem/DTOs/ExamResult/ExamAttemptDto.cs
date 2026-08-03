namespace TrainingSystem.DTOs.ExamResult
{
    public class RubricCriterionDto
    {
        public string Name { get; set; } = "";
        public decimal MaxPoints { get; set; }
    }

    public class CriterionScoreDto
    {
        public string Name { get; set; } = "";
        public decimal Points { get; set; }
    }

    public class ExamAnswerDetailDto
    {
        public int ExamAnswerID { get; set; }
        public int QuestionID { get; set; }
        public string Content { get; set; } = "";
        public string QuestionType { get; set; } = "";
        public string? Answer { get; set; }
        public string? CorrectAnswer { get; set; } // MC only
        public bool? IsCorrect { get; set; }
        public decimal MaxScore { get; set; }
        public decimal PointsEarned { get; set; }
        public bool NeedsGrading { get; set; }
        public List<RubricCriterionDto> Rubric { get; set; } = new();
        public List<CriterionScoreDto> CriterionScores { get; set; } = new();
    }

    public class ExamAttemptDto
    {
        public int ResultID { get; set; }
        public int UserID { get; set; }
        public string UserName { get; set; } = "";
        public int ExamID { get; set; }
        public string ExamTitle { get; set; } = "";
        public decimal Score { get; set; }
        public bool Passed { get; set; }
        public bool NeedsGrading { get; set; }
        public DateTime SubmittedAt { get; set; }
        public List<ExamAnswerDetailDto> Answers { get; set; } = new();
    }

    public class GradeAnswerItemDto
    {
        public int ExamAnswerID { get; set; }
        public decimal PointsEarned { get; set; }
        /// <summary>Per-criterion rubric scores for essay questions. Sum is used when present.</summary>
        public List<CriterionScoreDto>? CriterionScores { get; set; }
    }

    public class GradeExamDto
    {
        public List<GradeAnswerItemDto> Answers { get; set; } = new();
    }
}