using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Lesson
{
    public class CreateLessonDto
    {
        [Required]
        public string Title { get; set; } = "";

        public string? Description { get; set; }

        [Required]
        public int CourseID { get; set; }

        public int OrderIndex { get; set; }

        public int? UnlocksAfterLessonID { get; set; }
    }
}
