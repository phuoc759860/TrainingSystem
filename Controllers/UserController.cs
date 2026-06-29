using Microsoft.AspNetCore.Mvc;
using TrainingSystem.Data;
using TrainingSystem.Models;
using TrainingSystem.DTOs.User;
using Microsoft.EntityFrameworkCore;

namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> Register(CreateUserDto dto)
        {
            // Check if Role exists
            bool roleExists = await _context.Roles
                .AnyAsync(r => r.RoleID == dto.RoleID);

            if (!roleExists)
            {
                return BadRequest("Role does not exist.");
            }

            // Check duplicate email
            bool emailExists = await _context.Users
                .AnyAsync(u => u.Email == dto.Email);

            if (emailExists)
            {
                return BadRequest("Email already exists.");
            }

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = dto.PasswordHash,
                RoleID = dto.RoleID
            };

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            var role = await _context.Roles.FindAsync(dto.RoleID);

            var result = new UserDto
            {
                UserID = user.UserID,
                Name = user.Name,
                Email = user.Email,
                RoleName = role!.RoleName
            };

            return CreatedAtAction(nameof(GetUser), new { id = user.UserID }, result);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var users = await _context.Users
                .Include(u => u.Role)
                .Select(u => new UserDto
                {
                    UserID = u.UserID,
                    Name = u.Name,
                    Email = u.Email,
                    RoleName = u.Role!.RoleName
                })
                .ToListAsync();

            return Ok(users);
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.UserID == id)
                .Select(u => new UserDto
                {
                    UserID = u.UserID,
                    Name = u.Name,
                    Email = u.Email,
                    RoleName = u.Role!.RoleName
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound();

            return Ok(user);
}
    }
}
