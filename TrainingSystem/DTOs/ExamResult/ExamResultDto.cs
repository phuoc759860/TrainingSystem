namespace TrainingSystem.DTOs.ExamResult
{
    public class ExamResultDto
    {
        public int ResultID { get; set; }

        public int UserID { get; set; }

        public int ExamID { get; set; }
     
        public string UserName { get; set; } = "";

        public string ExamTitle { get; set; } = "";
        
        public decimal Score { get; set; }
        
        public bool Passed { get; set; }
        
        public bool NeedsGrading { get; set; }   // NEW
        
        public DateTime SubmittedAt { get; set; } = DateTime.Now;
    }
}