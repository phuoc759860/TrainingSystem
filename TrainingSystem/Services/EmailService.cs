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

        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(_configuration["Email:Host"]) &&
            !string.IsNullOrWhiteSpace(_configuration["Email:Username"]);

        public Task SendAsync(string to, string subject, string body)
        {
            var host = _configuration["Email:Host"];
            var username = _configuration["Email:Username"];
            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(username))
            {
                _logger.LogWarning(
                    "Email not sent because SMTP is not fully configured (set Email:Host and Email:Username). " +
                    "To: {To}, Subject: {Subject}, Body: {Body}",
                    to, subject, body);
                return Task.CompletedTask;
            }
            var port = _configuration.GetValue("Email:Port", 587);
            var password = _configuration["Email:Password"];
            var from = _configuration["Email:From"] ?? username;
            var enableSsl = _configuration.GetValue("Email:EnableSsl", true);

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = enableSsl
            };

            using var message = new MailMessage(from, to, subject, body) { IsBodyHtml = true };

            return client.SendMailAsync(message);
        }
    }
}
