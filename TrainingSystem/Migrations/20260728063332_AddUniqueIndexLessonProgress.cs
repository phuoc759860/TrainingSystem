using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexLessonProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Delete duplicate records, keeping only the one with the highest LessonProgressID per (UserID, LessonID)
            migrationBuilder.Sql(@"
                DELETE lp1 FROM LessonProgress lp1
                INNER JOIN LessonProgress lp2
                ON lp1.UserID = lp2.UserID AND lp1.LessonID = lp2.LessonID
                AND lp1.LessonProgressID < lp2.LessonProgressID
            ");

            migrationBuilder.CreateIndex(
                name: "IX_LessonProgress_UserID_LessonID",
                table: "LessonProgress",
                columns: new[] { "UserID", "LessonID" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_LessonProgress_UserID_LessonID",
                table: "LessonProgress");
        }
    }
}
