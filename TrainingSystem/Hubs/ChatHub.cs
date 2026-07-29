using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using TrainingSystem.Data;
using TrainingSystem.Models;
using System.Security.Claims;

namespace TrainingSystem.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AppDbContext _db;

        public ChatHub(AppDbContext db)
        {
            _db = db;
        }

        private int CurrentUserId => int.Parse(Context.User!.FindFirst("UserID")!.Value);
        private string CurrentUserName => Context.User!.FindFirst(ClaimTypes.Name)!.Value;

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public async Task JoinCourse(int courseId)
        {
            var isAdmin = Context.User!.IsInRole("Admin");
            if (!isAdmin)
            {
                var enrolled = await _db.Enrollments
                    .AnyAsync(e => e.CourseID == courseId && e.UserID == CurrentUserId);
                var owns = await _db.Courses.AnyAsync(c => c.CourseID == courseId && c.TrainerID == CurrentUserId);
                if (!enrolled && !owns)
                {
                    await Clients.Caller.SendAsync("Error", "You are not enrolled in this course.");
                    return;
                }
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, $"course-{courseId}");

            var recent = await _db.CourseChatMessages
                .Where(m => m.CourseID == courseId)
                .OrderByDescending(m => m.SentAt)
                .Take(50)
                .OrderBy(m => m.SentAt)
                .Select(m => new
                {
                    m.CourseChatMessageID,
                    m.CourseID,
                    m.SenderID,
                    SenderName = m.Sender!.Name,
                    m.Message,
                    m.SentAt
                })
                .ToListAsync();

            await Clients.Caller.SendAsync("ChatHistory", recent);
        }

        public async Task LeaveCourse(int courseId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"course-{courseId}");
        }

        public async Task<object> SendMessage(int courseId, string message)
        {
            if (string.IsNullOrWhiteSpace(message) || message.Length > 2000)
                return null!;

            var isAdmin = Context.User!.IsInRole("Admin");
            if (!isAdmin)
            {
                var enrolled = await _db.Enrollments
                    .AnyAsync(e => e.CourseID == courseId && e.UserID == CurrentUserId);
                var owns = await _db.Courses.AnyAsync(c => c.CourseID == courseId && c.TrainerID == CurrentUserId);
                if (!enrolled && !owns) return null!;
            }

            var msg = new CourseChatMessage
            {
                CourseID = courseId,
                SenderID = CurrentUserId,
                Message = message,
                SentAt = DateTime.UtcNow
            };

            _db.CourseChatMessages.Add(msg);
            await _db.SaveChangesAsync();

            var dto = new
            {
                msg.CourseChatMessageID,
                msg.CourseID,
                msg.SenderID,
                SenderName = CurrentUserName,
                msg.Message,
                msg.SentAt
            };

            await Clients.OthersInGroup($"course-{courseId}").SendAsync("NewMessage", dto);

            return dto;
        }
    }
}
