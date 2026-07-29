using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Material
{
    public class UpdateMaterialDto
    {
        [Required]
        public string Title { get; set; } = "";

        public IFormFile? File { get; set; }

        public string? VideoUrl { get; set; }

        [Required]
        public int LessonID { get; set; }
    }
}