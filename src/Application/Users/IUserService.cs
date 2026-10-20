using Pelihuone.Application.Common;
using Pelihuone.Contracts.Users;
using Pelihuone.Domain.Enums;

namespace Pelihuone.Application.Users;

public interface IUserService
{
    Task<Result<UserResponse>> AuthenticateOrCreateUserAsync(
        string email,
        string displayName,
        CancellationToken cancellationToken = default);

    Task<Result<UserResponse>> GetUserByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<Result<IReadOnlyList<UserResponse>>> GetAllUsersAsync(
        CancellationToken cancellationToken = default);

    Task<Result<UserResponse>> UpdateUserRoleAsync(
        Guid userId,
        UserRole newRole,
        CancellationToken cancellationToken = default);

    Task<Result<string>> SendVerificationCodeAsync(
        string email,
        CancellationToken cancellationToken = default);

    Task<Result<UserResponse>> VerifyCodeAndLoginAsync(
        string email,
        string code,
        string? displayName,
        CancellationToken cancellationToken = default);
}
