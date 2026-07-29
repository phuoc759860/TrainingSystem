namespace TrainingSystem.Models
{
    public class CourseThread
    {
        public int CourseThreadID { get; set; }
        public int CourseID { get; set; }
        public Course? Course { get; set; }
        public string Title { get; set; } = "";
        public string Content { get; set; } = "";
        public int AuthorID { get; set; }
        public User? Author { get; set; }
        public bool IsPinned { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastActivityAt { get; set; }
        public ICollection<ThreadReply> Replies { get; set; } = new List<ThreadReply>();
    }

    public class ThreadReply
    {
        public int ThreadReplyID { get; set; }
        public int CourseThreadID { get; set; }
        public CourseThread? Thread { get; set; }
        public string Content { get; set; } = "";
        public int AuthorID { get; set; }
        public User? Author { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
