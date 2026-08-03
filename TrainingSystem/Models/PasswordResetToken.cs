namespace TrainingSystem.Models
{
    public class PasswordResetToken
    {
        public int Id { get; set; }
        public int UserID { get; set; }
        public User? User { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; }
        public DateTime? UsedAt { get; set; }
    }
}
