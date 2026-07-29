namespace TrainingSystem.DTOs.StudentDashboard
{
    public class StudentDashboardDto
    {
        public int EnrolledCourses { get; set; }
        public int CompletedLessons { get; set; }
        public int TotalLessons { get; set; }
        public int UpcomingExams { get; set; }
        public int PendingQuizzes { get; set; }
        public double OverallProgress { get; set; }

        public List<EnrolledCourseInfo> Courses { get; set; } = new();
        public List<UpcomingExamItem> UpcomingExamsList { get; set; } = new();
        public List<RecentGradeItem> RecentGrades { get; set; } = new();
    }

    public class EnrolledCourseInfo
    {
        public int CourseID { get; set; }
        public string Title { get; set; } = "";
        public string TrainerName { get; set; } = "";
        public int CompletedLessons { get; set; }
        public int TotalLessons { get; set; }
        public double Progress { get; set; }
        public string? LastLessonTitle { get; set; }
        public int? LastLessonID { get; set; }
    }

    public class UpcomingExamItem
    {
        public int ExamID { get; set; }
        public string Title { get; set; } = "";
        public string CourseTitle { get; set; } = "";
        public DateTime? ScheduledDate { get; set; }
    }

    public class RecentGradeItem
    {
        public int ResultID { get; set; }
        public string ExamTitle { get; set; } = "";
        public string CourseTitle { get; set; } = "";
        public decimal Score { get; set; }
        public bool Passed { get; set; }
        public DateTime SubmittedAt { get; set; }
    }
}
