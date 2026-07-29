namespace TrainingSystem.DTOs.User
{
    public class UserDto
    {
        public int UserID { get; set; }

        public string Name { get; set; } = "";

        public string Email { get; set; } = "";

        public int RoleID { get; set; }

        public string RoleName { get; set; } = "";
    }
}