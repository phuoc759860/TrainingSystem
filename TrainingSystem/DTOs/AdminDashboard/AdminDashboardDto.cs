namespace TrainingSystem.DTOs.AdminDashboard
{
    public class AdminDashboardDto
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

        public int TotalQuizzes { get; set; }
        public int TotalForumThreads { get; set; }
        public int TotalMessages { get; set; }

        public List<RecentRegistration> RecentRegistrations { get; set; } = new();
        public List<PopularCourse> PopularCourses { get; set; } = new();
    }

    public class RecentRegistration
    {
        public int UserID { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string Role { get; set; } = "";
        public DateTime CreatedAt { get; set; }
    }

    public class PopularCourse
    {
        public int CourseID { get; set; }
        public string Title { get; set; } = "";
        public int StudentCount { get; set; }
    }
}
