using TrainingSystem.Data;
using TrainingSystem.Models;
using TrainingSystem.DTOs.Common;
using TrainingSystem.DTOs.User;
using TrainingSystem.Middlewares;
using TrainingSystem.Services;

using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;


namespace TrainingSystem.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UserController : BaseApiController
    {
        private readonly IConfiguration _configuration;
        private readonly LoginRateLimiter _rateLimiter;
        private readonly RateLimiterService _rateLimiterService;
        private readonly IEmailService _emailService;
        private readonly IWebHostEnvironment _env;

        public UserController(
            AppDbContext context,
            IConfiguration configuration,
            LoginRateLimiter rateLimiter,
            RateLimiterService rateLimiterService,
            IEmailService emailService,
            IWebHostEnvironment env)
            : base(context)
        {
            _configuration = configuration;
            _rateLimiter = rateLimiter;
            _rateLimiterService = rateLimiterService;
            _emailService = emailService;
            _env = env;
        }

        private static string GenerateSecurityToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        }

        private static string HashToken(string token)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(bytes);
        }

        [AllowAnonymous]
        [HttpPost]
        public async Task<ActionResult<UserDto>> Register(CreateUserDto dto)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            if (!_rateLimiterService.IsAllowed($"register:{ip}", "register"))
                return StatusCode(429, new { message = "Too many registration attempts. Try again later." });

            if (!IsPasswordComplexEnough(dto.Password, out var pwError))
                return BadRequest(new { message = pwError });

            bool isAdminCaller = User?.Identity?.IsAuthenticated == true && User.IsInRole("Admin");

            if (!isAdminCaller)
            {
                var studentRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Student");
                if (studentRole == null) return StatusCode(500, "Student role not configured.");
                dto.RoleID = studentRole.RoleID;
            }

            bool roleExists = await _context.Roles.AnyAsync(r => r.RoleID == dto.RoleID);
            if (!roleExists)
                return NotFound(new { message = "Role does not exist." });

            bool emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (emailExists)
                return NotFound(new { message = "Email already exists." });

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                RoleID = dto.RoleID,
                IsEmailVerified = isAdminCaller
            };

            string? verificationToken = null;
            if (!isAdminCaller)
            {
                verificationToken = GenerateSecurityToken();
                user.EmailVerificationTokenHash = HashToken(verificationToken);
                user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddDays(7);
            }

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

            if (verificationToken != null)
            {
                var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
                var verifyLink = $"{frontendUrl}/verify-email?token={Uri.EscapeDataString(verificationToken)}";
                await _emailService.SendAsync(
                    user.Email,
                    "Verify your TrainingHub account",
                    $"<p>Hi {user.Name},</p><p>Please verify your email by clicking the link below:</p>" +
                    $"<p><a href=\"{verifyLink}\">Verify email</a></p><p>This link expires in 7 days.</p>");

                if (_env.IsDevelopment() && !_emailService.IsConfigured)
                    return CreatedAtAction(nameof(GetUser), new { id = user.UserID },
                        new { user = result, devVerificationLink = verifyLink });

                return CreatedAtAction(nameof(GetUser), new { id = user.UserID }, result);
            }

            return CreatedAtAction(nameof(GetUser), new { id = user.UserID }, result);
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            if (_rateLimiter.IsLockedOut(dto.Email))
                return StatusCode(429, new { message = "Too many failed login attempts. Please try again later." });

            var user = _context.Users
                .Include(u => u.Role)
                .FirstOrDefault(u => u.Email == dto.Email);

            if (user == null)
            {
                _rateLimiter.RecordFailure(dto.Email);
                return Unauthorized("Invalid email.");
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                _rateLimiter.RecordFailure(dto.Email);
                return Unauthorized("Invalid password.");
            }

            if (_configuration.GetValue("Auth:RequireEmailVerification", false) && !user.IsEmailVerified)
                return StatusCode(403, new { message = "Please verify your email address before signing in." });

            _rateLimiter.Reset(dto.Email);

            var (accessToken, jti) = GenerateAccessToken(user);
            var refreshToken = await GenerateRefreshToken(user.UserID, jti);

            return Ok(new
            {
                token = accessToken,
                refreshToken = refreshToken.Token,
                userID = user.UserID,
                name = user.Name,
                email = user.Email,
                roleID = user.RoleID,
                role = user.Role!.RoleName
            });
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh(RefreshTokenDto dto)
        {
            var stored = await _context.RefreshTokens
                .Include(rt => rt.User)
                .ThenInclude(u => u!.Role)
                .FirstOrDefaultAsync(rt => rt.Token == dto.RefreshToken);

            if (stored == null || !stored.IsActive || stored.User == null)
                return Unauthorized(new { message = "Invalid or expired refresh token." });

            stored.RevokedAt = DateTime.UtcNow;

            var (newAccessToken, newJti) = GenerateAccessToken(stored.User);
            var newRefreshToken = await GenerateRefreshToken(stored.UserID, newJti);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                token = newAccessToken,
                refreshToken = newRefreshToken.Token,
                userID = stored.User.UserID,
                name = stored.User.Name,
                email = stored.User.Email,
                roleID = stored.User.RoleID,
                role = stored.User.Role!.RoleName
            });
        }

        [HttpPost("revoke-token")]
        public async Task<IActionResult> RevokeToken(RefreshTokenDto dto)
        {
            var stored = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == dto.RefreshToken && rt.UserID == CurrentUserId);

            if (stored == null)
                return NotFound(new { message = "Refresh token not found." });

            stored.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Token revoked." });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
        {
            var user = await _context.Users.FindAsync(CurrentUserId);
            if (user == null) return NotFound();

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                return BadRequest(new { message = "Current password is incorrect." });

            if (!IsPasswordComplexEnough(dto.NewPassword, out var pwError))
                return BadRequest(new { message = pwError });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            var currentJti = User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
            if (currentJti != null)
            {
                var now = DateTime.UtcNow;
                var activeTokens = await _context.RefreshTokens
                    .Where(rt => rt.UserID == CurrentUserId && rt.RevokedAt == null && rt.ExpiresAt > now && rt.Jti != currentJti)
                    .ToListAsync();
                foreach (var t in activeTokens)
                    t.RevokedAt = now;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Password changed. Other sessions have been logged out." });
        }

        // FORGOT PASSWORD
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            if (!_rateLimiterService.IsAllowed($"forgotpw:{dto.Email}:{ip}", "resetpw"))
                return StatusCode(429, new { message = "Too many password reset requests. Try again later." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
                return Ok(new { message = "If an account exists for that email, a password reset link has been sent." });

            // Invalidate any outstanding reset tokens for this user (single-use tokens)
            var outstanding = await _context.PasswordResetTokens
                .Where(t => t.UserID == user.UserID && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();
            foreach (var t in outstanding)
                t.UsedAt = DateTime.UtcNow;

            var token = GenerateSecurityToken();
            _context.PasswordResetTokens.Add(new PasswordResetToken
            {
                UserID = user.UserID,
                TokenHash = HashToken(token),
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            });
            await _context.SaveChangesAsync();

            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";
            var resetLink = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}";
            await _emailService.SendAsync(
                user.Email,
                "Reset your TrainingHub password",
                $"<p>Hi {user.Name},</p><p>Click the link below to reset your password:</p>" +
                $"<p><a href=\"{resetLink}\">Reset password</a></p><p>This link expires in 1 hour.</p>");

            if (_env.IsDevelopment() && !_emailService.IsConfigured)
                return Ok(new
                {
                    message = "If an account exists for that email, a password reset link has been sent.",
                    devResetLink = resetLink
                });

            return Ok(new { message = "If an account exists for that email, a password reset link has been sent." });
        }

        // RESET PASSWORD
        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            if (!_rateLimiterService.IsAllowed($"resetpw:{ip}", "resetpw"))
                return StatusCode(429, new { message = "Too many attempts. Try again later." });

            if (!IsPasswordComplexEnough(dto.NewPassword, out var pwError))
                return BadRequest(new { message = pwError });

            var tokenHash = HashToken(dto.Token);
            var reset = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

            if (reset == null || reset.UsedAt != null || reset.ExpiresAt < DateTime.UtcNow || reset.User == null)
                return BadRequest(new { message = "Invalid or expired reset token." });

            reset.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            reset.UsedAt = DateTime.UtcNow;

            // Log out all existing sessions
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserID == reset.UserID && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();
            foreach (var t in activeTokens)
                t.RevokedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Password reset successfully. You can now sign in." });
        }

        // VERIFY EMAIL
        [HttpPost("verify-email")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyEmail(VerifyEmailDto dto)
        {
            var tokenHash = HashToken(dto.Token);
            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.EmailVerificationTokenHash == tokenHash &&
                    u.EmailVerificationTokenExpiresAt != null &&
                    u.EmailVerificationTokenExpiresAt > DateTime.UtcNow);

            if (user == null)
                return BadRequest(new { message = "Invalid or expired verification token." });

            user.IsEmailVerified = true;
            user.EmailVerificationTokenHash = null;
            user.EmailVerificationTokenExpiresAt = null;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Email verified successfully. You can now sign in." });
        }

        private static bool IsPasswordComplexEnough(string password, out string error)
        {
            error = "";
            if (password.Length < 8)
            {
                error = "Password must be at least 8 characters.";
                return false;
            }
            if (!password.Any(char.IsUpper))
            {
                error = "Password must contain at least one uppercase letter.";
                return false;
            }
            if (!password.Any(char.IsLower))
            {
                error = "Password must contain at least one lowercase letter.";
                return false;
            }
            if (!password.Any(char.IsDigit))
            {
                error = "Password must contain at least one digit.";
                return false;
            }
            if (password.All(char.IsLetterOrDigit))
            {
                error = "Password must contain at least one special character.";
                return false;
            }
            return true;
        }

        private (string token, string jti) GenerateAccessToken(User user)
        {
            var jti = Guid.NewGuid().ToString();
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, jti),
                new Claim("UserID", user.UserID.ToString()),
                new Claim("RoleID", user.RoleID.ToString()),
                new Claim(ClaimTypes.Role, user.Role!.RoleName),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15),
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );

            return (new JwtSecurityTokenHandler().WriteToken(token), jti);
        }

        private async Task<RefreshToken> GenerateRefreshToken(int userId, string jti)
        {
            var tokenBytes = RandomNumberGenerator.GetBytes(64);
            var tokenStr = Convert.ToBase64String(tokenBytes);

            var refreshToken = new RefreshToken
            {
                Token = tokenStr,
                Jti = jti,
                UserID = userId,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            return refreshToken;
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var jti = User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
            if (jti == null)
                return BadRequest(new { message = "No token to revoke." });

            var expires = User.FindFirst("exp")?.Value;
            var expiresDt = expires != null
                ? DateTimeOffset.FromUnixTimeSeconds(long.Parse(expires)).UtcDateTime
                : DateTime.UtcNow.AddHours(2);

            var alreadyRevoked = await _context.RevokedTokens
                .AnyAsync(r => r.Jti == jti);

            if (!alreadyRevoked)
            {
                _context.RevokedTokens.Add(new RevokedToken
                {
                    Jti = jti,
                    ExpiresAt = expiresDt
                });
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Logged out successfully." });
        }

        [HttpGet("recipients")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetRecipients()
        {
            var users = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.UserID != CurrentUserId)
                .OrderBy(u => u.Name)
                .Select(u => new UserDto
                {
                    UserID = u.UserID,
                    Name = u.Name,
                    Email = u.Email,
                    RoleID = u.RoleID,
                    RoleName = u.Role!.RoleName
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PaginatedResult<UserDto>>> GetUsers(
            [FromQuery] string? search,
            [FromQuery] int? roleID,
            [FromQuery] PaginationQuery pg)
        {
            var query = _context.Users
                .Include(u => u.Role)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(u =>
                    u.Name.ToLower().Contains(q) ||
                    u.Email.ToLower().Contains(q));
            }

            if (roleID.HasValue && roleID > 0)
                query = query.Where(u => u.RoleID == roleID.Value);

            var totalCount = await query.CountAsync();

            var users = await query
                .OrderBy(u => u.Name)
                .Skip((pg.Page - 1) * pg.PageSize)
                .Take(pg.PageSize)
                .Select(u => new UserDto
                {
                    UserID = u.UserID,
                    Name = u.Name,
                    Email = u.Email,
                    RoleID = u.RoleID,
                    RoleName = u.Role!.RoleName
                })
                .ToListAsync();

            return Ok(new PaginatedResult<UserDto>
            {
                Items = users,
                TotalCount = totalCount,
                Page = pg.Page,
                PageSize = pg.PageSize
            });
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
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
                    RoleID = u.RoleID,
                    RoleName = u.Role!.RoleName
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound(new { message = "User not found." });

            return Ok(user);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UserDto>> UpdateUser(int id, UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound("User not found.");

            var role = await _context.Roles.FindAsync(dto.RoleID);

            if (role == null)
                return BadRequest("Role does not exist.");

            user.Name = dto.Name;
            user.Email = dto.Email;
            user.RoleID = dto.RoleID;

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                if (!IsPasswordComplexEnough(dto.Password, out var pwError))
                    return BadRequest(new { message = pwError });

                user.PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(dto.Password);
            }

            await _context.SaveChangesAsync();

            return Ok(new UserDto
            {
                UserID = user.UserID,
                Name = user.Name,
                Email = user.Email,
                RoleID = user.RoleID,
                RoleName = role.RoleName
            });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserID == id);

            if (user == null)
                return NotFound();

            if (user.UserID == CurrentUserId)
                return BadRequest(new { message = "You cannot delete your own account." });

            if (user.Role?.RoleName == "Admin")
                return BadRequest(new { message = "Cannot delete another admin. Remove their admin role first." });

            var adminCount = await _context.Users.CountAsync(u => u.Role!.RoleName == "Admin");
            if (adminCount <= 1 && user.Role?.RoleName == "Admin")
                return BadRequest(new { message = "Cannot delete the last remaining admin." });

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var userId = user.UserID;

                var enrollments = await _context.Enrollments
                    .Where(e => e.UserID == userId).ToListAsync();
                _context.Enrollments.RemoveRange(enrollments);

                var examResults = await _context.ExamResult
                    .Where(r => r.UserID == userId).ToListAsync();
                _context.ExamResult.RemoveRange(examResults);

                var lessonProgress = await _context.LessonProgress
                    .Where(lp => lp.UserID == userId).ToListAsync();
                _context.LessonProgress.RemoveRange(lessonProgress);

                var quizAttempts = await _context.QuizAttempts
                    .Where(qa => qa.UserID == userId).ToListAsync();
                _context.QuizAttempts.RemoveRange(quizAttempts);

                var notifications = await _context.Notifications
                    .Where(n => n.UserID == userId).ToListAsync();
                _context.Notifications.RemoveRange(notifications);

                var messages = await _context.Messages
                    .Where(m => m.SenderID == userId || m.ReceiverID == userId).ToListAsync();
                _context.Messages.RemoveRange(messages);

                var threads = await _context.CourseThreads
                    .Where(t => t.AuthorID == userId).ToListAsync();
                _context.CourseThreads.RemoveRange(threads);

                var reviews = await _context.CourseReviews
                    .Where(r => r.UserID == userId).ToListAsync();
                _context.CourseReviews.RemoveRange(reviews);

                var badges = await _context.UserBadges
                    .Where(ub => ub.UserID == userId).ToListAsync();
                _context.UserBadges.RemoveRange(badges);

                var points = await _context.UserPoints
                    .Where(up => up.UserID == userId).ToListAsync();
                _context.UserPoints.RemoveRange(points);

                var refreshTokens = await _context.RefreshTokens
                    .Where(rt => rt.UserID == userId).ToListAsync();
                _context.RefreshTokens.RemoveRange(refreshTokens);

                if (user.Role?.RoleName == "Trainer")
                {
                    var courses = await _context.Courses
                        .Where(c => c.TrainerID == userId).ToListAsync();
                    _context.Courses.RemoveRange(courses);
                }

                await _context.SaveChangesAsync();

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                await tx.CommitAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return BadRequest(new { message = $"Failed to delete user: {ex.Message}" });
            }
        }
    }
}
