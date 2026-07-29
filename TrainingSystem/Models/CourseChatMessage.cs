namespace TrainingSystem.Models
{
    public class CourseChatMessage
    {
        public int CourseChatMessageID { get; set; }
        public int CourseID { get; set; }
        public Course? Course { get; set; }
        public int SenderID { get; set; }
        public User? Sender { get; set; }
        public string Message { get; set; } = "";
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
