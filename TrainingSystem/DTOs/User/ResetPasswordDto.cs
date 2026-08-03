using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.User
{
    public class ResetPasswordDto
    {
        [Required]
        public string Token { get; set; } = "";

        [Required]
        public string NewPassword { get; set; } = "";
    }
}
