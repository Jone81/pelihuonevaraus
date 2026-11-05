namespace Pelihuone.Application.Common;

/// <summary>
/// Määrittelee sovelluskerroksen virheen tyypin, jonka perusteella rajapintakerros voi valita oikean HTTP-tilakoodin.
/// </summary>
public enum ErrorType
{
    /// <summary>
    /// Yleinen virhetilanne.
    /// </summary>
    Failure = 1,

    /// <summary>
    /// Syötteen tai liiketoimintasäännön validointivirhe.
    /// </summary>
    Validation = 2,

    /// <summary>
    /// Haettua resurssia ei löytynyt.
    /// </summary>
    NotFound = 3,

    /// <summary>
    /// Ristiriitatilanne, kuten päällekkäinen varaus.
    /// </summary>
    Conflict = 4,

    /// <summary>
    /// Käyttäjää ei ole tunnistettu.
    /// </summary>
    Unauthorized = 5,

    /// <summary>
    /// Käyttäjällä ei ole riittäviä käyttöoikeuksia toiminnon suorittamiseen.
    /// </summary>
    Forbidden = 6
}

/// <summary>
/// Kuvaa sovelluskerroksen virhettä, joka sisältää koneellisen virhekoodin, selkokielisen kuvauksen sekä virhetyypin.
/// </summary>
/// <param name="Code">Yksilöllinen virhekoodi.</param>
/// <param name="Description">Käyttäjälle tai kehittäjälle näytettävä virheen kuvaus.</param>
/// <param name="Type">Virheen luokittelutyyppi.</param>
public sealed record Error(string Code, string Description, ErrorType Type = ErrorType.Failure)
{
    /// <summary>
    /// Tyhjä virhearvo, joka ilmaisee virheetöntä tilaa.
    /// </summary>
    public static readonly Error None = new(string.Empty, string.Empty, ErrorType.Failure);

    /// <summary>
    /// Virhearvo tilanteeseen, jossa odotettu arvo on null.
    /// </summary>
    public static readonly Error NullValue = new("Error.NullValue", "Null-arvo annettu.", ErrorType.Failure);

    /// <summary>
    /// Luo yleisen virheen.
    /// </summary>
    public static Error Failure(string code, string description) => new(code, description, ErrorType.Failure);

    /// <summary>
    /// Luo validointivirheen.
    /// </summary>
    public static Error Validation(string code, string description) => new(code, description, ErrorType.Validation);

    /// <summary>
    /// Luo virheen tilanteeseen, jossa resurssia ei löytynyt.
    /// </summary>
    public static Error NotFound(string code, string description) => new(code, description, ErrorType.NotFound);

    /// <summary>
    /// Luo ristiriitavirheen (esim. päällekkäinen varaus).
    /// </summary>
    public static Error Conflict(string code, string description) => new(code, description, ErrorType.Conflict);

    /// <summary>
    /// Luo tunnistautumisvirheen.
    /// </summary>
    public static Error Unauthorized(string code, string description) => new(code, description, ErrorType.Unauthorized);

    /// <summary>
    /// Luo käyttöoikeusvirheen.
    /// </summary>
    public static Error Forbidden(string code, string description) => new(code, description, ErrorType.Forbidden);
}
