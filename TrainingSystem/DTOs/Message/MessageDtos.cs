namespace TrainingSystem.DTOs.Message
{
    public class MessageDto
    {
        public int MessageID { get; set; }
        public int SenderID { get; set; }
        public string SenderName { get; set; } = "";
        public int ReceiverID { get; set; }
        public string ReceiverName { get; set; } = "";
        public string Subject { get; set; } = "";
        public string Body { get; set; } = "";
        public bool IsRead { get; set; }
        public DateTime SentAt { get; set; }
    }

    public class SendMessageDto
    {
        public int ReceiverID { get; set; }
        public string Subject { get; set; } = "";
        public string Body { get; set; } = "";
    }
}
