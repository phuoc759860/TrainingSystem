using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.User
{
    public class ForgotPasswordDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = "";
    }
}
