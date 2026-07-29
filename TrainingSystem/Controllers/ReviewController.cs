using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.Models;
using TrainingSystem.DTOs.Review;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReviewController : BaseApiController
    {
        public ReviewController(AppDbContext context) : base(context) { }

        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<CourseReviewDto>>> GetReviews(int courseId)
        {
            if (!await IsEnrolled(courseId)) return Forbid();

            var reviews = await _context.CourseReviews
                .Include(r => r.User)
                .Where(r => r.CourseID == courseId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new CourseReviewDto
                {
                    CourseReviewID = r.CourseReviewID,
                    CourseID = r.CourseID,
                    UserID = r.UserID,
                    UserName = r.User!.Name,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(reviews);
        }

        [HttpGet("course/{courseId}/summary")]
        public async Task<ActionResult<CourseRatingSummaryDto>> GetSummary(int courseId)
        {
            var reviews = await _context.CourseReviews
                .Where(r => r.CourseID == courseId)
                .ToListAsync();

            var summary = new CourseRatingSummaryDto
            {
                CourseID = courseId,
                TotalReviews = reviews.Count,
                AverageRating = reviews.Count > 0 ? Math.Round(reviews.Average(r => r.Rating), 1) : 0,
                RatingDistribution = new Dictionary<int, int>
                {
                    { 5, reviews.Count(r => r.Rating == 5) },
                    { 4, reviews.Count(r => r.Rating == 4) },
                    { 3, reviews.Count(r => r.Rating == 3) },
                    { 2, reviews.Count(r => r.Rating == 2) },
                    { 1, reviews.Count(r => r.Rating == 1) }
                }
            };

            return Ok(summary);
        }

        [HttpPost]
        public async Task<ActionResult<CourseReviewDto>> CreateReview(CreateReviewDto dto)
        {
            if (dto.Rating < 1 || dto.Rating > 5)
                return BadRequest(new { message = "Rating must be between 1 and 5." });

            if (!await IsEnrolled(dto.CourseID)) return Forbid();

            var existing = await _context.CourseReviews
                .FirstOrDefaultAsync(r => r.CourseID == dto.CourseID && r.UserID == CurrentUserId);

            if (existing != null)
                return Conflict(new { message = "You have already reviewed this course. Use PUT to update." });

            var review = new CourseReview
            {
                CourseID = dto.CourseID,
                UserID = CurrentUserId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CreatedAt = DateTime.UtcNow
            };

            _context.CourseReviews.Add(review);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(CurrentUserId);
            return Ok(new CourseReviewDto
            {
                CourseReviewID = review.CourseReviewID,
                CourseID = review.CourseID,
                UserID = review.UserID,
                UserName = user!.Name,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReview(int id, CreateReviewDto dto)
        {
            var review = await _context.CourseReviews.FindAsync(id);
            if (review == null) return NotFound();
            if (review.UserID != CurrentUserId) return Forbid();

            review.Rating = dto.Rating;
            review.Comment = dto.Comment;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var review = await _context.CourseReviews.FindAsync(id);
            if (review == null) return NotFound();
            if (review.UserID != CurrentUserId && !IsAdmin()) return Forbid();

            _context.CourseReviews.Remove(review);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
