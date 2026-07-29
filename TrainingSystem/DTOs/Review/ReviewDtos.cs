namespace TrainingSystem.DTOs.Review
{
    public class CourseReviewDto
    {
        public int CourseReviewID { get; set; }
        public int CourseID { get; set; }
        public string CourseTitle { get; set; } = "";
        public int UserID { get; set; }
        public string UserName { get; set; } = "";
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateReviewDto
    {
        public int CourseID { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class CourseRatingSummaryDto
    {
        public int CourseID { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public Dictionary<int, int> RatingDistribution { get; set; } = new();
    }
}
