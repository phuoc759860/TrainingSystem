using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Notification;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : BaseApiController
    {
        public NotificationController(AppDbContext context) : base(context) { }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications()
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserID == CurrentUserId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .Select(n => new NotificationDto
                {
                    NotificationID = n.NotificationID,
                    Title = n.Title,
                    Body = n.Body,
                    Link = n.Link,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpGet("unread-count")]
        public async Task<ActionResult<object>> GetUnreadCount()
        {
            var count = await _context.Notifications
                .CountAsync(n => n.UserID == CurrentUserId && !n.IsRead);

            var msgCount = await _context.Messages
                .CountAsync(m => m.ReceiverID == CurrentUserId && !m.IsRead);

            return Ok(new { notifications = count, messages = msgCount, total = count + msgCount });
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var notif = await _context.Notifications.FindAsync(id);
            if (notif == null) return NotFound();
            if (notif.UserID != CurrentUserId) return Forbid();

            notif.IsRead = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            await _context.Notifications
                .Where(n => n.UserID == CurrentUserId && !n.IsRead)
                .ExecuteUpdateAsync(setters => setters.SetProperty(n => n.IsRead, true));

            return NoContent();
        }
    }
}
