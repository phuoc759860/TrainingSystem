using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Dashboard;
using TrainingSystem.DTOs.AdminDashboard;
using TrainingSystem.DTOs.TrainerDashboard;
using TrainingSystem.DTOs.StudentDashboard;

namespace TrainingSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : BaseApiController
    {
        public DashboardController(AppDbContext context)
            : base(context)
        {
        }

        [HttpGet]
        public async Task<ActionResult<DashboardDto>> GetDashboard()
        {
            var userQuery = _context.Users.Include(u => u.Role).AsQueryable();
            var users = await userQuery.ToListAsync();

            var dto = new DashboardDto
            {
                TotalUsers = users.Count,
                AdminCount = users.Count(u => u.Role?.RoleName == "Admin"),
                TrainerCount = users.Count(u => u.Role?.RoleName == "Trainer"),
                StudentCount = users.Count(u => u.Role?.RoleName == "Student"),

                TotalCourses = await _context.Courses.CountAsync(),

                TotalLessons = await _context.Lessons.CountAsync(),

                TotalMaterials = await _context.Materials.CountAsync(),

                TotalExams = await _context.Exams.CountAsync(),

                TotalEnrollments = await _context.Enrollments.CountAsync(),
                ActiveEnrollments = await _context.Enrollments
                    .CountAsync(e => e.Status == "Enrolled" || e.Status == "In Progress"),

                TotalResults = await _context.ExamResult.CountAsync(),
                PassedResults = await _context.ExamResult.CountAsync(r => r.Passed)
            };

            return Ok(dto);
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<AdminDashboardDto>> GetAdminDashboard()
        {
            var users = await _context.Users.Include(u => u.Role).ToListAsync();
            var courses = await _context.Courses.Include(c => c.Enrollments).ToListAsync();

            var dto = new AdminDashboardDto
            {
                TotalUsers = users.Count,
                AdminCount = users.Count(u => u.Role?.RoleName == "Admin"),
                TrainerCount = users.Count(u => u.Role?.RoleName == "Trainer"),
                StudentCount = users.Count(u => u.Role?.RoleName == "Student"),
                TotalCourses = courses.Count,
                TotalLessons = await _context.Lessons.CountAsync(),
                TotalMaterials = await _context.Materials.CountAsync(),
                TotalExams = await _context.Exams.CountAsync(),
                TotalEnrollments = await _context.Enrollments.CountAsync(),
                ActiveEnrollments = await _context.Enrollments
                    .CountAsync(e => e.Status == "Enrolled" || e.Status == "In Progress"),
                TotalResults = await _context.ExamResult.CountAsync(),
                PassedResults = await _context.ExamResult.CountAsync(r => r.Passed),
                TotalQuizzes = await _context.Quizzes.CountAsync(),
                TotalForumThreads = await _context.CourseThreads.CountAsync(),
                TotalMessages = await _context.Messages.CountAsync(),

                RecentRegistrations = users
                    .OrderByDescending(u => u.UserID)
                    .Take(5)
                    .Select(u => new RecentRegistration
                    {
                        UserID = u.UserID,
                        Name = u.Name,
                        Email = u.Email,
                        Role = u.Role!.RoleName,
                        CreatedAt = DateTime.MinValue
                    })
                    .ToList(),

                PopularCourses = courses
                    .OrderByDescending(c => c.Enrollments.Count)
                    .Take(5)
                    .Select(c => new PopularCourse
                    {
                        CourseID = c.CourseID,
                        Title = c.Title,
                        StudentCount = c.Enrollments.Count
                    })
                    .ToList()
            };

            return Ok(dto);
        }

        [HttpGet("trainer")]
        [Authorize(Roles = "Trainer")]
        public async Task<ActionResult<TrainerDashboardDto>> GetTrainerDashboard()
        {
            var myCourses = await _context.Courses
                .Include(c => c.Enrollments)
                .Include(c => c.Lessons)
                .Include(c => c.ScheduleEntries)
                    .ThenInclude(s => s.Lesson)
                .Where(c => c.TrainerID == CurrentUserId)
                .ToListAsync();

            var myCourseIds = myCourses.Select(c => c.CourseID).ToList();

            var exams = await _context.Exams
                .Where(e => myCourseIds.Contains(e.CourseID))
                .ToListAsync();

            var examIds = exams.Select(e => e.ExamID).ToList();

            var pendingGrading = await _context.ExamResult
                .Include(r => r.User)
                .Include(r => r.Exam)
                .ThenInclude(e => e.Course)
                .Where(r => examIds.Contains(r.ExamID) && r.NeedsGrading)
                .OrderByDescending(r => r.SubmittedAt)
                .Take(10)
                .ToListAsync();

            var uniqueStudents = await _context.Enrollments
                .Where(e => myCourseIds.Contains(e.CourseID))
                .Select(e => e.UserID)
                .Distinct()
                .CountAsync();

            var dto = new TrainerDashboardDto
            {
                MyCourses = myCourses.Count,
                MyStudents = uniqueStudents,
                TotalLessons = myCourses.Sum(c => c.Lessons.Count),
                TotalExams = exams.Count,
                TotalQuizzes = await _context.Quizzes
                    .CountAsync(q => myCourseIds.Contains(q.Lesson!.CourseID)),
                PendingGrading = pendingGrading.Count,
                TotalEnrollments = await _context.Enrollments.CountAsync(e => myCourseIds.Contains(e.CourseID)),
                ActiveEnrollments = await _context.Enrollments
                    .CountAsync(e => myCourseIds.Contains(e.CourseID) && (e.Status == "Enrolled" || e.Status == "In Progress")),

                Courses = myCourses.Select(c => new TrainerCourseInfo
                {
                    CourseID = c.CourseID,
                    Title = c.Title,
                    StudentCount = c.Enrollments.Count,
                    LessonCount = c.Lessons.Count,
                    ExamCount = exams.Count(e => e.CourseID == c.CourseID)
                }).ToList(),

                UpcomingSchedule = myCourses
                    .SelectMany(c => c.ScheduleEntries)
                    .OrderBy(s => s.DayOfWeek)
                    .ThenBy(s => s.StartTime)
                    .Take(5)
                    .Select(s => new UpcomingScheduleItem
                    {
                        ScheduleEntryID = s.ScheduleEntryID,
                        CourseTitle = s.Course?.Title ?? "",
                        LessonTitle = s.Lesson?.Title ?? "",
                        DayOfWeek = s.DayOfWeek switch
                        {
                            0 => "Sunday",
                            1 => "Monday",
                            2 => "Tuesday",
                            3 => "Wednesday",
                            4 => "Thursday",
                            5 => "Friday",
                            6 => "Saturday",
                            _ => "Unknown"
                        },
                        StartTime = s.StartTime.ToString(),
                        EndTime = s.EndTime.ToString()
                    }).ToList(),

                PendingGrades = pendingGrading.Select(r => new PendingGradeItem
                {
                    ResultID = r.ResultID,
                    StudentName = r.User?.Name ?? "",
                    ExamTitle = r.Exam?.Title ?? "",
                    CourseTitle = r.Exam?.Course?.Title ?? "",
                    SubmittedAt = r.SubmittedAt
                }).ToList()
            };

            return Ok(dto);
        }

        [HttpGet("student")]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult<StudentDashboardDto>> GetStudentDashboard()
        {
            var enrollments = await _context.Enrollments
                .Include(e => e.Course)
                    .ThenInclude(c => c.Trainer)
                .Include(e => e.Course)
                    .ThenInclude(c => c.Lessons)
                .Where(e => e.UserID == CurrentUserId)
                .ToListAsync();

            var courseIds = enrollments.Select(e => e.CourseID).ToList();

            var lessonProgress = await _context.LessonProgress
                .Include(lp => lp.Lesson)
                .Where(lp => lp.UserID == CurrentUserId && courseIds.Contains(lp.CourseID))
                .ToListAsync();

            var upcomingExams = await _context.Exams
                .Include(e => e.Course)
                .Where(e => courseIds.Contains(e.CourseID))
                .ToListAsync();

            var examIds = upcomingExams.Select(e => e.ExamID).ToList();

            var attemptedExamIds = await _context.ExamResult
                .Where(r => r.UserID == CurrentUserId && examIds.Contains(r.ExamID))
                .Select(r => r.ExamID)
                .Distinct()
                .ToListAsync();

            var recentGrades = await _context.ExamResult
                .Include(r => r.Exam)
                    .ThenInclude(e => e.Course)
                .Where(r => r.UserID == CurrentUserId)
                .OrderByDescending(r => r.SubmittedAt)
                .Take(5)
                .ToListAsync();

            int totalLessons = enrollments.Sum(e => e.Course?.Lessons.Count ?? 0);
            int completedLessons = lessonProgress.Count(lp => lp.IsCompleted);
            double overallProgress = totalLessons > 0
                ? Math.Round((double)completedLessons / totalLessons * 100, 1)
                : 0;

            var dto = new StudentDashboardDto
            {
                EnrolledCourses = enrollments.Count,
                CompletedLessons = completedLessons,
                TotalLessons = totalLessons,
                UpcomingExams = upcomingExams.Count - attemptedExamIds.Count,
                PendingQuizzes = await _context.QuizAttempts
                    .CountAsync(qa => qa.UserID == CurrentUserId && qa.CompletedAt == null),
                OverallProgress = overallProgress,

                Courses = enrollments.Select(e =>
                {
                    var course = e.Course!;
                    var completed = lessonProgress
                        .Where(lp => lp.CourseID == course.CourseID && lp.IsCompleted)
                        .Count();
                    var total = course.Lessons.Count;
                    var lastProgress = lessonProgress
                        .Where(lp => lp.CourseID == course.CourseID)
                        .OrderByDescending(lp => lp.LastAccessedAt)
                        .FirstOrDefault();

                    return new EnrolledCourseInfo
                    {
                        CourseID = course.CourseID,
                        Title = course.Title,
                        TrainerName = course.Trainer?.Name ?? "",
                        CompletedLessons = completed,
                        TotalLessons = total,
                        Progress = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0,
                        LastLessonTitle = lastProgress?.Lesson?.Title,
                        LastLessonID = lastProgress?.LessonID
                    };
                }).ToList(),

                UpcomingExamsList = upcomingExams
                    .Where(e => !attemptedExamIds.Contains(e.ExamID))
                    .Select(e => new UpcomingExamItem
                    {
                        ExamID = e.ExamID,
                        Title = e.Title,
                        CourseTitle = e.Course?.Title ?? "",
                        ScheduledDate = null
                    }).ToList(),

                RecentGrades = recentGrades.Select(r => new RecentGradeItem
                {
                    ResultID = r.ResultID,
                    ExamTitle = r.Exam?.Title ?? "",
                    CourseTitle = r.Exam?.Course?.Title ?? "",
                    Score = r.Score,
                    Passed = r.Passed,
                    SubmittedAt = r.SubmittedAt
                }).ToList()
            };

            return Ok(dto);
        }
    }
}