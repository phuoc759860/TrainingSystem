using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.User
{
    public class UpdateUserDto
    {
        [Required]
        public string Name { get; set; } = "";

        [Required]
        [EmailAddress]
        public string Email { get; set; } = "";

        [Required]
        public int RoleID { get; set; }

        // Optional on purpose — only hash + overwrite if the admin actually
        // typed a new password. Leave blank to keep the existing one.
        public string? Password { get; set; }
    }
}