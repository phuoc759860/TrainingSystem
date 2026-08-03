using System.Net;
using System.Net.Mail;

namespace TrainingSystem.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public bool IsConfigured => !string.IsNullOrWhiteSpace(_configuration["Email:Host"]);

        public Task SendAsync(string to, string subject, string body)
        {
            var host = _configuration["Email:Host"];
            if (string.IsNullOrWhiteSpace(host))
            {
                _logger.LogWarning(
                    "Email not sent because SMTP is not configured (set Email:Host). To: {To}, Subject: {Subject}, Body: {Body}",
                    to, subject, body);
                return Task.CompletedTask;
            }

            var port = _configuration.GetValue("Email:Port", 587);
            var username = _configuration["Email:Username"];
            var password = _configuration["Email:Password"];
            var from = _configuration["Email:From"] ?? username ?? "no-reply@traininghub.local";
            var enableSsl = _configuration.GetValue("Email:EnableSsl", true);

            using var client = new SmtpClient(host, port)
            {
                Credentials = string.IsNullOrEmpty(username)
                    ? null
                    : new NetworkCredential(username, password),
                EnableSsl = enableSsl,
                UseDefaultCredentials = string.IsNullOrEmpty(username)
            };

            using var message = new MailMessage(from, to, subject, body) { IsBodyHtml = true };

            return client.SendMailAsync(message);
        }
    }
}
