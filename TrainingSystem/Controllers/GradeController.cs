using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Grade;

namespace TrainingSystem.Controllers
{
    [Authorize(Roles = "Admin,Trainer,Student")]
    [ApiController]
    [Route("api/[controller]")]
    public class GradeController : BaseApiController
    {
        private const decimal QuizWeight = 0.30m;
        private const decimal ExamWeight = 0.70m;

        public GradeController(AppDbContext context) : base(context) { }

        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<CourseGradeDto>>> GetMyGrades()
        {
            var userId = CurrentUserId;
            return await ComputeGrades(userId);
        }

        [HttpGet("course/{courseId}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<IEnumerable<StudentGradeDetailDto>>> GetCourseGrades(int courseId)
        {
            if (IsTrainer())
            {
                var owns = await _context.Courses.AnyAsync(c => c.CourseID == courseId && c.TrainerID == CurrentUserId);
                if (!owns) return Forbid();
            }

            var enrolledUserIds = await _context.Enrollments
                .Where(e => e.CourseID == courseId)
                .Select(e => e.UserID)
                .ToListAsync();

            var courseTitle = await _context.Courses
                .Where(c => c.CourseID == courseId)
                .Select(c => c.Title)
                .FirstOrDefaultAsync() ?? "";

            var results = new List<StudentGradeDetailDto>();

            // Batch-fetch course-level data once (eliminates N+1 per student)
            var allQuizzes = await _context.Quizzes
                .Include(q => q.Lesson)
                .Include(q => q.Questions)
                .Where(q => q.Lesson != null && q.Lesson.CourseID == courseId && q.IsActive)
                .ToListAsync();
            var allExams = await _context.Exams
                .Where(e => e.CourseID == courseId)
                .ToListAsync();

            // Batch-fetch all quiz attempts and exam results for enrolled students
            var allQuizAttempts = await _context.QuizAttempts
                .Where(a => enrolledUserIds.Contains(a.UserID) && a.CompletedAt != null)
                .ToListAsync();
            var allExamResults = await _context.ExamResult
                .Include(r => r.Exam)
                .Where(r => enrolledUserIds.Contains(r.UserID) && r.Exam != null && r.Exam.CourseID == courseId)
                .ToListAsync();

            foreach (var userId in enrolledUserIds)
            {
                var user = await _context.Users.FindAsync(userId);
                var courseGrade = ComputeGradesForCourse(userId, courseId, allQuizzes, allExams, allQuizAttempts, allExamResults);

                results.Add(new StudentGradeDetailDto
                {
                    UserID = userId,
                    UserName = user?.Name ?? "",
                    Grades = courseGrade != null ? new List<CourseGradeDto> { courseGrade } : new List<CourseGradeDto>(),
                    OverallAverage = courseGrade?.FinalGrade
                });
            }

            return Ok(results.OrderByDescending(r => r.OverallAverage ?? 0).ToList());
        }

        [HttpGet("student/{userId}")]
        [Authorize(Roles = "Admin,Trainer")]
        public async Task<ActionResult<IEnumerable<CourseGradeDto>>> GetStudentGrades(int userId)
        {
            if (IsTrainer())
            {
                var enrolled = await _context.Enrollments
                    .Include(e => e.Course)
                    .AnyAsync(e => e.UserID == userId && e.Course!.TrainerID == CurrentUserId);
                if (!enrolled) return Forbid();
            }

            return await ComputeGrades(userId);
        }

        private async Task<List<CourseGradeDto>> ComputeGrades(int userId)
        {
            var enrolledCourseIds = await _context.Enrollments
                .Where(e => e.UserID == userId)
                .Select(e => e.CourseID)
                .ToListAsync();

            if (enrolledCourseIds.Count == 0)
                return new List<CourseGradeDto>();

            var courseLookup = await _context.Courses
                .Where(c => enrolledCourseIds.Contains(c.CourseID))
                .ToDictionaryAsync(c => c.CourseID, c => c.Title);

            var quizzesByCourse = await _context.Quizzes
                .Include(q => q.Lesson)
                .Include(q => q.Questions)
                .Where(q => q.Lesson != null && enrolledCourseIds.Contains(q.Lesson.CourseID) && q.IsActive)
                .ToListAsync();

            var quizAttempts = await _context.QuizAttempts
                .Where(a => a.UserID == userId && a.CompletedAt != null)
                .ToListAsync();

            var examsByCourse = await _context.Exams
                .Where(e => enrolledCourseIds.Contains(e.CourseID))
                .ToListAsync();

            var examResults = await _context.ExamResult
                .Include(r => r.Exam)
                .Where(r => r.UserID == userId && r.Exam != null && enrolledCourseIds.Contains(r.Exam.CourseID))
                .ToListAsync();

            var result = new List<CourseGradeDto>();

            foreach (var courseId in enrolledCourseIds)
            {
                var courseQuizzes = quizzesByCourse.Where(q => q.Lesson!.CourseID == courseId).ToList();
                var courseExams = examsByCourse.Where(e => e.CourseID == courseId).ToList();

                decimal? quizScore = null;
                int quizAttempted = 0;

                if (courseQuizzes.Count > 0)
                {
                    var bestPerQuiz = new List<decimal>();
                    foreach (var quiz in courseQuizzes)
                    {
                        var attempts = quizAttempts
                            .Where(a => a.QuizID == quiz.QuizID && a.TotalPoints > 0)
                            .ToList();

                        if (attempts.Count > 0)
                        {
                            quizAttempted++;
                            var best = attempts.Max(a => (decimal)a.Score * 100 / a.TotalPoints);
                            bestPerQuiz.Add(best);
                        }
                    }

                    if (bestPerQuiz.Count > 0)
                        quizScore = Math.Round(bestPerQuiz.Average(), 2);
                }

                decimal? examScore = null;
                int examAttempted = 0;

                var courseExamResults = examResults
                    .Where(r => r.Exam!.CourseID == courseId)
                    .ToList();

                if (courseExamResults.Count > 0)
                {
                    examAttempted = courseExamResults.Count;
                    examScore = Math.Round(courseExamResults.Average(r => r.Score), 2);
                }

                decimal? finalGrade = null;
                if (quizScore.HasValue && examScore.HasValue)
                    finalGrade = Math.Round(quizScore.Value * QuizWeight + examScore.Value * ExamWeight, 2);
                else if (quizScore.HasValue)
                    finalGrade = Math.Round(quizScore.Value * QuizWeight, 2);
                else if (examScore.HasValue)
                    finalGrade = Math.Round(examScore.Value * ExamWeight, 2);

                result.Add(new CourseGradeDto
                {
                    CourseID = courseId,
                    CourseTitle = courseLookup.GetValueOrDefault(courseId, ""),
                    QuizScore = quizScore,
                    ExamScore = examScore,
                    FinalGrade = finalGrade,
                    QuizCount = courseQuizzes.Count,
                    QuizAttempted = quizAttempted,
                    ExamCount = courseExams.Count,
                    ExamAttempted = examAttempted
                });
            }

            return result.OrderByDescending(g => g.FinalGrade ?? 0).ToList();
        }

        private CourseGradeDto? ComputeGradesForCourse(
            int userId, int courseId,
            List<Models.Quiz> allQuizzes,
            List<Models.Exam> allExams,
            List<Models.QuizAttempt> allQuizAttempts,
            List<Models.ExamResult> allExamResults)
        {
            var courseQuizzes = allQuizzes.Where(q => q.Lesson!.CourseID == courseId).ToList();
            var courseExams = allExams.Where(e => e.CourseID == courseId).ToList();
            var userQuizAttempts = allQuizAttempts.Where(a => a.UserID == userId).ToList();
            var courseExamResults = allExamResults.Where(r => r.UserID == userId && r.Exam!.CourseID == courseId).ToList();

            decimal? quizScore = null;
            int quizAttempted = 0;

            if (courseQuizzes.Count > 0)
            {
                var bestPerQuiz = new List<decimal>();
                foreach (var quiz in courseQuizzes)
                {
                    var attempts = userQuizAttempts
                        .Where(a => a.QuizID == quiz.QuizID && a.TotalPoints > 0)
                        .ToList();

                    if (attempts.Count > 0)
                    {
                        quizAttempted++;
                        var best = attempts.Max(a => (decimal)a.Score * 100 / a.TotalPoints);
                        bestPerQuiz.Add(best);
                    }
                }

                if (bestPerQuiz.Count > 0)
                    quizScore = Math.Round(bestPerQuiz.Average(), 2);
            }

            decimal? examScore = null;
            int examAttempted = 0;

            if (courseExamResults.Count > 0)
            {
                examAttempted = courseExamResults.Count;
                examScore = Math.Round(courseExamResults.Average(r => r.Score), 2);
            }

            decimal? finalGrade = null;
            if (quizScore.HasValue && examScore.HasValue)
                finalGrade = Math.Round(quizScore.Value * QuizWeight + examScore.Value * ExamWeight, 2);
            else if (quizScore.HasValue)
                finalGrade = Math.Round(quizScore.Value * QuizWeight, 2);
            else if (examScore.HasValue)
                finalGrade = Math.Round(examScore.Value * ExamWeight, 2);

            if (courseQuizzes.Count == 0 && courseExams.Count == 0)
                return null;

            return new CourseGradeDto
            {
                CourseID = courseId,
                CourseTitle = "", // caller already has courseTitle
                QuizScore = quizScore,
                ExamScore = examScore,
                FinalGrade = finalGrade,
                QuizCount = courseQuizzes.Count,
                QuizAttempted = quizAttempted,
                ExamCount = courseExams.Count,
                ExamAttempted = examAttempted
            };
        }
    }
}
