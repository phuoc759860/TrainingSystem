namespace TrainingSystem.DTOs.Course
{
    public class CourseDto
    {
        public int CourseID { get; set; }

        public string Title { get; set; } = "";

        public string Description { get; set; } = "";

        public int TrainerID { get; set; }

        public string TrainerName { get; set; } = "";

        public decimal Price { get; set; }

        public string Currency { get; set; } = "USD";

        public bool IsFree => Price <= 0;

        public bool IsPublished { get; set; } = true;

        public int ContentVersion { get; set; } = 1;

        public DateTime? StartDate { get; set; }
    }
}