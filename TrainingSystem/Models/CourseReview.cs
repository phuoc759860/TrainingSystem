namespace TrainingSystem.Models
{
    public class CourseReview
    {
        public int CourseReviewID { get; set; }
        public int CourseID { get; set; }
        public Course? Course { get; set; }
        public int UserID { get; set; }
        public User? User { get; set; }
        public int Rating { get; set; }      // 1-5
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
