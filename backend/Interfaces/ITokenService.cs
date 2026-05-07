using AICall.API.Models;

namespace AICall.API.Interfaces
{
    public interface ITokenService
    {
        // 生成一个 JWT Token，输入参数是AppUser
        string CreateToken(AppUser appUser);
    }
}
