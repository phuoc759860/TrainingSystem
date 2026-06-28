namespace TrainingSystem.Models{
public class Course
{
    public int CourseID { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int TrainerID { get; set; }

    public User? Trainer { get; set; }

    public ICollection<Lesson>? Lessons { get; set; }

    public ICollection<Enrollment>? Enrollments { get; set; }
}
}