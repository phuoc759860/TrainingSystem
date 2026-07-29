namespace TrainingSystem.DTOs.Notification
{
    public class NotificationDto
    {
        public int NotificationID { get; set; }
        public string Title { get; set; } = "";
        public string? Body { get; set; }
        public string? Link { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
