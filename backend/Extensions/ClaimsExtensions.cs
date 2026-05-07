using System.Security.Claims;

namespace AICall.API.Extensions
{
    public static class ClaimsExtensions
    {
        public static string GetUserId(this ClaimsPrincipal user)
        {
            var claim = user.Claims.SingleOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
            if (claim == null)
            {
                throw new UnauthorizedAccessException("Token 中未找到用户 ID 标识");
            }
            return claim.Value;
        }
    }
}
