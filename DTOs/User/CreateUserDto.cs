using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.User
{
    public class CreateUserDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = "";

        [Required]
        [EmailAddress]
        public string Email { get; set; } = "";

        [Required]
        public string PasswordHash { get; set; } = "";

        [Required]
        public int RoleID { get; set; }
    }
}