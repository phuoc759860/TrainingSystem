using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Enrollment
{
    public class UpdateEnrollmentDto
    {
        [Required]
        public string Status { get; set; } = "";
    }
}