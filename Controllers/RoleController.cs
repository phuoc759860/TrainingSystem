using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrainingSystem.Data;
using TrainingSystem.Models;
using TrainingSystem.DTOs.Role;

namespace TrainingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoleController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RoleController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Role
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoleDto>>> GetRoles()
        {
            var roles = await _context.Roles
                .Select(r => new RoleDto
                {
                    RoleID = r.RoleID,
                    RoleName = r.RoleName
                })
                .ToListAsync();

            return Ok(roles);
        }

        // GET: api/Role/1
        [HttpGet("{id}")]
        public async Task<ActionResult<RoleDto>> GetRole(int id)
        {
            var role = await _context.Roles
                .Where(r => r.RoleID == id)
                .Select(r => new RoleDto
                {
                    RoleID = r.RoleID,
                    RoleName = r.RoleName
                })
                .FirstOrDefaultAsync();

            if (role == null)
                return NotFound();

            return Ok(role);
        }

        // POST: api/Role
        [HttpPost]
        public async Task<ActionResult<RoleDto>> Create(CreateRoleDto dto)
        {
            var role = new Models.Role
            {
                RoleName = dto.RoleName
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            return Ok(new RoleDto
            {
                RoleID = role.RoleID,
                RoleName = role.RoleName
            });
        }

        // DELETE: api/Role/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _context.Roles.FindAsync(id);

            if (role == null)
                return NotFound();

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            return NoContent();
        }


        //UPDATE: api/Role/1
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateRoleDto dto)
        {
            var role = await _context.Roles.FindAsync(id);

            if (role == null)
                return NotFound();

            role.RoleName = dto.RoleName;

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}