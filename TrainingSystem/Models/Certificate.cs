namespace TrainingSystem.Models
{
    public class Certificate
    {
        public int CertificateID { get; set; }

        public string CertificateNumber { get; set; } = "";

        public int UserID { get; set; }
        public User? User { get; set; }

        public int CourseID { get; set; }
        public Course? Course { get; set; }

        public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    }
}
