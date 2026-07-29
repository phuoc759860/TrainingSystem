using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace TrainingSystem.DTOs.Material
{
    public class CreateMaterialDto
    {
        [Required]
        public string Title { get; set; } = "";

        public IFormFile? File { get; set; }

        public string? VideoUrl { get; set; }

        [Required]
        public int LessonID { get; set; }
    }
}