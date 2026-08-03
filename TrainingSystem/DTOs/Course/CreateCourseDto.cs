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

        /// <summary>Price in USD. 0 or less = free course.</summary>
        public decimal Price { get; set; }

        public DateTime? StartDate { get; set; }
    }
}