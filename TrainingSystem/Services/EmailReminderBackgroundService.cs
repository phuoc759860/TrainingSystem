namespace TrainingSystem.Services
{
    public class EmailReminderBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<EmailReminderBackgroundService> _logger;

        public EmailReminderBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<EmailReminderBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Run the scan hourly; each scan also handles catching up.
            using var timer = new PeriodicTimer(TimeSpan.FromHours(1));

            do
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var service = scope.ServiceProvider.GetRequiredService<IEmailNotificationService>();
                    await service.SendCourseStartRemindersAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Course start reminder scan failed.");
                }
            } while (await timer.WaitForNextTickAsync(stoppingToken));
        }
    }
}
