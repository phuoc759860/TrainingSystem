using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Enrollment
{
    public class CreateEnrollmentDto
    {
        [Required]
        public int UserID { get; set; }

        [Required]
        public int CourseID { get; set; }

        public DateTime EnrollDate { get; set; } = DateTime.Now;

        [AllowedValues("Enrolled", "In Progress", "Completed", "Dropped")]
        public string Status { get; set; } = "Enrolled";
    }
}