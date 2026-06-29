using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.DTOs.Material;
using TrainingSystem.Models;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MaterialController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MaterialController(AppDbContext context)
        {
            _context = context;
        }

        // GET ALL
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaterialDto>>> GetMaterials()
        {
            var materials = await _context.Materials
                .Include(m => m.Lesson)
                .Select(m => new MaterialDto
                {
                    MaterialID = m.MaterialID,
                    Title = m.Title,
                    FilePath = m.FilePath,
                    LessonID = m.LessonID,
                    LessonTitle = m.Lesson!.Title
                })
                .ToListAsync();

            return Ok(materials);
        }

        // GET BY ID
        [HttpGet("{id}")]
        public async Task<ActionResult<MaterialDto>> GetMaterial(int id)
        {
            var material = await _context.Materials
                .Include(m => m.Lesson)
                .Where(m => m.MaterialID == id)
                .Select(m => new MaterialDto
                {
                    MaterialID = m.MaterialID,
                    Title = m.Title,
                    FilePath = m.FilePath,
                    LessonID = m.LessonID,
                    LessonTitle = m.Lesson!.Title
                })
                .FirstOrDefaultAsync();

            if (material == null)
                return NotFound();

            return Ok(material);
        }

        // CREATE
        [HttpPost]
        public async Task<ActionResult<MaterialDto>> CreateMaterial(CreateMaterialDto dto)
        {
            var lesson = await _context.Lessons.FindAsync(dto.LessonID);

            if (lesson == null)
                return NotFound(new
                {
                    message = "Lesson does not exist."
                });
            var material = new Material
            {
                Title = dto.Title,
                FilePath = dto.FilePath,
                LessonID = dto.LessonID
            };

            _context.Materials.Add(material);

            await _context.SaveChangesAsync();

            var result = new MaterialDto
            {
                MaterialID = material.MaterialID,
                Title = material.Title,
                FilePath = material.FilePath,
                LessonID = lesson.LessonID,
                LessonTitle = lesson.Title
            };

            return CreatedAtAction(nameof(GetMaterial),
                new { id = material.MaterialID },
                result);
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMaterial(int id, UpdateMaterialDto dto)
        {
            var material = await _context.Materials.FindAsync(id);

            if (material == null)
                return NotFound();

            var lessonExists = await _context.Lessons
                .AnyAsync(l => l.LessonID == dto.LessonID);

            if (!lessonExists)
                return NotFound(new
                {
                    message = "Lesson does not exist."
                });

            material.Title = dto.Title;
            material.FilePath = dto.FilePath;
            material.LessonID = dto.LessonID;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaterial(int id)
        {
            var material = await _context.Materials.FindAsync(id);

            if (material == null)
                return NotFound();

            _context.Materials.Remove(material);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}