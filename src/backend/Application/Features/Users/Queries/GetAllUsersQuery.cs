using MediatR;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Users;

namespace Pelihuone.Application.Features.Users.Queries;

/// <summary>
/// Kysely kaikkien järjestelmään rekisteröityneiden käyttäjien hakemiseen.
/// </summary>
public sealed record GetAllUsersQuery()
    : IRequest<Result<IReadOnlyList<UserResponse>>>;

/// <summary>
/// Käsittelijä <see cref="GetAllUsersQuery"/>-kyselylle.
/// </summary>
public sealed class GetAllUsersQueryHandler
    : IRequestHandler<GetAllUsersQuery, Result<IReadOnlyList<UserResponse>>>
{
    private readonly IUserService _userService;

    /// <summary>
    /// Alustaa uuden <see cref="GetAllUsersQueryHandler"/>-instanssin.
    /// </summary>
    /// <param name="userService">Käyttäjäpalvelu käyttäjälistan hakemiseen.</param>
    public GetAllUsersQueryHandler(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Hakee kaikki rekisteröityneet käyttäjät.
    /// </summary>
    /// <param name="request">Käyttäjälistakysely.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Lista käyttäjistä tai virhetulos.</returns>
    public Task<Result<IReadOnlyList<UserResponse>>> Handle(
        GetAllUsersQuery request,
        CancellationToken cancellationToken)
    {
        return _userService.GetAllUsersAsync(cancellationToken);
    }
}
