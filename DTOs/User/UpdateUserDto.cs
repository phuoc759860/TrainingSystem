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
    }
}