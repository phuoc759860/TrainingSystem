using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.Models;
using TrainingSystem.DTOs.Message;
using TrainingSystem.Middlewares;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessageController : BaseApiController
    {
        private readonly RateLimiterService _rateLimiter;

        public MessageController(AppDbContext context, RateLimiterService rateLimiter) : base(context)
        {
            _rateLimiter = rateLimiter;
        }

        [HttpGet("inbox")]
        public async Task<ActionResult<IEnumerable<MessageDto>>> GetInbox()
        {
            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Where(m => m.ReceiverID == CurrentUserId)
                .OrderByDescending(m => m.SentAt)
                .Select(m => new MessageDto
                {
                    MessageID = m.MessageID,
                    SenderID = m.SenderID,
                    SenderName = m.Sender!.Name,
                    ReceiverID = m.ReceiverID,
                    Subject = m.Subject,
                    Body = m.Body,
                    IsRead = m.IsRead,
                    SentAt = m.SentAt
                })
                .ToListAsync();

            return Ok(messages);
        }

        [HttpGet("sent")]
        public async Task<ActionResult<IEnumerable<MessageDto>>> GetSent()
        {
            var messages = await _context.Messages
                .Include(m => m.Receiver)
                .Where(m => m.SenderID == CurrentUserId)
                .OrderByDescending(m => m.SentAt)
                .Select(m => new MessageDto
                {
                    MessageID = m.MessageID,
                    SenderID = m.SenderID,
                    ReceiverID = m.ReceiverID,
                    ReceiverName = m.Receiver!.Name,
                    Subject = m.Subject,
                    Body = m.Body,
                    IsRead = m.IsRead,
                    SentAt = m.SentAt
                })
                .ToListAsync();

            return Ok(messages);
        }

        [HttpGet("unread-count")]
        public async Task<ActionResult<object>> GetUnreadCount()
        {
            var count = await _context.Messages
                .CountAsync(m => m.ReceiverID == CurrentUserId && !m.IsRead);

            return Ok(new { count });
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var msg = await _context.Messages.FindAsync(id);
            if (msg == null) return NotFound();
            if (msg.ReceiverID != CurrentUserId) return Forbid();

            msg.IsRead = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost]
        public async Task<ActionResult<MessageDto>> SendMessage(SendMessageDto dto)
        {
            if (!_rateLimiter.IsAllowed($"msg:{CurrentUserId}", "message"))
                return StatusCode(429, new { message = "Too many messages sent. Try again later." });

            if (dto.ReceiverID == CurrentUserId)
                return BadRequest(new { message = "Cannot send a message to yourself." });

            var receiver = await _context.Users.FindAsync(dto.ReceiverID);
            if (receiver == null)
                return NotFound(new { message = "Receiver not found." });

            var msg = new Message
            {
                SenderID = CurrentUserId,
                ReceiverID = dto.ReceiverID,
                Subject = dto.Subject,
                Body = dto.Body,
                SentAt = DateTime.UtcNow
            };

            _context.Messages.Add(msg);

            // Create notification for receiver
            var sender = await _context.Users.FindAsync(CurrentUserId);
            _context.Notifications.Add(new Notification
            {
                UserID = dto.ReceiverID,
                Title = $"New message from {sender!.Name}",
                Body = dto.Subject,
                Link = "/inbox",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new MessageDto
            {
                MessageID = msg.MessageID,
                SenderID = msg.SenderID,
                SenderName = sender!.Name,
                ReceiverID = msg.ReceiverID,
                ReceiverName = receiver.Name,
                Subject = msg.Subject,
                Body = msg.Body,
                IsRead = msg.IsRead,
                SentAt = msg.SentAt
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            var msg = await _context.Messages.FindAsync(id);
            if (msg == null) return NotFound();
            if (msg.SenderID != CurrentUserId && msg.ReceiverID != CurrentUserId) return Forbid();

            _context.Messages.Remove(msg);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
