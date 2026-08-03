using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.User
{
    public class VerifyEmailDto
    {
        [Required]
        public string Token { get; set; } = "";
    }
}
