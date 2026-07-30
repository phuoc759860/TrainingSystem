using Microsoft.AspNetCore.Mvc;
using TrainingSystem.Data;
using TrainingSystem.Models;

[Route("api/[controller]")]
[ApiController]
public class QuestionBankController : ControllerBase
{
    private readonly AppDbContext _context;

    public QuestionBankController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<QuestionBank>> GetQuestionBank(int id)
    {
        var questionBank = await _context.QuestionBanks.FindAsync(id);

        if (questionBank == null)
        {
            return NotFound();
        }

        return questionBank;
    }

    // Other actions...
}
