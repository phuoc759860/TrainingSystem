using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddExamAnswers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "NeedsGrading",
                table: "ExamResult",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "ExamAnswers",
                columns: table => new
                {
                    ExamAnswerID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ResultID = table.Column<int>(type: "int", nullable: false),
                    QuestionID = table.Column<int>(type: "int", nullable: false),
                    Answer = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsCorrect = table.Column<bool>(type: "tinyint(1)", nullable: true),
                    PointsEarned = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    NeedsGrading = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamAnswers", x => x.ExamAnswerID);
                    table.ForeignKey(
                        name: "FK_ExamAnswers_ExamResult_ResultID",
                        column: x => x.ResultID,
                        principalTable: "ExamResult",
                        principalColumn: "ResultID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExamAnswers_QuestionBanks_QuestionID",
                        column: x => x.QuestionID,
                        principalTable: "QuestionBanks",
                        principalColumn: "QuestionID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_ExamAnswers_QuestionID",
                table: "ExamAnswers",
                column: "QuestionID");

            migrationBuilder.CreateIndex(
                name: "IX_ExamAnswers_ResultID",
                table: "ExamAnswers",
                column: "ResultID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExamAnswers");

            migrationBuilder.DropColumn(
                name: "NeedsGrading",
                table: "ExamResult");
        }
    }
}
