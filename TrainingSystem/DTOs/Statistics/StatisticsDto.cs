namespace TrainingSystem.DTOs.Statistics
{
    public class StudentOverviewDto
    {
        public int UserID { get; set; }
        public string Name { get; set; } = "";
        public int ExamsTaken { get; set; }
        public decimal AverageScore { get; set; }
        public decimal PassRate { get; set; }
        public bool NeedsAttention { get; set; }
    }

    public class CourseScoreDto
    {
        public int CourseID { get; set; }
        public string CourseTitle { get; set; } = "";
        public decimal AverageScore { get; set; }
        public int ExamsTaken { get; set; }
    }

    public class ExamScoreDto
    {
        public int ExamID { get; set; }
        public string ExamTitle { get; set; } = "";
        public decimal Score { get; set; }
    }

    public class StudentDetailDto
    {
        public int UserID { get; set; }
        public string Name { get; set; } = "";
        public int ExamsTaken { get; set; }
        public decimal AverageScore { get; set; }
        public decimal PassRate { get; set; }
        public string? StrongestCourse { get; set; }
        public string? WeakestCourse { get; set; }
        public decimal? MultipleChoiceAccuracy { get; set; }
        public decimal? EssayAverageScore { get; set; }
        public List<CourseScoreDto> CourseBreakdown { get; set; } = new();
        public List<ExamScoreDto> StrongestExams { get; set; } = new();
        public List<ExamScoreDto> WeakestExams { get; set; } = new();
    }

    public class QuestionInsightDto
    {
        public int QuestionID { get; set; }
        public int ExamID { get; set; }
        public string ExamTitle { get; set; } = "";
        public string Content { get; set; } = "";
        public string QuestionType { get; set; } = "";
        public int AttemptCount { get; set; }
        public decimal AccuracyRate { get; set; }
    }

    public class ExamRankingDto
    {
        public int ExamID { get; set; }
        public string ExamTitle { get; set; } = "";
        public string CourseTitle { get; set; } = "";
        public int AttemptCount { get; set; }
        public decimal AverageScore { get; set; }
        public decimal PassRate { get; set; }
    }

    public class TrainerOverviewDto
    {
        public int UserID { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public int CoursesCount { get; set; }
        public int TotalStudents { get; set; }
        public int TotalExams { get; set; }
        public decimal AverageScore { get; set; }
        public decimal PassRate { get; set; }
    }

    public class TrainerCourseDto
    {
        public int CourseID { get; set; }
        public string CourseTitle { get; set; } = "";
        public int EnrolledStudents { get; set; }
        public int ExamsTaken { get; set; }
        public decimal AverageScore { get; set; }
        public decimal PassRate { get; set; }
    }

    public class TrainerDetailDto
    {
        public int UserID { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public int CoursesCount { get; set; }
        public int TotalStudents { get; set; }
        public int TotalExams { get; set; }
        public decimal AverageScore { get; set; }
        public decimal PassRate { get; set; }
        public List<TrainerCourseDto> Courses { get; set; } = new();
    }
}