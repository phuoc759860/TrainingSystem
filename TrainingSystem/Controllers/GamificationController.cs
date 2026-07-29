using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Gamification;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GamificationController : BaseApiController
    {
        public GamificationController(AppDbContext context) : base(context) { }

        [HttpGet("points")]
        public async Task<ActionResult<UserPointsDto>> GetPoints()
        {
            var up = await _context.UserPoints
                .FirstOrDefaultAsync(u => u.UserID == CurrentUserId);

            var level = up != null ? (up.Points / 100) + 1 : 1;
            var nextLevel = level * 100;
            var current = up?.Points ?? 0;

            return Ok(new UserPointsDto
            {
                Points = current,
                StreakDays = up?.StreakDays ?? 0,
                Level = level,
                PointsToNextLevel = nextLevel - current
            });
        }

        [HttpGet("badges")]
        public async Task<ActionResult<IEnumerable<BadgeDto>>> GetBadges()
        {
            var allBadges = await _context.Badges
                .OrderBy(b => b.RequiredPoints)
                .ToListAsync();

            var earnedBadges = await _context.UserBadges
                .Where(ub => ub.UserID == CurrentUserId)
                .ToDictionaryAsync(ub => ub.BadgeID, ub => ub.EarnedAt);

            var dtos = allBadges.Select(b => new BadgeDto
            {
                BadgeID = b.BadgeID,
                Name = b.Name,
                Description = b.Description,
                IconUrl = b.IconUrl,
                RequiredPoints = b.RequiredPoints,
                IsEarned = earnedBadges.ContainsKey(b.BadgeID),
                EarnedAt = earnedBadges.GetValueOrDefault(b.BadgeID)
            }).ToList();

            return Ok(dtos);
        }

        [HttpGet("leaderboard")]
        public async Task<ActionResult<object>> GetLeaderboard([FromQuery] int top = 20)
        {
            var leaderboard = await _context.UserPoints
                .Include(u => u.User)
                .OrderByDescending(u => u.Points)
                .Take(top)
                .Select(u => new
                {
                    u.UserID,
                    UserName = u.User!.Name,
                    u.Points,
                    u.StreakDays,
                    Level = (u.Points / 100) + 1
                })
                .ToListAsync();

            return Ok(leaderboard);
        }

        [HttpGet("seed-badges")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SeedBadges()
        {
            if (await _context.Badges.AnyAsync())
                return BadRequest(new { message = "Badges already seeded." });

            var badges = new[]
            {
                new Models.Badge { Name = "First Steps", Description = "Earn 50 points", IconUrl = "🌱", RequiredPoints = 50 },
                new Models.Badge { Name = "Active Learner", Description = "Earn 200 points", IconUrl = "📚", RequiredPoints = 200 },
                new Models.Badge { Name = "Course Explorer", Description = "Earn 500 points", IconUrl = "🗺️", RequiredPoints = 500 },
                new Models.Badge { Name = "Forum Contributor", Description = "Earn 1000 points", IconUrl = "💬", RequiredPoints = 1000 },
                new Models.Badge { Name = "Knowledge Master", Description = "Earn 2000 points", IconUrl = "🎓", RequiredPoints = 2000 },
                new Models.Badge { Name = "Platinum Scholar", Description = "Earn 5000 points", IconUrl = "🏆", RequiredPoints = 5000 },
            };

            _context.Badges.AddRange(badges);
            await _context.SaveChangesAsync();
            return Ok(new { message = "6 badges seeded." });
        }
    }
}
