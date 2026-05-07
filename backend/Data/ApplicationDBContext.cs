using AICall.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
namespace AICall.API.Data
{
    public class ApplicationDBContext : IdentityDbContext<AppUser>
    {
        public ApplicationDBContext(DbContextOptions dbContextOptions) : base(dbContextOptions)
        {
        }
        public DbSet<CallSession> CallSessions { get; set; }
        public DbSet<CallMessage> CallMessages { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder); // 必须保留这行，否则 Identity 表会报错

            List<IdentityRole> roles = new List<IdentityRole>
            {
                new IdentityRole { Name = "Admin", NormalizedName = "ADMIN" },
                new IdentityRole { Name = "User", NormalizedName = "USER" },
            };
            builder.Entity<IdentityRole>().HasData(roles);

            builder.Entity<CallMessage>()
                .HasOne(cm => cm.CallSession)
                .WithMany(cs => cs.Messages)
                .HasForeignKey(cm => cm.CallSessionId)
                .OnDelete(DeleteBehavior.Cascade); // 显式设置级联删除
        }
    }
}

