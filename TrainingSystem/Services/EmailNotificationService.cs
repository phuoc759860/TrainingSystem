using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.Models;

namespace TrainingSystem.Services
{
    public interface IEmailNotificationService
    {
        Task NotifyExamGradedAsync(User student, Exam exam, ExamResult result);
        Task NotifyNewMessageAsync(User sender, User receiver, Message message);
        Task SendCourseStartRemindersAsync();
    }

    public class EmailNotificationService : IEmailNotificationService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<EmailNotificationService> _logger;

        public EmailNotificationService(
            AppDbContext context,
            IEmailService emailService,
            ILogger<EmailNotificationService> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        private string Greeting(User user) =>
            $"Hi {user.Name},";

        private void LogSkip(string reason, string to)
        {
            _logger.LogInformation(
                "Email notification skipped ({Reason}) for {To}. " +
                "Set Email__Host/Email__Username/Email__Password to enable real delivery.",
                reason, to);
        }

        public async Task NotifyExamGradedAsync(User student, Exam exam, ExamResult result)
        {
            if (string.IsNullOrWhiteSpace(student.Email)) return;

            if (!_emailService.IsConfigured)
            {
                LogSkip("SMTP not configured", student.Email);
                return;
            }

            var body =
                $"<p>{Greeting(student)}</p>" +
                $"<p>Your attempt on the exam <b>{exam.Title}</b> has been graded.</p>" +
                $"<p>Score: <b>{result.Score}%</b></p>" +
                $"<p>Result: <b>{(result.Passed ? "Passed" : "Not passed")}</b></p>" +
                $"<p>You can review your answers in the course portal.</p>";

            try
            {
                await _emailService.SendAsync(student.Email, "Your exam has been graded", body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send 'exam graded' email to {To}", student.Email);
            }
        }

        public async Task NotifyNewMessageAsync(User sender, User receiver, Message message)
        {
            if (string.IsNullOrWhiteSpace(receiver.Email)) return;

            if (!_emailService.IsConfigured)
            {
                LogSkip("SMTP not configured", receiver.Email);
                return;
            }

            var body =
                $"<p>{Greeting(receiver)}</p>" +
                $"<p><b>{sender.Name}</b> sent you a new message:</p>" +
                $"<blockquote><b>{message.Subject}</b><br/>{message.Body}</blockquote>" +
                $"<p>Log in to read and reply.</p>";

            try
            {
                await _emailService.SendAsync(receiver.Email, $"New message from {sender.Name}", body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send 'new message' email to {To}", receiver.Email);
            }
        }

        public async Task SendCourseStartRemindersAsync()
        {
            var cutoff = DateTime.UtcNow.AddDays(1);
            var target = await _context.Enrollments
                .Include(e => e.User)
                .Include(e => e.Course)
                .Where(e => e.Course != null &&
                            e.Course.StartDate != null &&
                            e.Course.StartDate <= cutoff &&
                            e.Course.StartDate > DateTime.UtcNow &&
                            e.StartNotifiedAt == null)
                .ToListAsync();

            foreach (var enrollment in target)
            {
                if (enrollment.Course == null || enrollment.User == null) continue;

                // Mark notified regardless of email success so we only scan it once.
                enrollment.StartNotifiedAt = DateTime.UtcNow;

                if (string.IsNullOrWhiteSpace(enrollment.User.Email) || !_emailService.IsConfigured)
                {
                    LogSkip(_emailService.IsConfigured ? "no email on user" : "SMTP not configured",
                        enrollment.User.Email ?? "unknown");
                    continue;
                }

                var body =
                    $"<p>{Greeting(enrollment.User)}</p>" +
                    $"<p>Your course <b>{enrollment.Course.Title}</b> starts on " +
                    $"<b>{enrollment.Course.StartDate:MMM dd, yyyy}</b>. Get ready!</p>" +
                    $"<p>Log in to the portal to access the course materials.</p>";

                try
                {
                    await _emailService.SendAsync(
                        enrollment.User.Email,
                        $"Course starting soon: {enrollment.Course.Title}",
                        body);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send 'course start' email to {To}", enrollment.User.Email);
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
