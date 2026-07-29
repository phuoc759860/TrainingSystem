namespace TrainingSystem.DTOs.TrainerDashboard
{
    public class TrainerDashboardDto
    {
        public int MyCourses { get; set; }
        public int MyStudents { get; set; }
        public int TotalLessons { get; set; }
        public int TotalExams { get; set; }
        public int TotalQuizzes { get; set; }
        public int PendingGrading { get; set; }
        public int TotalEnrollments { get; set; }
        public int ActiveEnrollments { get; set; }

        public List<TrainerCourseInfo> Courses { get; set; } = new();
        public List<UpcomingScheduleItem> UpcomingSchedule { get; set; } = new();
        public List<PendingGradeItem> PendingGrades { get; set; } = new();
    }

    public class TrainerCourseInfo
    {
        public int CourseID { get; set; }
        public string Title { get; set; } = "";
        public int StudentCount { get; set; }
        public int LessonCount { get; set; }
        public int ExamCount { get; set; }
    }

    public class UpcomingScheduleItem
    {
        public int ScheduleEntryID { get; set; }
        public string CourseTitle { get; set; } = "";
        public string LessonTitle { get; set; } = "";
        public string DayOfWeek { get; set; } = "";
        public string StartTime { get; set; } = "";
        public string EndTime { get; set; } = "";
    }

    public class PendingGradeItem
    {
        public int ResultID { get; set; }
        public string StudentName { get; set; } = "";
        public string ExamTitle { get; set; } = "";
        public string CourseTitle { get; set; } = "";
        public DateTime SubmittedAt { get; set; }
    }
}
