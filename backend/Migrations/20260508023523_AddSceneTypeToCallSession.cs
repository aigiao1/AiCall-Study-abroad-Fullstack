using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AICall.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSceneTypeToCallSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "3ccdd8e9-4ffe-4eeb-bbad-3177590b7f2c");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "4f3ad140-3bab-4dd2-936d-4d74b2f7d495");

            migrationBuilder.AddColumn<int>(
                name: "SceneType",
                table: "CallSessions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "218faa35-cac1-4125-900a-da26ed2858ec", null, "Admin", "ADMIN" },
                    { "3c93cd18-05cb-44b7-93a0-1431e93282f4", null, "User", "USER" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "218faa35-cac1-4125-900a-da26ed2858ec");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "3c93cd18-05cb-44b7-93a0-1431e93282f4");

            migrationBuilder.DropColumn(
                name: "SceneType",
                table: "CallSessions");

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "3ccdd8e9-4ffe-4eeb-bbad-3177590b7f2c", null, "User", "USER" },
                    { "4f3ad140-3bab-4dd2-936d-4d74b2f7d495", null, "Admin", "ADMIN" }
                });
        }
    }
}
