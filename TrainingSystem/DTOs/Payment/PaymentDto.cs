namespace TrainingSystem.DTOs.Payment
{
    public class PaymentDto
    {
        public int PaymentID { get; set; }
        public string OrderNumber { get; set; } = "";
        public string InvoiceNumber { get; set; } = "";
        public int UserID { get; set; }
        public string UserName { get; set; } = "";
        public int CourseID { get; set; }
        public string CourseTitle { get; set; } = "";
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public string Status { get; set; } = "Pending";
        public string PaymentMethod { get; set; } = "Card";
        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime? RefundedAt { get; set; }
    }

    public class CreatePaymentDto
    {
        public int CourseID { get; set; }
        public string? PaymentMethod { get; set; }
    }
}
