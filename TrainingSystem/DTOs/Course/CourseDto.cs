namespace TrainingSystem.DTOs.Course
{
    public class CourseDto
    {
        public int CourseID { get; set; }

        public string Title { get; set; } = "";

        public string Description { get; set; } = "";

        public int TrainerID { get; set; }

        public string TrainerName { get; set; } = "";
    }
}