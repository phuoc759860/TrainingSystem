using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingSystem.Migrations
{
    /// <inheritdoc />
    public partial class AuditFixes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Users",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "AttemptToken",
                table: "ExamResult",
                type: "varchar(255)",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ServedQuestionIds",
                table: "ExamResult",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_ExamResult_AttemptToken",
                table: "ExamResult",
                column: "AttemptToken",
                unique: true,
                filter: "[AttemptToken] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ExamResult_AttemptToken",
                table: "ExamResult");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AttemptToken",
                table: "ExamResult");

            migrationBuilder.DropColumn(
                name: "ServedQuestionIds",
                table: "ExamResult");
        }
    }
}
