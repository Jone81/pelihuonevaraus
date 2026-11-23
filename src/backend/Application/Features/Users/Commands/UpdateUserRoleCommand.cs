using MediatR;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Users;
using Pelihuone.Domain.Enums;

namespace Pelihuone.Application.Features.Users.Commands;

/// <summary>
/// Komento käyttäjän käyttöoikeusroolin päivittämiseen.
/// </summary>
/// <param name="UserId">Päivitettävän käyttäjän tunniste.</param>
/// <param name="NewRole">Käyttäjälle asetettava uusi rooli.</param>
public sealed record UpdateUserRoleCommand(Guid UserId, UserRole NewRole)
    : IRequest<Result<UserResponse>>;

/// <summary>
/// Käsittelijä <see cref="UpdateUserRoleCommand"/>-komennolle.
/// </summary>
public sealed class UpdateUserRoleCommandHandler
    : IRequestHandler<UpdateUserRoleCommand, Result<UserResponse>>
{
    private readonly IUserService _userService;

    /// <summary>
    /// Alustaa uuden <see cref="UpdateUserRoleCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="userService">Käyttäjäpalvelu roolin päivittämiseen.</param>
    public UpdateUserRoleCommandHandler(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Päivittää käyttäjän käyttöoikeusroolin.
    /// </summary>
    /// <param name="request">Roolin päivityskomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Päivitetyn käyttäjän tiedot tai virhetulos.</returns>
    public Task<Result<UserResponse>> Handle(
        UpdateUserRoleCommand request,
        CancellationToken cancellationToken)
    {
        return _userService.UpdateUserRoleAsync(request.UserId, request.NewRole, cancellationToken);
    }
}
