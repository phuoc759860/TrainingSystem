namespace TrainingSystem.Models
{
    public class Payment
    {
        public int PaymentID { get; set; }

        public string OrderNumber { get; set; } = "";

        public string InvoiceNumber { get; set; } = "";

        public int UserID { get; set; }
        public User? User { get; set; }

        public int CourseID { get; set; }
        public Course? Course { get; set; }

        public decimal Amount { get; set; }

        public string Currency { get; set; } = "USD";

        /// <summary>Pending / Paid / Refunded / Failed</summary>
        public string Status { get; set; } = "Pending";

        public string PaymentMethod { get; set; } = "Card";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? PaidAt { get; set; }

        public DateTime? RefundedAt { get; set; }
    }
}
