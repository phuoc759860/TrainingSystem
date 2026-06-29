namespace TrainingSystem.DTOs.Material
{
    public class MaterialDto
    {
        public int MaterialID { get; set; }

        public string Title { get; set; } = "";

        public string FilePath { get; set; } = "";

        public int LessonID { get; set; }

        public string LessonTitle { get; set; } = "";
    }
}