namespace Pelihuone.Domain.Common;

/// <summary>
/// Abstrakti kantaluokka domain-entiteeteille, joiden yhtäsuuruus määräytyy niiden yksilöllisen tunnisteen perusteella.
/// </summary>
/// <typeparam name="TId">Entiteetin yksilöivän tunnisteen tyyppi.</typeparam>
public abstract class Entity<TId> : IEquatable<Entity<TId>>
    where TId : notnull
{
    /// <summary>
    /// Entiteetin yksilöivä tunniste.
    /// </summary>
    public TId Id { get; protected set; }

    /// <summary>
    /// Alustaa entiteetin annetulla tunnisteella.
    /// </summary>
    /// <param name="id">Entiteetin yksilöivä tunniste.</param>
    protected Entity(TId id)
    {
        Id = id;
    }

    /// <summary>
    /// Vertailee entiteettiä toiseen olioon tunnisteen perusteella.
    /// </summary>
    /// <param name="obj">Vertailtava olio.</param>
    /// <returns><c>true</c>, jos oliot edustavat samaa entiteettiä; muulloin <c>false</c>.</returns>
    public override bool Equals(object? obj) =>
        obj is Entity<TId> entity && Equals(entity);

    /// <summary>
    /// Vertailee entiteettiä toiseen saman tyyppiseen entiteettiin tunnisteen perusteella.
    /// </summary>
    /// <param name="other">Vertailtava entiteetti.</param>
    /// <returns><c>true</c>, jos molemmilla entiteeteillä on sama tyyppi ja tunniste; muulloin <c>false</c>.</returns>
    public bool Equals(Entity<TId>? other)
    {
        // Tyhjä viittaus ei voi olla yhtä suuri.
        if (other is null)
        {
            return false;
        }

        // Viittaus samaan muistipaikkaan tarkoittaa samaa oliota.
        if (ReferenceEquals(this, other))
        {
            return true;
        }

        // Eri entiteettityypit eivät ole samoja, vaikka niillä sattuisi olemaan sama ID-arvo.
        if (GetType() != other.GetType())
        {
            return false;
        }

        // Entiteettien yhtäsuuruus perustuu yksinomaan niiden tunnisteeseen.
        return EqualityComparer<TId>.Default.Equals(Id, other.Id);
    }

    /// <summary>
    /// Palauttaa entiteetin hajautusarvon sen tunnisteen perusteella.
    /// </summary>
    /// <returns>Tunnisteesta laskettu hajautusarvo.</returns>
    public override int GetHashCode() =>
        EqualityComparer<TId>.Default.GetHashCode(Id);

    /// <summary>
    /// Tarkistaa, ovatko kaksi entiteettiä yhtä suuria.
    /// </summary>
    /// <param name="left">Ensimmäinen vertailtava entiteetti.</param>
    /// <param name="right">Toinen vertailtava entiteetti.</param>
    /// <returns><c>true</c>, jos entiteetit ovat yhtä suuria; muulloin <c>false</c>.</returns>
    public static bool operator ==(Entity<TId>? left, Entity<TId>? right) =>
        Equals(left, right);

    /// <summary>
    /// Tarkistaa, ovatko kaksi entiteettiä erisuuria.
    /// </summary>
    /// <param name="left">Ensimmäinen vertailtava entiteetti.</param>
    /// <param name="right">Toinen vertailtava entiteetti.</param>
    /// <returns><c>true</c>, jos entiteetit ovat erisuuria; muulloin <c>false</c>.</returns>
    public static bool operator !=(Entity<TId>? left, Entity<TId>? right) =>
        !Equals(left, right);
}
