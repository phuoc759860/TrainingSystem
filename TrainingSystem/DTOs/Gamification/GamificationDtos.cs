namespace TrainingSystem.DTOs.Gamification
{
    public class BadgeDto
    {
        public int BadgeID { get; set; }
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public string IconUrl { get; set; } = "";
        public int RequiredPoints { get; set; }
        public bool IsEarned { get; set; }
        public DateTime? EarnedAt { get; set; }
    }

    public class UserPointsDto
    {
        public int Points { get; set; }
        public int StreakDays { get; set; }
        public int Level { get; set; }
        public int PointsToNextLevel { get; set; }
    }
}
