namespace TrainingSystem.DTOs.ExamResult
{
    public class CreateExamResultDto
    {
        public int UserID { get; set; }

        public int ExamID { get; set; }

        private decimal _score;
        public decimal Score
        {
            get => _score;
            set => _score = Math.Clamp(value, 0, 100);
        }

    }
}