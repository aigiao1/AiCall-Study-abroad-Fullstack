using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AICall.API.Migrations
{
    /// <inheritdoc />
    public partial class MakeFieldsNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CallSessions_AspNetUsers_AppUserId",
                table: "CallSessions");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "9823ef99-e4ce-440c-b04e-d9df42c8ed77");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "e9d053c5-7d58-4f81-8377-17c1cde083aa");

            migrationBuilder.AlterColumn<DateTime>(
                name: "StartTime",
                table: "CallSessions",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<string>(
                name: "AppUserId",
                table: "CallSessions",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "06466b5a-f6f7-4726-8fcb-8acfc6ee32b4", null, "Admin", "ADMIN" },
                    { "d5dd7593-6592-44ba-a5e7-5fc21123f19f", null, "User", "USER" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_CallSessions_AspNetUsers_AppUserId",
                table: "CallSessions",
                column: "AppUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CallSessions_AspNetUsers_AppUserId",
                table: "CallSessions");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "06466b5a-f6f7-4726-8fcb-8acfc6ee32b4");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "d5dd7593-6592-44ba-a5e7-5fc21123f19f");

            migrationBuilder.AlterColumn<DateTime>(
                name: "StartTime",
                table: "CallSessions",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "AppUserId",
                table: "CallSessions",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "9823ef99-e4ce-440c-b04e-d9df42c8ed77", null, "Admin", "ADMIN" },
                    { "e9d053c5-7d58-4f81-8377-17c1cde083aa", null, "User", "USER" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_CallSessions_AspNetUsers_AppUserId",
                table: "CallSessions",
                column: "AppUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
