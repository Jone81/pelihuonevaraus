namespace Pelihuone.Contracts.Users;

/// <summary>
/// Vastausmalli, joka sisältää käyttäjän perustiedot ja roolin.
/// </summary>
/// <param name="Id">Käyttäjän yksilöivä tunniste.</param>
/// <param name="Email">Käyttäjän oppilaitoksen sähköpostiosoite.</param>
/// <param name="DisplayName">Käyttäjän näyttönimi.</param>
/// <param name="Role">Käyttäjän rooli merkkijonona (User, Admin tai SuperAdmin).</param>
public sealed record UserResponse(
    Guid Id,
    string Email,
    string DisplayName,
    string Role);

/// <summary>
/// Pyynnön tietomalli käyttäjän käyttöoikeusroolin päivittämiseksi.
/// </summary>
/// <param name="Role">Uusi käyttäjärooli merkkijonona.</param>
public sealed record UpdateUserRoleRequest(string Role);

/// <summary>
/// Pyynnön tietomalli kertakäyttöisen vahvistuskoodin (OTP) lähettämiseksi koulusähköpostiin.
/// </summary>
/// <param name="Email">Vastaanottajan oppilaitoksen sähköpostiosoite (@edu.xamk.fi tai @xamk.fi).</param>
public sealed record SendVerificationCodeRequest(string Email);

/// <summary>
/// Pyynnön tietomalli sähköpostitse saadun vahvistuskoodin tarkistamiseksi ja sisäänkirjautumiseksi.
/// </summary>
/// <param name="Email">Käyttäjän oppilaitoksen sähköpostiosoite.</param>
/// <param name="Code">Sähköpostiin lähetetty vahvistuskoodi.</param>
/// <param name="DisplayName">Valinnainen näyttönimi uuden käyttäjän rekisteröitymisen yhteydessä.</param>
public sealed record VerifyCodeRequest(
    string Email,
    string Code,
    string? DisplayName = null);
