namespace TrainingSystem.DTOs.Grade
{
    public class CourseGradeDto
    {
        public int CourseID { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public decimal? QuizScore { get; set; }
        public decimal? ExamScore { get; set; }
        public decimal? FinalGrade { get; set; }
        public int QuizCount { get; set; }
        public int QuizAttempted { get; set; }
        public int ExamCount { get; set; }
        public int ExamAttempted { get; set; }
    }

    public class StudentGradeDetailDto
    {
        public int UserID { get; set; }
        public string UserName { get; set; } = string.Empty;
        public List<CourseGradeDto> Grades { get; set; } = new();
        public decimal? OverallAverage { get; set; }
    }
}
