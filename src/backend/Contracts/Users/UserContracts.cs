namespace Pelihuone.Contracts.Users;

/// <summary>
/// Vastausmalli, joka sisältää käyttäjän perustiedot, roolin ja mahdollisen käyttöeston (bannin) tilan.
/// </summary>
/// <param name="Id">Käyttäjän yksilöivä tunniste.</param>
/// <param name="Email">Käyttäjän oppilaitoksen sähköpostiosoite.</param>
/// <param name="DisplayName">Käyttäjän näyttönimi.</param>
/// <param name="Role">Käyttäjän rooli merkkijonona (User, Admin tai SuperAdmin).</param>
/// <param name="BannedUntilUtc">Käyttöeston (bannin) päättymisaika UTC-muodossa tai <see langword="null"/>.</param>
/// <param name="BanReason">Mahdollinen syy tai perustelu käyttöestolle.</param>
/// <param name="IsBanned">Ilmaisee, onko käyttäjän käyttöesto parhaillaan voimassa.</param>
public sealed record UserResponse(
    Guid Id,
    string Email,
    string DisplayName,
    string Role,
    DateTimeOffset? BannedUntilUtc = null,
    string? BanReason = null,
    bool IsBanned = false);

/// <summary>
/// Pyynnön tietomalli käyttäjän käyttöoikeusroolin päivittämiseksi.
/// </summary>
/// <param name="Role">Uusi käyttäjärooli merkkijonona.</param>
public sealed record UpdateUserRoleRequest(string Role);

/// <summary>
/// Pyynnön tietomalli käyttäjän käyttöeston (bannin / porttikiellon) asettamiseksi tai poistamiseksi.
/// </summary>
/// <param name="DurationHours">Käyttöeston pituus tunteina. Jos arvo on <see langword="null"/> tai &lt;= 0 eikä <paramref name="IsPermanent"/> ole tosi, esto poistetaan.</param>
/// <param name="Reason">Valinnainen syy tai selite käyttöestolle.</param>
/// <param name="IsPermanent">Ilmaisee, asetetaanko käyttäjälle pysyvä käyttöesto.</param>
public sealed record BanUserRequest(
    int? DurationHours,
    string? Reason = null,
    bool IsPermanent = false);

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
