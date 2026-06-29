namespace TrainingSystem.Models{

public class User
{
    public int UserID { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public int RoleID { get; set; }

    public Role? Role { get; set; }

    public ICollection<Enrollment>? Enrollments { get; set; }

    public ICollection<ExamResult> ExamResults { get; set; }
    = new List<ExamResult>();
}
}