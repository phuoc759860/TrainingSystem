using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Material
{
    public class UpdateMaterialDto
    {
        [Required]
        public string Title { get; set; } = "";

        [Required]
        public string FilePath { get; set; } = "";

        [Required]
        public int LessonID { get; set; }
    }
}