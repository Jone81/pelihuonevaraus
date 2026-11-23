using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Users;

namespace Pelihuone.Application.Features.Users.Commands;

/// <summary>
/// Komento kehitysympäristön pikakirjautumiseen sähköpostilla ja näyttönimellä.
/// </summary>
/// <param name="Email">Käyttäjän sähköpostiosoite.</param>
/// <param name="DisplayName">Käyttäjän näyttönimi.</param>
public sealed record DevLoginCommand(string Email, string DisplayName)
    : IRequest<Result<UserResponse>>;

/// <summary>
/// Käsittelijä <see cref="DevLoginCommand"/>-komennolle.
/// </summary>
public sealed class DevLoginCommandHandler
    : IRequestHandler<DevLoginCommand, Result<UserResponse>>
{
    private readonly IUserService _userService;
    private readonly ICacheService _cacheService;

    /// <summary>
    /// Alustaa uuden <see cref="DevLoginCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="userService">Käyttäjäpalvelu tunnistautumiseen tai käyttäjän luomiseen.</param>
    /// <param name="cacheService">Välimuistipalvelu tilastojen invalidoimiseen.</param>
    public DevLoginCommandHandler(IUserService userService, ICacheService cacheService)
    {
        _userService = userService;
        _cacheService = cacheService;
    }

    /// <summary>
    /// Tunnistaa tai luo käyttäjän ja invalidoi tilastovälimuistin onnistuessaan.
    /// </summary>
    /// <param name="request">Kehitysympäristön kirjautumiskomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Kirjautuneen käyttäjän tiedot tai virhetulos.</returns>
    public async Task<Result<UserResponse>> Handle(
        DevLoginCommand request,
        CancellationToken cancellationToken)
    {
        Result<UserResponse> result = await _userService.AuthenticateOrCreateUserAsync(
            request.Email,
            request.DisplayName,
            cancellationToken);

        if (result.IsSuccess)
        {
            await _cacheService.RemoveByTagAsync(CacheTags.Statistics, cancellationToken);
        }

        return result;
    }
}
