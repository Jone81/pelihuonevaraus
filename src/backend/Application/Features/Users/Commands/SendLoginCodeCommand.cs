using MediatR;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;

namespace Pelihuone.Application.Features.Users.Commands;

/// <summary>
/// Komento kertakäyttöisen kirjautumiskoodin lähettämiseen oppilaitoksen sähköpostiosoitteeseen.
/// </summary>
/// <param name="Email">Käyttäjän sähköpostiosoite.</param>
public sealed record SendLoginCodeCommand(string Email)
    : IRequest<Result<string>>;

/// <summary>
/// Käsittelijä <see cref="SendLoginCodeCommand"/>-komennolle.
/// </summary>
public sealed class SendLoginCodeCommandHandler
    : IRequestHandler<SendLoginCodeCommand, Result<string>>
{
    private readonly IUserService _userService;

    /// <summary>
    /// Alustaa uuden <see cref="SendLoginCodeCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="userService">Käyttäjäpalvelu vahvistuskoodin lähettämiseen.</param>
    public SendLoginCodeCommandHandler(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Generoi ja lähettää kertakäyttöisen vahvistuskoodin sähköpostiin.
    /// </summary>
    /// <param name="request">Koodin lähetyskomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Tieto lähetyksen onnistumisesta tai virhetulos.</returns>
    public Task<Result<string>> Handle(
        SendLoginCodeCommand request,
        CancellationToken cancellationToken)
    {
        return _userService.SendVerificationCodeAsync(request.Email, cancellationToken);
    }
}
