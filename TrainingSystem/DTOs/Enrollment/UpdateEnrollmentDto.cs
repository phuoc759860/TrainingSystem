using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Enrollment
{
    public class UpdateEnrollmentDto
    {
        [Required]
        [AllowedValues("Enrolled", "In Progress", "Completed", "Dropped")]
        public string Status { get; set; } = "";
    }
}