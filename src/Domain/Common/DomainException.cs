namespace Pelihuone.Domain.Common;

/// <summary>
/// Kantaluokka kaikille liiketoimintasääntöjen ja domain-logiikan rikkomuksista aiheutuville poikkeuksille.
/// </summary>
public class DomainException : Exception
{
    /// <summary>
    /// Alustaa uuden <see cref="DomainException"/>-poikkeuksen virheviestillä.
    /// </summary>
    /// <param name="message">Kuvaus rikotusta liiketoimintasäännöstä.</param>
    public DomainException(string message) : base(message)
    {
    }

    /// <summary>
    /// Alustaa uuden <see cref="DomainException"/>-poikkeuksen virheviestillä ja sisäisellä poikkeuksella.
    /// </summary>
    /// <param name="message">Kuvaus rikotusta liiketoimintasäännöstä.</param>
    /// <param name="innerException">Alkuperäinen poikkeus, joka aiheutti tämän virheen.</param>
    public DomainException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
