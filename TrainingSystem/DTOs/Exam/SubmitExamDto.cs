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
    }
}
