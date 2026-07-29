using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddTrainerToCourse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.AddForeignKey(
                name: "FK_Courses_Users_TrainerID",
                table: "Courses",
                column: "TrainerID",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Courses_Users_TrainerID",
                table: "Courses");

            migrationBuilder.AddColumn<int>(
                name: "CourseID1",
                table: "Enrollments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserID1",
                table: "Enrollments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_CourseID1",
                table: "Enrollments",
                column: "CourseID1");

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_UserID1",
                table: "Enrollments",
                column: "UserID1");

            migrationBuilder.AddForeignKey(
                name: "FK_Courses_Users_TrainerID",
                table: "Courses",
                column: "TrainerID",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Enrollments_Courses_CourseID1",
                table: "Enrollments",
                column: "CourseID1",
                principalTable: "Courses",
                principalColumn: "CourseID");

            migrationBuilder.AddForeignKey(
                name: "FK_Enrollments_Users_UserID1",
                table: "Enrollments",
                column: "UserID1",
                principalTable: "Users",
                principalColumn: "UserID");
        }
    }
}
