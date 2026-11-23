using MediatR;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Users;

namespace Pelihuone.Application.Features.Users.Queries;

/// <summary>
/// Kysely yksittäisen käyttäjän tietojen hakemiseen tunnisteen perusteella.
/// </summary>
/// <param name="UserId">Haettavan käyttäjän tunniste.</param>
public sealed record GetUserByIdQuery(Guid UserId)
    : IRequest<Result<UserResponse>>;

/// <summary>
/// Käsittelijä <see cref="GetUserByIdQuery"/>-kyselylle.
/// </summary>
public sealed class GetUserByIdQueryHandler
    : IRequestHandler<GetUserByIdQuery, Result<UserResponse>>
{
    private readonly IUserService _userService;

    /// <summary>
    /// Alustaa uuden <see cref="GetUserByIdQueryHandler"/>-instanssin.
    /// </summary>
    /// <param name="userService">Käyttäjäpalvelu käyttäjän hakemiseen.</param>
    public GetUserByIdQueryHandler(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Hakee käyttäjän tiedot hänen tunnisteensa perusteella.
    /// </summary>
    /// <param name="request">Käyttäjäkysely.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Löydetty käyttäjä tai virhetulos.</returns>
    public Task<Result<UserResponse>> Handle(
        GetUserByIdQuery request,
        CancellationToken cancellationToken)
    {
        return _userService.GetUserByIdAsync(request.UserId, cancellationToken);
    }
}
