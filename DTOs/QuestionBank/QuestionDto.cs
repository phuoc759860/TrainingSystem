public class QuestionDto
{
    public int QuestionID { get; set; }

    public int ExamID { get; set; }

    public string ExamTitle { get; set; } = "";

    public string Content { get; set; } = "";

    public string QuestionType { get; set; } = "";

    public string OptionA { get; set; } = "";

    public string OptionB { get; set; } = "";

    public string OptionC { get; set; } = "";

    public string OptionD { get; set; } = "";

    public string CorrectAnswer { get; set; } = "";

    public decimal Score { get; set; }
}