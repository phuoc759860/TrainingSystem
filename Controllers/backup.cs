// using Microsoft.AspNetCore.Mvc;
// using TrainingSystem.Data;
// using TrainingSystem.Models;
// using Microsoft.AspNetCore.Authorization;

// namespace TrainingSystem.Controllers
// {
//     [ApiController]
//     [Route("api/courses")]
//     public class CourseController : ControllerBase
//     {
//         private readonly AppDbContext _context;

//         public CourseController(AppDbContext context)
//         {
//             _context = context;
//         }
//         //[Authorize(Roles = "Admin, Trainer")] #authorize only admin and trainer can create course
//         [HttpPost]
//         public IActionResult CreateCourse(Course course)
//         {
//             _context.Courses.Add(course);
//             _context.SaveChanges();
//             return Ok(new { message = "Course created successfully" });
//         }

//         [HttpGet]
//         public IActionResult GetCourses()
//         {
//             return Ok(_context.Courses.ToList());
//         }
//     }
// }
