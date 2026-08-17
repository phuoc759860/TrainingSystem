using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.User
{
    public class UpdateProfileDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = "";

        [Required]
        [EmailAddress]
        [MaxLength(200)]
        public string Email { get; set; } = "";
    }
}
