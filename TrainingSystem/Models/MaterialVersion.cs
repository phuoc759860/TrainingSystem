namespace TrainingSystem.Models
{
    public class MaterialVersion
    {
        public int MaterialVersionID { get; set; }

        public int MaterialID { get; set; }
        public Material? Material { get; set; }

        public int VersionNumber { get; set; }

        public string Title { get; set; } = "";
        public string FilePath { get; set; } = "";
        public string? VideoUrl { get; set; }

        public int EditedByUserID { get; set; }
        public User? EditedByUser { get; set; }

        public DateTime SavedAt { get; set; } = DateTime.UtcNow;
    }
}
