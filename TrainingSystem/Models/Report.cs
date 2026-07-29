namespace TrainingSystem.Models
{
public class Report
{
    public int ReportID { get; set; }

    public int UserID { get; set; }

    public int CourseID { get; set; }

    public decimal Score { get; set; }

    public string Status { get; set; } = string.Empty;

    public User? User { get; set; }

    public Course? Course { get; set; }
}
}