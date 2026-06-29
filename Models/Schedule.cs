namespace TrainingSystem.Models
{
public class Schedule
{
    public int ScheduleID { get; set; }

    public int CourseID { get; set; }

    public int? ExamID { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public Course? Course { get; set; }

    public Exam? Exam { get; set; }
}
}