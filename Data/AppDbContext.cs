using Microsoft.EntityFrameworkCore;
using TrainingSystem.Models;

namespace TrainingSystem.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

        public DbSet<User> Users { get; set; }
        public DbSet<Course> Courses { get; set; }

        public DbSet<Role> Roles { get; set; }

        public DbSet<Enrollment> Enrollments { get; set; }

        public DbSet<Lesson> Lessons { get; set; }

        public DbSet<Material> Materials { get; set; }

        public DbSet<Exam> Exams { get; set; }

        public DbSet<QuestionBank> QuestionBanks { get; set; }

        public DbSet<ExamResult> ExamResult { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserID);

            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Course)
                .WithMany()
                .HasForeignKey(e => e.CourseID);
        }
    }
}
