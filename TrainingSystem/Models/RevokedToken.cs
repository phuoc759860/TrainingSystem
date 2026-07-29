using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.Models
{
    public class RevokedToken
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Jti { get; set; } = string.Empty;

        public DateTime RevokedAt { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; set; }
    }
}
