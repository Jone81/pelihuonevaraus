namespace Pelihuone.Contracts.Users;

public sealed record UserResponse(
    Guid Id,
    string Email,
    string DisplayName,
    string Role);

public sealed record UpdateUserRoleRequest(string Role);

public sealed record SendVerificationCodeRequest(string Email);

public sealed record VerifyCodeRequest(
    string Email,
    string Code,
    string? DisplayName = null);
