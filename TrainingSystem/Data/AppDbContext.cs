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

        public DbSet<ExamAnswer> ExamAnswers { get; set; }

        public DbSet<ScheduleEntry> ScheduleEntries { get; set; }

        public DbSet<LessonProgress> LessonProgress { get; set; }

        public DbSet<MaterialViewed> MaterialViewed { get; set; }

        public DbSet<Quiz> Quizzes { get; set; }
        public DbSet<QuizQuestion> QuizQuestions { get; set; }
        public DbSet<QuizAttempt> QuizAttempts { get; set; }
        public DbSet<QuizAnswer> QuizAnswers { get; set; }

        public DbSet<RevokedToken> RevokedTokens { get; set; }

        public DbSet<LessonVersion> LessonVersions { get; set; }
        public DbSet<MaterialVersion> MaterialVersions { get; set; }
        public DbSet<CourseThread> CourseThreads { get; set; }
        public DbSet<ThreadReply> ThreadReplies { get; set; }
        public DbSet<CourseReview> CourseReviews { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Badge> Badges { get; set; }
        public DbSet<UserBadge> UserBadges { get; set; }
        public DbSet<UserPoints> UserPoints { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Course>()
                .HasQueryFilter(c => !c.IsDeleted);

            // Matching query filters on dependent entities to avoid EF Core warning 10622
            modelBuilder.Entity<Enrollment>()
                .HasQueryFilter(e => e.Course == null || !e.Course.IsDeleted);
            modelBuilder.Entity<Lesson>()
                .HasQueryFilter(l => l.Course == null || !l.Course.IsDeleted);
            modelBuilder.Entity<Exam>()
                .HasQueryFilter(e => e.Course == null || !e.Course.IsDeleted);
            modelBuilder.Entity<ScheduleEntry>()
                .HasQueryFilter(s => s.Course == null || !s.Course.IsDeleted);
            modelBuilder.Entity<LessonProgress>()
                .HasQueryFilter(lp => lp.Course == null || !lp.Course.IsDeleted);
            modelBuilder.Entity<CourseThread>()
                .HasQueryFilter(t => t.Course == null || !t.Course.IsDeleted);
            modelBuilder.Entity<CourseReview>()
                .HasQueryFilter(r => r.Course == null || !r.Course.IsDeleted);

            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.User)
                .WithMany(u => u.Enrollments)
                .HasForeignKey(e => e.UserID);

            modelBuilder.Entity<Enrollment>()
                .HasOne(e => e.Course)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.CourseID);

            modelBuilder.Entity<Course>()
                .HasOne(c => c.Trainer)
                .WithMany(u => u.Courses)
                .HasForeignKey(c => c.TrainerID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ScheduleEntry>()
                .HasOne(s => s.Course)
                .WithMany(c => c.ScheduleEntries)
                .HasForeignKey(s => s.CourseID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ScheduleEntry>()
                .HasOne(s => s.Lesson)
                .WithMany(l => l.ScheduleEntries)
                .HasForeignKey(s => s.LessonID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LessonProgress>()
                .HasOne(lp => lp.User)
                .WithMany(u => u.LessonProgressRecords)
                .HasForeignKey(lp => lp.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LessonProgress>()
                .HasOne(lp => lp.Lesson)
                .WithMany(l => l.ProgressRecords)
                .HasForeignKey(lp => lp.LessonID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LessonProgress>()
                .HasOne(lp => lp.Course)
                .WithMany(c => c.LessonProgressRecords)
                .HasForeignKey(lp => lp.CourseID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LessonProgress>()
                .HasOne(lp => lp.LastMaterial)
                .WithMany()
                .HasForeignKey(lp => lp.LastMaterialID)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<LessonProgress>()
                .HasIndex(lp => new { lp.UserID, lp.LessonID })
                .IsUnique();

            modelBuilder.Entity<MaterialViewed>()
                .HasOne(mv => mv.User)
                .WithMany()
                .HasForeignKey(mv => mv.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MaterialViewed>()
                .HasOne(mv => mv.Material)
                .WithMany()
                .HasForeignKey(mv => mv.MaterialID)
                .OnDelete(DeleteBehavior.Cascade);

            // Quiz: one per Lesson
            modelBuilder.Entity<Quiz>()
                .HasOne(q => q.Lesson)
                .WithMany()
                .HasForeignKey(q => q.LessonID)
                .OnDelete(DeleteBehavior.Cascade);

            // QuizQuestion: belongs to Quiz
            modelBuilder.Entity<QuizQuestion>()
                .HasOne(qq => qq.Quiz)
                .WithMany(q => q.Questions)
                .HasForeignKey(qq => qq.QuizID)
                .OnDelete(DeleteBehavior.Cascade);

            // QuizAttempt: Quiz + User
            modelBuilder.Entity<QuizAttempt>()
                .HasOne(qa => qa.Quiz)
                .WithMany()
                .HasForeignKey(qa => qa.QuizID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<QuizAttempt>()
                .HasOne(qa => qa.User)
                .WithMany()
                .HasForeignKey(qa => qa.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            // QuizAnswer: belongs to QuizAttempt + QuizQuestion
            modelBuilder.Entity<QuizAnswer>()
                .HasOne(a => a.QuizAttempt)
                .WithMany(qa => qa.Answers)
                .HasForeignKey(a => a.QuizAttemptID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<QuizAnswer>()
                .HasOne(a => a.QuizQuestion)
                .WithMany()
                .HasForeignKey(a => a.QuizQuestionID)
                .OnDelete(DeleteBehavior.Cascade);

            // LessonVersion
            modelBuilder.Entity<LessonVersion>()
                .HasOne(lv => lv.Lesson)
                .WithMany()
                .HasForeignKey(lv => lv.LessonID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LessonVersion>()
                .HasOne(lv => lv.EditedByUser)
                .WithMany()
                .HasForeignKey(lv => lv.EditedByUserID)
                .OnDelete(DeleteBehavior.Restrict);

            // MaterialVersion
            modelBuilder.Entity<MaterialVersion>()
                .HasOne(mv => mv.Material)
                .WithMany()
                .HasForeignKey(mv => mv.MaterialID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MaterialVersion>()
                .HasOne(mv => mv.EditedByUser)
                .WithMany()
                .HasForeignKey(mv => mv.EditedByUserID)
                .OnDelete(DeleteBehavior.Restrict);

            // Lesson drip content self-referencing FK
            modelBuilder.Entity<Lesson>()
                .HasOne(l => l.UnlocksAfterLesson)
                .WithMany()
                .HasForeignKey(l => l.UnlocksAfterLessonID)
                .OnDelete(DeleteBehavior.SetNull);

            // CourseThread
            modelBuilder.Entity<CourseThread>()
                .HasOne(t => t.Course)
                .WithMany()
                .HasForeignKey(t => t.CourseID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<CourseThread>()
                .HasOne(t => t.Author)
                .WithMany()
                .HasForeignKey(t => t.AuthorID)
                .OnDelete(DeleteBehavior.Restrict);

            // ThreadReply
            modelBuilder.Entity<ThreadReply>()
                .HasOne(r => r.Thread)
                .WithMany(t => t.Replies)
                .HasForeignKey(r => r.CourseThreadID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ThreadReply>()
                .HasOne(r => r.Author)
                .WithMany()
                .HasForeignKey(r => r.AuthorID)
                .OnDelete(DeleteBehavior.Restrict);

            // CourseReview
            modelBuilder.Entity<CourseReview>()
                .HasOne(r => r.Course)
                .WithMany()
                .HasForeignKey(r => r.CourseID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<CourseReview>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<CourseReview>()
                .HasIndex(r => new { r.CourseID, r.UserID })
                .IsUnique();

            // Message
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderID)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverID)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            // UserBadge
            modelBuilder.Entity<UserBadge>()
                .HasOne(ub => ub.User)
                .WithMany()
                .HasForeignKey(ub => ub.UserID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<UserBadge>()
                .HasOne(ub => ub.Badge)
                .WithMany()
                .HasForeignKey(ub => ub.BadgeID)
                .OnDelete(DeleteBehavior.Cascade);

            // UserPoints
            modelBuilder.Entity<UserPoints>()
                .HasOne(up => up.User)
                .WithMany()
                .HasForeignKey(up => up.UserID)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
