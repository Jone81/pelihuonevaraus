using Pelihuone.Application.Common;
using Pelihuone.Contracts.Users;
using Pelihuone.Domain.Enums;

namespace Pelihuone.Application.Users;

/// <summary>
/// Sovelluspalvelurajapinta käyttäjien tunnistautumiseen, rekisteröintiin ja roolien hallintaan.
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Tunnistaa olemassa olevan käyttäjän sähköpostin perusteella tai luo uuden käyttäjän, jos häntä ei vielä löydy.
    /// </summary>
    Task<Result<UserResponse>> AuthenticateOrCreateUserAsync(
        string email,
        string displayName,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee käyttäjän tiedot hänen yksilöllisen tunnisteensa perusteella.
    /// </summary>
    Task<Result<UserResponse>> GetUserByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki järjestelmään rekisteröityneet käyttäjät.
    /// </summary>
    Task<Result<IReadOnlyList<UserResponse>>> GetAllUsersAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Päivittää käyttäjän käyttöoikeusroolin.
    /// </summary>
    Task<Result<UserResponse>> UpdateUserRoleAsync(
        Guid userId,
        UserRole newRole,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Asettaa käyttäjälle määräaikaisen tai pysyvän käyttöeston (bannin) tai poistaa voimassa olevan eston.
    /// </summary>
    Task<Result<UserResponse>> UpdateUserBanAsync(
        Guid userId,
        BanUserRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generoi ja lähettää kertakäyttöisen vahvistuskoodin oppilaitoksen sähköpostiosoitteeseen.
    /// </summary>
    Task<Result<string>> SendVerificationCodeAsync(
        string email,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Tarkistaa vahvistuskoodin ja kirjaa käyttäjän sisään (tai rekisteröi uuden käyttäjän).
    /// </summary>
    Task<Result<UserResponse>> VerifyCodeAndLoginAsync(
        string email,
        string code,
        string? displayName,
        CancellationToken cancellationToken = default);
}
