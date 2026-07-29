using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Progress
{
    public class CreateProgressDto
    {
        [Required]
        public int LessonID { get; set; }

        [Required]
        public int CourseID { get; set; }
    }
}
