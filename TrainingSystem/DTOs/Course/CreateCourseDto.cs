using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Course
{
    public class CreateCourseDto
    {
        [Required]
        public string Title { get; set; } = "";

        public string Description { get; set; } = "";

        [Required]
        public int TrainerID { get; set; }
    }
}