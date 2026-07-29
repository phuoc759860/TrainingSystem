using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrainingSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddDripContentVersioningStreaming : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MimeType",
                table: "Materials",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "OrderIndex",
                table: "Lessons",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UnlocksAfterLessonID",
                table: "Lessons",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LessonVersions",
                columns: table => new
                {
                    LessonVersionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    LessonID = table.Column<int>(type: "int", nullable: false),
                    VersionNumber = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EditedByUserID = table.Column<int>(type: "int", nullable: false),
                    SavedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LessonVersions", x => x.LessonVersionID);
                    table.ForeignKey(
                        name: "FK_LessonVersions_Lessons_LessonID",
                        column: x => x.LessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LessonVersions_Users_EditedByUserID",
                        column: x => x.EditedByUserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "MaterialVersions",
                columns: table => new
                {
                    MaterialVersionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MaterialID = table.Column<int>(type: "int", nullable: false),
                    VersionNumber = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FilePath = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VideoUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EditedByUserID = table.Column<int>(type: "int", nullable: false),
                    SavedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaterialVersions", x => x.MaterialVersionID);
                    table.ForeignKey(
                        name: "FK_MaterialVersions_Materials_MaterialID",
                        column: x => x.MaterialID,
                        principalTable: "Materials",
                        principalColumn: "MaterialID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MaterialVersions_Users_EditedByUserID",
                        column: x => x.EditedByUserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_UnlocksAfterLessonID",
                table: "Lessons",
                column: "UnlocksAfterLessonID");

            migrationBuilder.CreateIndex(
                name: "IX_LessonVersions_EditedByUserID",
                table: "LessonVersions",
                column: "EditedByUserID");

            migrationBuilder.CreateIndex(
                name: "IX_LessonVersions_LessonID",
                table: "LessonVersions",
                column: "LessonID");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialVersions_EditedByUserID",
                table: "MaterialVersions",
                column: "EditedByUserID");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialVersions_MaterialID",
                table: "MaterialVersions",
                column: "MaterialID");

            migrationBuilder.AddForeignKey(
                name: "FK_Lessons_Lessons_UnlocksAfterLessonID",
                table: "Lessons",
                column: "UnlocksAfterLessonID",
                principalTable: "Lessons",
                principalColumn: "LessonID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Lessons_Lessons_UnlocksAfterLessonID",
                table: "Lessons");

            migrationBuilder.DropTable(
                name: "LessonVersions");

            migrationBuilder.DropTable(
                name: "MaterialVersions");

            migrationBuilder.DropIndex(
                name: "IX_Lessons_UnlocksAfterLessonID",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "MimeType",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "OrderIndex",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "UnlocksAfterLessonID",
                table: "Lessons");
        }
    }
}
