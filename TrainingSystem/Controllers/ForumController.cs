using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.Models;
using TrainingSystem.DTOs.Forum;
using TrainingSystem.DTOs.Common;
using TrainingSystem.Middlewares;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ForumController : BaseApiController
    {
        private readonly RateLimiterService _rateLimiter;

        public ForumController(AppDbContext context, RateLimiterService rateLimiter) : base(context)
        {
            _rateLimiter = rateLimiter;
        }

        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<PaginatedResult<CourseThreadDto>>> GetThreads(
            int courseId, [FromQuery] PaginationQuery pg)
        {
            if (!await IsEnrolled(courseId)) return Forbid();

            var query = _context.CourseThreads
                .Include(t => t.Author)
                .Include(t => t.Replies)
                .Where(t => t.CourseID == courseId)
                .AsQueryable();

            var totalCount = await query.CountAsync();

            var threads = await query
                .OrderByDescending(t => t.IsPinned)
                .ThenByDescending(t => t.LastActivityAt ?? t.CreatedAt)
                .Skip((pg.Page - 1) * pg.PageSize)
                .Take(pg.PageSize)
                .Select(t => new CourseThreadDto
                {
                    CourseThreadID = t.CourseThreadID,
                    CourseID = t.CourseID,
                    Title = t.Title,
                    Content = t.Content,
                    AuthorID = t.AuthorID,
                    AuthorName = t.Author!.Name,
                    IsPinned = t.IsPinned,
                    CreatedAt = t.CreatedAt,
                    LastActivityAt = t.LastActivityAt,
                    ReplyCount = t.Replies.Count
                })
                .ToListAsync();

            return Ok(new PaginatedResult<CourseThreadDto>
            {
                Items = threads,
                TotalCount = totalCount,
                Page = pg.Page,
                PageSize = pg.PageSize
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CourseThreadDto>> GetThread(int id)
        {
            var thread = await _context.CourseThreads
                .Include(t => t.Author)
                .Include(t => t.Course)
                .Include(t => t.Replies).ThenInclude(r => r.Author)
                .FirstOrDefaultAsync(t => t.CourseThreadID == id);

            if (thread == null) return NotFound();
            if (!await IsEnrolled(thread.CourseID)) return Forbid();

            return Ok(new CourseThreadDto
            {
                CourseThreadID = thread.CourseThreadID,
                CourseID = thread.CourseID,
                CourseTitle = thread.Course!.Title,
                Title = thread.Title,
                Content = thread.Content,
                AuthorID = thread.AuthorID,
                AuthorName = thread.Author!.Name,
                IsPinned = thread.IsPinned,
                CreatedAt = thread.CreatedAt,
                LastActivityAt = thread.LastActivityAt,
                ReplyCount = thread.Replies.Count,
                Replies = thread.Replies.OrderBy(r => r.CreatedAt).Select(r => new ThreadReplyDto
                {
                    ThreadReplyID = r.ThreadReplyID,
                    CourseThreadID = r.CourseThreadID,
                    Content = r.Content,
                    AuthorID = r.AuthorID,
                    AuthorName = r.Author!.Name,
                    CreatedAt = r.CreatedAt
                }).ToList()
            });
        }

        [HttpPost]
        public async Task<ActionResult<CourseThreadDto>> CreateThread(CreateThreadDto dto)
        {
            if (!_rateLimiter.IsAllowed($"forum:thread:{CurrentUserId}", "forum"))
                return StatusCode(429, new { message = "Too many posts. Try again later." });

            if (!await IsEnrolled(dto.CourseID)) return Forbid();

            var thread = new CourseThread
            {
                CourseID = dto.CourseID,
                Title = dto.Title,
                Content = dto.Content,
                AuthorID = CurrentUserId,
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTime.UtcNow
            };

            _context.CourseThreads.Add(thread);
            await _context.SaveChangesAsync();

            await AwardPoints(CurrentUserId, 5);

            var author = await _context.Users.FindAsync(CurrentUserId);
            return Ok(new CourseThreadDto
            {
                CourseThreadID = thread.CourseThreadID,
                CourseID = thread.CourseID,
                Title = thread.Title,
                Content = thread.Content,
                AuthorID = thread.AuthorID,
                AuthorName = author!.Name,
                IsPinned = thread.IsPinned,
                CreatedAt = thread.CreatedAt,
                LastActivityAt = thread.LastActivityAt
            });
        }

        [HttpPost("{id}/reply")]
        public async Task<ActionResult<ThreadReplyDto>> CreateReply(int id, CreateReplyDto dto)
        {
            if (!_rateLimiter.IsAllowed($"forum:reply:{CurrentUserId}", "forum"))
                return StatusCode(429, new { message = "Too many posts. Try again later." });

            var thread = await _context.CourseThreads.FindAsync(id);
            if (thread == null) return NotFound();
            if (!await IsEnrolled(thread.CourseID)) return Forbid();

            var reply = new ThreadReply
            {
                CourseThreadID = id,
                Content = dto.Content,
                AuthorID = CurrentUserId,
                CreatedAt = DateTime.UtcNow
            };

            thread.LastActivityAt = DateTime.UtcNow;

            _context.ThreadReplies.Add(reply);
            await _context.SaveChangesAsync();

            await AwardPoints(CurrentUserId, 2);

            var author = await _context.Users.FindAsync(CurrentUserId);
            return Ok(new ThreadReplyDto
            {
                ThreadReplyID = reply.ThreadReplyID,
                CourseThreadID = reply.CourseThreadID,
                Content = reply.Content,
                AuthorID = reply.AuthorID,
                AuthorName = author!.Name,
                CreatedAt = reply.CreatedAt
            });
        }

        private async Task AwardPoints(int userId, int points)
        {
            var up = await _context.UserPoints.FirstOrDefaultAsync(u => u.UserID == userId);
            if (up == null)
            {
                up = new UserPoints
                {
                    UserID = userId,
                    Points = points,
                    StreakDays = 1,
                    LastActivityAt = DateTime.UtcNow
                };
                _context.UserPoints.Add(up);
            }
            else
            {
                up.Points += points;

                // Track streaks — if last activity was yesterday, continue
                if (up.LastActivityAt.HasValue)
                {
                    var diff = (DateTime.UtcNow - up.LastActivityAt.Value.Date).Days;
                    if (diff == 1) up.StreakDays++;
                    else if (diff > 1) up.StreakDays = 1;
                }
                else up.StreakDays = 1;

                up.LastActivityAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Check for new badges
            var earnedBadgeIds = await _context.UserBadges
                .Where(ub => ub.UserID == userId)
                .Select(ub => ub.BadgeID)
                .ToListAsync();

            var newBadges = await _context.Badges
                .Where(b => b.RequiredPoints <= up.Points && !earnedBadgeIds.Contains(b.BadgeID))
                .ToListAsync();

            foreach (var badge in newBadges)
            {
                _context.UserBadges.Add(new UserBadge
                {
                    UserID = userId,
                    BadgeID = badge.BadgeID,
                    EarnedAt = DateTime.UtcNow
                });

                _context.Notifications.Add(new Notification
                {
                    UserID = userId,
                    Title = $"Badge unlocked: {badge.Name}!",
                    Body = badge.Description,
                    Link = "/profile",
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (newBadges.Count > 0)
                await _context.SaveChangesAsync();
        }
    }
}
