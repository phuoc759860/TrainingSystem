using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Payment;
using TrainingSystem.Models;
using Microsoft.AspNetCore.Authorization;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentController : BaseApiController
    {
        public PaymentController(AppDbContext context) : base(context) { }

        // GET api/payment/my
        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<PaymentDto>>> GetMyPayments()
        {
            var payments = await _context.Payments
                .Include(p => p.Course)
                .Where(p => p.UserID == CurrentUserId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PaymentDto
                {
                    PaymentID = p.PaymentID,
                    OrderNumber = p.OrderNumber,
                    InvoiceNumber = p.InvoiceNumber,
                    UserID = p.UserID,
                    UserName = p.User!.Name,
                    CourseID = p.CourseID,
                    CourseTitle = p.Course!.Title,
                    Amount = p.Amount,
                    Currency = p.Currency,
                    Status = p.Status,
                    PaymentMethod = p.PaymentMethod,
                    CreatedAt = p.CreatedAt,
                    PaidAt = p.PaidAt,
                    RefundedAt = p.RefundedAt
                })
                .ToListAsync();

            return Ok(payments);
        }

        // GET api/payment  (admin only)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<PaymentDto>>> GetAllPayments()
        {
            var payments = await _context.Payments
                .Include(p => p.User)
                .Include(p => p.Course)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PaymentDto
                {
                    PaymentID = p.PaymentID,
                    OrderNumber = p.OrderNumber,
                    InvoiceNumber = p.InvoiceNumber,
                    UserID = p.UserID,
                    UserName = p.User!.Name,
                    CourseID = p.CourseID,
                    CourseTitle = p.Course!.Title,
                    Amount = p.Amount,
                    Currency = p.Currency,
                    Status = p.Status,
                    PaymentMethod = p.PaymentMethod,
                    CreatedAt = p.CreatedAt,
                    PaidAt = p.PaidAt,
                    RefundedAt = p.RefundedAt
                })
                .ToListAsync();

            return Ok(payments);
        }

        // POST api/payment   -- create an order for a paid course (scaffold only, no real gateway)
        [HttpPost]
        public async Task<ActionResult<PaymentDto>> CreatePayment(CreatePaymentDto dto)
        {
            var course = await _context.Courses.FindAsync(dto.CourseID);
            if (course == null)
                return NotFound(new { message = "Course not found." });

            if (course.Price <= 0)
                return BadRequest(new { message = "This course is free; no payment is required." });

            var alreadyPaid = await _context.Payments.AnyAsync(p =>
                p.CourseID == dto.CourseID && p.UserID == CurrentUserId && p.Status == "Paid");

            if (alreadyPaid)
                return Conflict(new { message = "You have already paid for this course." });

            var now = DateTime.UtcNow;
            var payment = new Payment
            {
                OrderNumber = GenerateOrderNumber(now),
                InvoiceNumber = GenerateInvoiceNumber(now),
                UserID = CurrentUserId,
                CourseID = dto.CourseID,
                Amount = course.Price,
                Currency = course.Currency,
                Status = "Pending",
                PaymentMethod = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "Card" : dto.PaymentMethod,
                CreatedAt = now
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(CurrentUserId);

            return Ok(new PaymentDto
            {
                PaymentID = payment.PaymentID,
                OrderNumber = payment.OrderNumber,
                InvoiceNumber = payment.InvoiceNumber,
                UserID = payment.UserID,
                UserName = user?.Name ?? "",
                CourseID = payment.CourseID,
                CourseTitle = course.Title,
                Amount = payment.Amount,
                Currency = payment.Currency,
                Status = payment.Status,
                PaymentMethod = payment.PaymentMethod,
                CreatedAt = payment.CreatedAt
            });
        }

        // POST api/payment/{id}/mark-paid  (admin)
        [HttpPost("{id}/mark-paid")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> MarkPaid(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
                return NotFound();

            payment.Status = "Paid";
            payment.PaidAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment marked as paid." });
        }

        // POST api/payment/{id}/refund  (admin)
        [HttpPost("{id}/refund")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Refund(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
                return NotFound();

            payment.Status = "Refunded";
            payment.RefundedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment refunded." });
        }

        private static string GenerateOrderNumber(DateTime now) =>
            $"ORD-{now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

        private static string GenerateInvoiceNumber(DateTime now) =>
            $"INV-{now:yyyyMM}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
    }
}
