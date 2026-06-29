namespace TrainingSystem.DTOs.ExamResult
{
    public class CreateExamResultDto
    {
        public int UserID { get; set; }

        public int ExamID { get; set; }

        public decimal Score { get; set; }

        public bool Passed { get; set; }
    }
}