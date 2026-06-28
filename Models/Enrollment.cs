namespace TrainingSystem.Models
{
    public class Enrollment
    {
        public int EnrollmentID { get; set; }

        public int UserID { get; set; }

        public User? User { get; set; }

        public int CourseID { get; set; }

        public Course? Course { get; set; }

        public DateTime EnrollDate { get; set; }

        public string Status { get; set; } = "In Progress";
    }
}