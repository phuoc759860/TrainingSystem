using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Schedule;
using TrainingSystem.Models;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ScheduleController : BaseApiController
    {
        private static readonly string[] DayNames = 
            { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };

        public ScheduleController(AppDbContext context)
            : base(context) { }

        // GET ALL
        [HttpGet]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<IEnumerable<ScheduleEntryDto>>> GetScheduleEntries(int? courseId)
        {
            var query = _context.ScheduleEntries
                .Include(s => s.Course)
                .Include(s => s.Lesson)
                .AsQueryable();

            if (IsStudent())
            {
                query = query.Where(s => MyCourseIds().Contains(s.CourseID));
            }

            if (IsTrainer())
            {
                query = query.Where(s => s.Course!.TrainerID == CurrentUserId);
            }

            if (courseId.HasValue)
            {
                query = query.Where(s => s.CourseID == courseId);
            }

            var entries = await query
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.Position)
                .Select(s => new ScheduleEntryDto
                {
                    ScheduleEntryID = s.ScheduleEntryID,
                    CourseID = s.CourseID,
                    CourseTitle = s.Course!.Title,
                    LessonID = s.LessonID,
                    LessonTitle = s.Lesson!.Title,
                    DayOfWeek = s.DayOfWeek,
                    StartTime = s.StartTime.ToString("HH:mm"),
                    EndTime = s.EndTime.ToString("HH:mm"),
                    Position = s.Position
                })
                .ToListAsync();

            return Ok(entries);
        }

        // GET WEEKLY VIEW
        [HttpGet("weekly/{courseId}")]
        [Authorize(Roles = "Admin,Trainer,Student")]
        public async Task<ActionResult<WeeklyScheduleDto>> GetWeeklySchedule(int courseId)
        {
            if (!await IsEnrolled(courseId))
                return Forbid();

            var course = await _context.Courses.FindAsync(courseId);
            if (course == null) return NotFound();

            var entries = await _context.ScheduleEntries
                .Include(s => s.Lesson)
                .Where(s => s.CourseID == courseId)
                .OrderBy(s => s.Position)
                .Select(s => new ScheduleEntryDto
                {
                    ScheduleEntryID = s.ScheduleEntryID,
                    CourseID = s.CourseID,
                    CourseTitle = course.Title,
                    LessonID = s.LessonID,
                    LessonTitle = s.Lesson!.Title,
                    DayOfWeek = s.DayOfWeek,
                    StartTime = s.StartTime.ToString("HH:mm"),
                    EndTime = s.EndTime.ToString("HH:mm"),
                    Position = s.Position
                })
                .ToListAsync();

            var days = Enumerable.Range(0, 7).Select(d => new DayScheduleDto
            {
                DayOfWeek = d,
                DayName = DayNames[d],
                Entries = entries.Where(e => e.DayOfWeek == d).ToList()
            }).ToList();

            return Ok(new WeeklyScheduleDto
            {
                CourseID = courseId,
                CourseTitle = course.Title,
                Days = days
            });
        }

        // CREATE
        [HttpPost]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<ScheduleEntryDto>> CreateScheduleEntry(CreateScheduleEntryDto dto)
        {
            if (!await OwnsCourse(dto.CourseID))
                return Forbid();

            var course = await _context.Courses.FindAsync(dto.CourseID);
            if (course == null)
                return NotFound(new { message = "Course does not exist." });

            var lesson = await _context.Lessons.FindAsync(dto.LessonID);
            if (lesson == null)
                return NotFound(new { message = "Lesson does not exist." });

            if (lesson.CourseID != dto.CourseID)
                return BadRequest(new { message = "Lesson does not belong to this course." });

            if (!TimeOnly.TryParse(dto.StartTime, out var startTime))
                return BadRequest(new { message = "Invalid start time format. Use HH:mm." });

            if (!TimeOnly.TryParse(dto.EndTime, out var endTime))
                return BadRequest(new { message = "Invalid end time format. Use HH:mm." });

            if (startTime >= endTime)
                return BadRequest(new { message = "Start time must be before end time." });

            var entry = new ScheduleEntry
            {
                CourseID = dto.CourseID,
                LessonID = dto.LessonID,
                DayOfWeek = dto.DayOfWeek,
                StartTime = startTime,
                EndTime = endTime,
                Position = dto.Position
            };

            _context.ScheduleEntries.Add(entry);
            await _context.SaveChangesAsync();

            var result = new ScheduleEntryDto
            {
                ScheduleEntryID = entry.ScheduleEntryID,
                CourseID = course.CourseID,
                CourseTitle = course.Title,
                LessonID = lesson.LessonID,
                LessonTitle = lesson.Title,
                DayOfWeek = entry.DayOfWeek,
                StartTime = entry.StartTime.ToString("HH:mm"),
                EndTime = entry.EndTime.ToString("HH:mm"),
                Position = entry.Position
            };

            return CreatedAtAction(nameof(GetScheduleEntries),
                new { courseId = entry.CourseID }, result);
        }

        // UPDATE
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> UpdateScheduleEntry(int id, UpdateScheduleEntryDto dto)
        {
            var entry = await _context.ScheduleEntries.FindAsync(id);
            if (entry == null) return NotFound();

            if (!await OwnsCourse(entry.CourseID))
                return Forbid();

            var lesson = await _context.Lessons.FindAsync(dto.LessonID);
            if (lesson == null)
                return NotFound(new { message = "Lesson does not exist." });

            if (lesson.CourseID != entry.CourseID)
                return BadRequest(new { message = "Lesson does not belong to this course." });

            if (!TimeOnly.TryParse(dto.StartTime, out var startTime))
                return BadRequest(new { message = "Invalid start time format. Use HH:mm." });

            if (!TimeOnly.TryParse(dto.EndTime, out var endTime))
                return BadRequest(new { message = "Invalid end time format. Use HH:mm." });

            if (startTime >= endTime)
                return BadRequest(new { message = "Start time must be before end time." });

            entry.LessonID = dto.LessonID;
            entry.DayOfWeek = dto.DayOfWeek;
            entry.StartTime = startTime;
            entry.EndTime = endTime;
            entry.Position = dto.Position;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<IActionResult> DeleteScheduleEntry(int id)
        {
            var entry = await _context.ScheduleEntries.FindAsync(id);
            if (entry == null) return NotFound();

            if (!await OwnsCourse(entry.CourseID))
                return Forbid();

            _context.ScheduleEntries.Remove(entry);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
