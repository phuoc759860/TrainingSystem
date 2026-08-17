using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Statistics;

namespace TrainingSystem.Controllers
{
    [Authorize(Roles = "Admin,Trainer")]
    [ApiController]
    [Route("api/[controller]")]
    public class StatisticsController : BaseApiController
    {
        public StatisticsController(AppDbContext context) : base(context) { }

        // Courses this caller is allowed to see stats for.
        [HttpGet("courses")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailableCourses()
        {
            var query = _context.Courses.AsQueryable();

            if (IsTrainer())
                query = query.Where(c => c.TrainerID == CurrentUserId);

            var courses = await query
                .Select(c => new { c.CourseID, c.Title })
                .ToListAsync();

            return Ok(courses);
        }

        // GET api/Statistics/class?courseId=5
        [HttpGet("class")]
        public async Task<ActionResult<IEnumerable<StudentOverviewDto>>> GetClassOverview(int? courseId)
        {
            var courseQuery = _context.Courses.AsQueryable();

            if (IsTrainer())
                courseQuery = courseQuery.Where(c => c.TrainerID == CurrentUserId);

            if (courseId.HasValue)
                courseQuery = courseQuery.Where(c => c.CourseID == courseId);

            var courseIds = await courseQuery.Select(c => c.CourseID).ToListAsync();

            if (courseIds.Count == 0)
                return Ok(new List<StudentOverviewDto>());

            var enrollments = await _context.Enrollments
                .Include(e => e.User)
                .Where(e => courseIds.Contains(e.CourseID))
                .ToListAsync();

            // Batch-fetch all exam results for all enrolled users (eliminates N+1)
            var allUserIds = enrollments.Select(e => e.UserID).Distinct().ToList();
            var allExamResults = await _context.ExamResult
                .Include(r => r.Exam)
                .Where(r => allUserIds.Contains(r.UserID) && courseIds.Contains(r.Exam!.CourseID))
                .ToListAsync();
            var resultsByUser = allExamResults
                .GroupBy(r => r.UserID)
                .ToDictionary(g => g.Key, g => g.ToList());

            var results = new List<StudentOverviewDto>();

            foreach (var group in enrollments.GroupBy(e => e.UserID))
            {
                var userId = group.Key;

                var examResults = resultsByUser.GetValueOrDefault(userId, new List<Models.ExamResult>());

                if (examResults.Count == 0)
                {
                    results.Add(new StudentOverviewDto
                    {
                        UserID = userId,
                        Name = group.First().User!.Name,
                        ExamsTaken = 0
                    });
                    continue;
                }

                var avgScore = Math.Round(examResults.Average(r => r.Score), 2);
                var passRate = Math.Round(
                    (decimal)examResults.Count(r => r.Passed) / examResults.Count * 100, 2);

                results.Add(new StudentOverviewDto
                {
                    UserID = userId,
                    Name = group.First().User!.Name,
                    ExamsTaken = examResults.Count,
                    AverageScore = avgScore,
                    PassRate = passRate,
                    NeedsAttention = avgScore < 50
                });
            }

            return Ok(results.OrderBy(r => r.AverageScore).ToList());
        }

        // GET api/Statistics/student/5
        [HttpGet("student/{userId}")]
        public async Task<ActionResult<StudentDetailDto>> GetStudentDetail(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            if (IsTrainer())
            {
                var ownsAny = await _context.Enrollments
                    .Include(e => e.Course)
                    .AnyAsync(e => e.UserID == userId && e.Course!.TrainerID == CurrentUserId);

                if (!ownsAny) return Forbid();
            }

            var results = await _context.ExamResult
                .Include(r => r.Exam).ThenInclude(e => e!.Course)
                .Include(r => r.Answers).ThenInclude(a => a.Question)
                .Where(r => r.UserID == userId)
                .ToListAsync();

            if (IsTrainer())
            {
                results = results
                    .Where(r => r.Exam!.Course!.TrainerID == CurrentUserId)
                    .ToList();
            }

            var dto = new StudentDetailDto
            {
                UserID = user.UserID,
                Name = user.Name,
                ExamsTaken = results.Count
            };

            if (results.Count == 0)
                return Ok(dto);

            dto.AverageScore = Math.Round(results.Average(r => r.Score), 2);
            dto.PassRate = Math.Round((decimal)results.Count(r => r.Passed) / results.Count * 100, 2);

            dto.CourseBreakdown = results
                .GroupBy(r => new { r.Exam!.CourseID, r.Exam.Course!.Title })
                .Select(g => new CourseScoreDto
                {
                    CourseID = g.Key.CourseID,
                    CourseTitle = g.Key.Title,
                    AverageScore = Math.Round(g.Average(r => r.Score), 2),
                    ExamsTaken = g.Count()
                })
                .OrderByDescending(c => c.AverageScore)
                .ToList();

            if (dto.CourseBreakdown.Count > 0)
            {
                dto.StrongestCourse = dto.CourseBreakdown.First().CourseTitle;
                dto.WeakestCourse = dto.CourseBreakdown.Last().CourseTitle;
            }

            var allAnswers = results.SelectMany(r => r.Answers).ToList();

            var mcAnswers = allAnswers.Where(a => a.Question!.QuestionType == "MultipleChoice").ToList();
            var essayAnswers = allAnswers.Where(a => a.Question!.QuestionType == "Essay" && !a.NeedsGrading).ToList();

            dto.MultipleChoiceAccuracy = mcAnswers.Count > 0
                ? Math.Round((decimal)mcAnswers.Count(a => a.IsCorrect == true) / mcAnswers.Count * 100, 2)
                : null;

            dto.EssayAverageScore = essayAnswers.Count > 0
                ? Math.Round(essayAnswers.Average(a =>
                      a.Question!.Score > 0 ? (a.PointsEarned / a.Question.Score) * 100 : 0), 2)
                : null;

            dto.WeakestExams = results.OrderBy(r => r.Score).Take(3)
                .Select(r => new ExamScoreDto { ExamID = r.ExamID, ExamTitle = r.Exam!.Title, Score = r.Score })
                .ToList();

            dto.StrongestExams = results.OrderByDescending(r => r.Score).Take(3)
                .Select(r => new ExamScoreDto { ExamID = r.ExamID, ExamTitle = r.Exam!.Title, Score = r.Score })
                .ToList();

            return Ok(dto);
        }

        // GET api/Statistics/questions?examId=5&courseId=2
        [HttpGet("questions")]
        public async Task<ActionResult<IEnumerable<QuestionInsightDto>>> GetQuestionInsights(int? examId, int? courseId)
        {
            var examQuery = _context.Exams.AsQueryable();

            if (IsTrainer())
                examQuery = examQuery.Where(e => e.Course!.TrainerID == CurrentUserId);

            if (examId.HasValue)
                examQuery = examQuery.Where(e => e.ExamID == examId);

            if (courseId.HasValue)
                examQuery = examQuery.Where(e => e.CourseID == courseId);

            var examIds = await examQuery.Select(e => e.ExamID).ToListAsync();

            var questions = await _context.QuestionBanks
                .Include(q => q.Exam)
                .Where(q => examIds.Contains(q.ExamID))
                .ToListAsync();

            // Batch-fetch all answers for all questions (eliminates N+1)
            var questionIds = questions.Select(q => q.QuestionID).ToList();
            var allAnswers = await _context.ExamAnswers
                .Where(a => questionIds.Contains(a.QuestionID) && !a.NeedsGrading)
                .ToListAsync();
            var answersByQuestion = allAnswers
                .GroupBy(a => a.QuestionID)
                .ToDictionary(g => g.Key, g => g.ToList());

            var results = new List<QuestionInsightDto>();

            foreach (var q in questions)
            {
                var answers = answersByQuestion.GetValueOrDefault(q.QuestionID, new List<Models.ExamAnswer>());

                if (answers.Count == 0) continue;

                decimal accuracy = q.QuestionType == "MultipleChoice"
                    ? Math.Round((decimal)answers.Count(a => a.IsCorrect == true) / answers.Count * 100, 2)
                    : (q.Score > 0
                        ? Math.Round(answers.Average(a => (a.PointsEarned / q.Score) * 100), 2)
                        : 0);

                results.Add(new QuestionInsightDto
                {
                    QuestionID = q.QuestionID,
                    ExamID = q.ExamID,
                    ExamTitle = q.Exam!.Title,
                    Content = q.Content,
                    QuestionType = q.QuestionType,
                    AttemptCount = answers.Count,
                    AccuracyRate = accuracy
                });
            }

            return Ok(results.OrderBy(r => r.AccuracyRate).ToList());
        }

        // GET api/Statistics/trainers
        [Authorize(Roles = "Admin")]
        [HttpGet("trainers")]
        public async Task<ActionResult<IEnumerable<TrainerOverviewDto>>> GetTrainers()
        {
            var trainerRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleName == "Trainer");

            if (trainerRole == null)
                return Ok(new List<TrainerOverviewDto>());

            var trainers = await _context.Users
                .Where(u => u.RoleID == trainerRole.RoleID)
                .ToListAsync();

            // Batch-fetch all data for all trainers (eliminates N+1)
            var trainerIds = trainers.Select(t => t.UserID).ToList();
            var allCourses = await _context.Courses
                .Where(c => trainerIds.Contains(c.TrainerID))
                .ToListAsync();
            var courseIdsByTrainer = allCourses
                .GroupBy(c => c.TrainerID)
                .ToDictionary(g => g.Key, g => g.Select(c => c.CourseID).ToList());
            var allCourseIds = allCourses.Select(c => c.CourseID).ToList();
            var allEnrollments = await _context.Enrollments
                .Where(e => allCourseIds.Contains(e.CourseID))
                .ToListAsync();
            var allResults = await _context.ExamResult
                .Include(r => r.Exam)
                .Where(r => r.Exam != null && allCourseIds.Contains(r.Exam.CourseID))
                .ToListAsync();
            var enrollmentsByCourse = allEnrollments
                .GroupBy(e => e.CourseID)
                .ToDictionary(g => g.Key, g => g.ToList());
            var resultsByCourse = allResults
                .Where(r => r.Exam != null)
                .GroupBy(r => r.Exam!.CourseID)
                .ToDictionary(g => g.Key, g => g.ToList());

            var results = new List<TrainerOverviewDto>();

            foreach (var trainer in trainers)
            {
                var tCourseIds = courseIdsByTrainer.GetValueOrDefault(trainer.UserID, new List<int>());

                var tEnrollments = tCourseIds
                    .SelectMany(cid => enrollmentsByCourse.GetValueOrDefault(cid, new List<Models.Enrollment>()))
                    .ToList();

                var tResults = tCourseIds
                    .SelectMany(cid => resultsByCourse.GetValueOrDefault(cid, new List<Models.ExamResult>()))
                    .ToList();

                var avgScore = tResults.Count > 0
                    ? Math.Round(tResults.Average(r => r.Score), 2)
                    : 0m;

                var passRate = tResults.Count > 0
                    ? Math.Round((decimal)tResults.Count(r => r.Passed) / tResults.Count * 100, 2)
                    : 0m;

                results.Add(new TrainerOverviewDto
                {
                    UserID = trainer.UserID,
                    Name = trainer.Name,
                    Email = trainer.Email,
                    CoursesCount = tCourseIds.Count,
                    TotalStudents = tEnrollments.Select(e => e.UserID).Distinct().Count(),
                    TotalExams = tResults.Count,
                    AverageScore = avgScore,
                    PassRate = passRate
                });
            }

            return Ok(results.OrderByDescending(t => t.AverageScore).ToList());
        }

        // GET api/Statistics/trainer/5
        [Authorize(Roles = "Admin")]
        [HttpGet("trainer/{userId}")]
        public async Task<ActionResult<TrainerDetailDto>> GetTrainerDetail(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            var courseIds = await _context.Courses
                .Where(c => c.TrainerID == userId)
                .Select(c => c.CourseID)
                .ToListAsync();

            var enrollments = await _context.Enrollments
                .Where(e => courseIds.Contains(e.CourseID))
                .ToListAsync();

            var allResults = await _context.ExamResult
                .Include(r => r.Exam)
                .Where(r => r.Exam != null && courseIds.Contains(r.Exam.CourseID))
                .ToListAsync();

            var dto = new TrainerDetailDto
            {
                UserID = user.UserID,
                Name = user.Name,
                Email = user.Email,
                CoursesCount = courseIds.Count,
                TotalStudents = enrollments.Select(e => e.UserID).Distinct().Count(),
                TotalExams = allResults.Count,
                AverageScore = allResults.Count > 0
                    ? Math.Round(allResults.Average(r => r.Score), 2)
                    : 0m,
                PassRate = allResults.Count > 0
                    ? Math.Round((decimal)allResults.Count(r => r.Passed) / allResults.Count * 100, 2)
                    : 0m
            };

            dto.Courses = (await _context.Courses
                .Where(c => c.TrainerID == userId)
                .Include(c => c.Enrollments)
                .ToListAsync())
                .Select(c =>
                {
                    var examResults = allResults.Where(r => r.Exam != null && r.Exam.CourseID == c.CourseID).ToList();
                    var taken = examResults.Count;
                    return new TrainerCourseDto
                    {
                        CourseID = c.CourseID,
                        CourseTitle = c.Title,
                        EnrolledStudents = c.Enrollments?.Count ?? 0,
                        ExamsTaken = taken,
                        AverageScore = taken > 0
                            ? Math.Round(examResults.Average(r => r.Score), 2)
                            : 0m,
                        PassRate = taken > 0
                            ? Math.Round((decimal)examResults.Count(r => r.Passed) / taken * 100, 2)
                            : 0m
                    };
                })
                .ToList();

            return Ok(dto);
        }

        //Ranking Courses
        [HttpGet("exam-ranking")]
        public async Task<ActionResult<IEnumerable<ExamRankingDto>>> GetExamRanking(int? courseId)
        {
            var examQuery = _context.Exams.Include(e => e.Course).AsQueryable();

            if (IsTrainer())
                examQuery = examQuery.Where(e => e.Course!.TrainerID == CurrentUserId);

            if (courseId.HasValue)
                examQuery = examQuery.Where(e => e.CourseID == courseId);

            var exams = await examQuery.ToListAsync();

            // Batch-fetch all results for all exams (eliminates N+1)
            var examIds = exams.Select(e => e.ExamID).ToList();
            var allResults = await _context.ExamResult
                .Where(r => examIds.Contains(r.ExamID))
                .ToListAsync();
            var resultsByExam = allResults
                .GroupBy(r => r.ExamID)
                .ToDictionary(g => g.Key, g => g.ToList());

            var rankings = new List<ExamRankingDto>();

            foreach (var exam in exams)
            {
                var results = resultsByExam.GetValueOrDefault(exam.ExamID, new List<Models.ExamResult>());

                if (results.Count == 0) continue;

                rankings.Add(new ExamRankingDto
                {
                    ExamID = exam.ExamID,
                    ExamTitle = exam.Title,
                    CourseTitle = exam.Course!.Title,
                    AttemptCount = results.Count,
                    AverageScore = Math.Round(results.Average(r => r.Score), 2),
                    PassRate = Math.Round((decimal)results.Count(r => r.Passed) / results.Count * 100, 2)
                });
            }

            return Ok(rankings.OrderByDescending(r => r.AverageScore).ToList());
        }
    }
}