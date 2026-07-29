namespace TrainingSystem.DTOs.Enrollment
{
    public class EnrollmentDto
    {
        public int EnrollmentID { get; set; }

        public int UserID { get; set; }

        public string UserName { get; set; } = "";

        public int CourseID { get; set; }

        public string CourseTitle { get; set; } = "";

        public DateTime EnrollDate { get; set; }

        public string Status { get; set; } = "";
    }
}