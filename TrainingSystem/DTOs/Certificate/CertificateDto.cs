namespace TrainingSystem.DTOs.Certificate
{
    public class CertificateDto
    {
        public int CertificateID { get; set; }
        public string CertificateNumber { get; set; } = "";
        public int UserID { get; set; }
        public string UserName { get; set; } = "";
        public int CourseID { get; set; }
        public string CourseTitle { get; set; } = "";
        public string TrainerName { get; set; } = "";
        public DateTime IssueDate { get; set; }
    }

    public class CourseCompletionDto
    {
        public bool Complete { get; set; }
        public int LessonsCompleted { get; set; }
        public int LessonsTotal { get; set; }
        public bool PassedExam { get; set; }
        public string? Reason { get; set; }
    }
}
