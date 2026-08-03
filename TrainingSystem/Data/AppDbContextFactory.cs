using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TrainingSystem.Data
{
    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var connStr = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
                ?? "Server=localhost;Database=onlinetrainingsystem;User=root;Password=root;";

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseMySql(connStr, new MySqlServerVersion(new Version(8, 0, 36)))
                .Options;

            return new AppDbContext(options);
        }
    }
}
