using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Exam
{
    public class SubmitExamAnswerDto
    {
        [Required]
        public int QuestionID { get; set; }

        public string? Answer { get; set; }
    }

    public class SubmitExamDto
    {
        public List<SubmitExamAnswerDto> Answers { get; set; } = new();

        /// <summary>
        /// UTC timestamp when the student started the exam.
        /// Used for server-side time limit validation.
        /// </summary>
        public DateTime? StartedAt { get; set; }

        /// <summary>
        /// The question IDs that were served for this attempt.
        /// When the exam uses a randomized pool, only these questions are graded
        /// (and the pool size is used as the denominator), so a short exam drawn
        /// from a large bank is scored fairly.
        /// </summary>
        public List<int>? QuestionIDs { get; set; }

        /// <summary>
        /// Token returned by GET /questions. Links submission to the specific
        /// question set that was served, preventing question re-roll attacks.
        /// </summary>
        public string? AttemptToken { get; set; }
    }
}
