using Microsoft.AspNetCore.Mvc;
using TrainingSystem.Data;
using TrainingSystem.Models;

[Route("api/[controller]")]
[ApiController]
public class MaterialController : ControllerBase
{
    private readonly AppDbContext _context;

    public MaterialController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Material>> GetMaterial(int id)
    {
        var material = await _context.Materials.FindAsync(id);

        if (material == null)
        {
            return NotFound();
        }

        return material;
    }

    // Other actions...
}
