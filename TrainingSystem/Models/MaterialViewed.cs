namespace TrainingSystem.Models
{
    public class MaterialViewed
    {
        public int MaterialViewedID { get; set; }

        public int UserID { get; set; }

        public User? User { get; set; }

        public int MaterialID { get; set; }

        public Material? Material { get; set; }

        public int LessonID { get; set; }

        public int CourseID { get; set; }

        public DateTime ViewedAt { get; set; } = DateTime.Now;

        public int LastPage { get; set; } = 1;
    }
}
