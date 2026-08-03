namespace TrainingSystem.Services
{
    public interface IEmailService
    {
        bool IsConfigured { get; }
        Task SendAsync(string to, string subject, string body);
    }
}
