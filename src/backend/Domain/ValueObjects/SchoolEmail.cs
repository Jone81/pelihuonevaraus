using System.Text.RegularExpressions;
using Pelihuone.Domain.Exceptions;

namespace Pelihuone.Domain.ValueObjects;

/// <summary>
/// Arvo-objekti, joka edustaa validoitua oppilaitoksen sähköpostiosoitetta (@edu.xamk.fi tai @xamk.fi).
/// </summary>
public sealed partial record SchoolEmail
{
    // Sääntö 1: Sallitut oppilaitoksen sähköpostidomainit.
    private static readonly string[] AllowedDomains = ["@edu.xamk.fi", "@xamk.fi"];

    /// <summary>
    /// Normalisoitu (pieniksi kirjaimiksi muunnettu ja siistitty) sähköpostiosoite.
    /// </summary>
    public string Value { get; }

    private SchoolEmail(string value)
    {
        Value = value;
    }

    /// <summary>
    /// Luo ja validoi uuden <see cref="SchoolEmail"/>-arvo-objektin annetusta merkkijonosta.
    /// </summary>
    /// <param name="email">Tarkistettava sähköpostiosoite.</param>
    /// <returns>Validoitu <see cref="SchoolEmail"/>-instanssi.</returns>
    public static SchoolEmail Create(string? email)
    {
        // Tarkistetaan, ettei syöte ole tyhjä.
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new InvalidEmailException("Sähköpostiosoite ei voi olla tyhjä.");
        }

        string normalized = email.Trim().ToLowerInvariant();

        // Sääntö 1: Vain oppilaitoksen viralliset verkkotunnukset ovat sallittuja.
        bool hasValidDomain = AllowedDomains.Any(domain => normalized.EndsWith(domain, StringComparison.OrdinalIgnoreCase));
        if (!hasValidDomain)
        {
            throw new InvalidEmailException("Vain oppilaitoksen sähköpostiosoitteet (@edu.xamk.fi tai @xamk.fi) ovat sallittuja.");
        }

        // Varmistetaan, että ennen @-merkkiä on myös käyttäjätunnusosa.
        int atIndex = normalized.IndexOf('@');
        if (atIndex <= 0)
        {
            throw new InvalidEmailException("Virheellinen sähköpostiosoitteen muoto.");
        }

        return new SchoolEmail(normalized);
    }

    /// <summary>
    /// Palauttaa sähköpostiosoitteen merkkijonona.
    /// </summary>
    /// <returns>Sähköpostiosoitteen arvo.</returns>
    public override string ToString() => Value;

    /// <summary>
    /// Muuntaa <see cref="SchoolEmail"/>-arvo-objektin implisiittisesti merkkijonoksi.
    /// </summary>
    /// <param name="email">Muunnettava <see cref="SchoolEmail"/>-olio.</param>
    public static implicit operator string(SchoolEmail email) => email.Value;
}
