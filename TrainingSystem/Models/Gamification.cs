namespace TrainingSystem.Models
{
    public class Badge
    {
        public int BadgeID { get; set; }
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public string IconUrl { get; set; } = "🏆";
        public int RequiredPoints { get; set; }
    }

    public class UserBadge
    {
        public int UserBadgeID { get; set; }
        public int UserID { get; set; }
        public User? User { get; set; }
        public int BadgeID { get; set; }
        public Badge? Badge { get; set; }
        public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
    }

    public class UserPoints
    {
        public int UserPointsID { get; set; }
        public int UserID { get; set; }
        public User? User { get; set; }
        public int Points { get; set; }
        public int StreakDays { get; set; }
        public DateTime? LastActivityAt { get; set; }
    }
}
