using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Users;

namespace Pelihuone.Application.Features.Users.Commands;

/// <summary>
/// Komento vahvistuskoodin tarkistamiseen ja käyttäjän sisäänkirjaamiseen (tai rekisteröintiin).
/// </summary>
/// <param name="Email">Käyttäjän sähköpostiosoite.</param>
/// <param name="Code">Sähköpostiin lähetetty kertakäyttöinen vahvistuskoodi.</param>
/// <param name="DisplayName">Valinnainen näyttönimi uudelle käyttäjälle.</param>
public sealed record VerifyLoginCodeCommand(string Email, string Code, string? DisplayName)
    : IRequest<Result<UserResponse>>;

/// <summary>
/// Käsittelijä <see cref="VerifyLoginCodeCommand"/>-komennolle.
/// </summary>
public sealed class VerifyLoginCodeCommandHandler
    : IRequestHandler<VerifyLoginCodeCommand, Result<UserResponse>>
{
    private readonly IUserService _userService;
    private readonly ICacheService _cacheService;

    /// <summary>
    /// Alustaa uuden <see cref="VerifyLoginCodeCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="userService">Käyttäjäpalvelu koodin vahvistamiseen ja kirjautumiseen.</param>
    /// <param name="cacheService">Välimuistipalvelu tilastojen invalidoimiseen uuden käyttäjän rekisteröityessä.</param>
    public VerifyLoginCodeCommandHandler(IUserService userService, ICacheService cacheService)
    {
        _userService = userService;
        _cacheService = cacheService;
    }

    /// <summary>
    /// Vahvistaa koodin, kirjaa käyttäjän sisään ja invalidoi tilastovälimuistin onnistuessaan.
    /// </summary>
    /// <param name="request">Kirjautumiskoodin vahvistuskomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Kirjautuneen käyttäjän tiedot tai virhetulos.</returns>
    public async Task<Result<UserResponse>> Handle(
        VerifyLoginCodeCommand request,
        CancellationToken cancellationToken)
    {
        Result<UserResponse> result = await _userService.VerifyCodeAndLoginAsync(
            request.Email,
            request.Code,
            request.DisplayName,
            cancellationToken);

        if (result.IsSuccess)
        {
            await _cacheService.RemoveByTagAsync(CacheTags.Statistics, cancellationToken);
        }

        return result;
    }
}
