using MediatR;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Users;

namespace Pelihuone.Application.Features.Users.Commands;

/// <summary>
/// Komento käyttäjän käyttöeston (bannin) asettamiseen tai poistamiseen.
/// </summary>
/// <param name="UserId">Käyttäjän tunniste.</param>
/// <param name="Request">Käyttöeston tiedot.</param>
public sealed record UpdateUserBanCommand(Guid UserId, BanUserRequest Request)
    : IRequest<Result<UserResponse>>;

/// <summary>
/// Käsittelijä <see cref="UpdateUserBanCommand"/>-komennolle.
/// </summary>
public sealed class UpdateUserBanCommandHandler
    : IRequestHandler<UpdateUserBanCommand, Result<UserResponse>>
{
    private readonly IUserService _userService;

    /// <summary>
    /// Alustaa uuden <see cref="UpdateUserBanCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="userService">Käyttäjäpalvelu käyttöeston päivittämiseen.</param>
    public UpdateUserBanCommandHandler(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Päivittää käyttäjän käyttöeston tilan.
    /// </summary>
    /// <param name="request">Käyttöeston päivityskomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Päivitetyn käyttäjän tiedot tai virhetulos.</returns>
    public Task<Result<UserResponse>> Handle(
        UpdateUserBanCommand request,
        CancellationToken cancellationToken)
    {
        return _userService.UpdateUserBanAsync(request.UserId, request.Request, cancellationToken);
    }
}
