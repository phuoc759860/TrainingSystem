namespace TrainingSystem.DTOs.Dashboard
{
    public class DashboardDto
    {
        public int TotalUsers { get; set; }
        public int AdminCount { get; set; }
        public int TrainerCount { get; set; }
        public int StudentCount { get; set; }

        public int TotalCourses { get; set; }

        public int TotalLessons { get; set; }

        public int TotalMaterials { get; set; }

        public int TotalExams { get; set; }

        public int TotalEnrollments { get; set; }
        public int ActiveEnrollments { get; set; }

        public int TotalResults { get; set; }
        public int PassedResults { get; set; }
    }
}