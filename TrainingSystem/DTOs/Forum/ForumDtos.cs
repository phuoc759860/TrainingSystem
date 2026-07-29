namespace TrainingSystem.DTOs.Forum
{
    public class CourseThreadDto
    {
        public int CourseThreadID { get; set; }
        public int CourseID { get; set; }
        public string CourseTitle { get; set; } = "";
        public string Title { get; set; } = "";
        public string Content { get; set; } = "";
        public int AuthorID { get; set; }
        public string AuthorName { get; set; } = "";
        public bool IsPinned { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastActivityAt { get; set; }
        public int ReplyCount { get; set; }
        public List<ThreadReplyDto> Replies { get; set; } = new();
    }

    public class ThreadReplyDto
    {
        public int ThreadReplyID { get; set; }
        public int CourseThreadID { get; set; }
        public string Content { get; set; } = "";
        public int AuthorID { get; set; }
        public string AuthorName { get; set; } = "";
        public DateTime CreatedAt { get; set; }
    }

    public class CreateThreadDto
    {
        public int CourseID { get; set; }
        public string Title { get; set; } = "";
        public string Content { get; set; } = "";
    }

    public class CreateReplyDto
    {
        public string Content { get; set; } = "";
    }
}
