namespace TrainingSystem.Models
{
    public class Message
    {
        public int MessageID { get; set; }
        public int SenderID { get; set; }
        public User? Sender { get; set; }
        public int ReceiverID { get; set; }
        public User? Receiver { get; set; }
        public string Subject { get; set; } = "";
        public string Body { get; set; } = "";
        public bool IsRead { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
