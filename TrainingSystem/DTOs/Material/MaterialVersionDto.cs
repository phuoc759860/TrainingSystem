namespace TrainingSystem.DTOs.Material
{
    public class MaterialVersionDto
    {
        public int MaterialVersionID { get; set; }
        public int MaterialID { get; set; }
        public int VersionNumber { get; set; }
        public string Title { get; set; } = "";
        public string FilePath { get; set; } = "";
        public string? VideoUrl { get; set; }
        public string EditedByUserName { get; set; } = "";
        public DateTime SavedAt { get; set; }
    }
}
