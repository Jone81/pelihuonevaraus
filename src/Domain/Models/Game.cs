using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

/// <summary>
/// Edustaa pelihuoneen pelikirjastossa olevaa peliä tai käyttäjien ehdottamaa pelitoivetta.
/// </summary>
public sealed class Game : Entity<GameId>
{
    /// <summary>
    /// Pelin virallinen nimi.
    /// </summary>
    public string Name { get; private set; }

    /// <summary>
    /// Pelialusta, jolle peli kuuluu tai jolle sitä toivotaan.
    /// </summary>
    public GamingPlatform Platform { get; private set; }

    /// <summary>
    /// Pelin lyhyt esittely tai perustelu pelitoiveelle.
    /// </summary>
    public string Description { get; private set; }

    /// <summary>
    /// Ilmaisee, onko peli vasta toivelistalla (<c>true</c>) vai jo pelattavissa pelihuoneessa (<c>false</c>).
    /// </summary>
    public bool IsWishlist { get; private set; }

    /// <summary>
    /// Pelitoiveen saamien kannatusäänten lukumäärä.
    /// </summary>
    public int VotesCount { get; private set; }

#pragma warning disable CS8618
    // EF Coren vaatima parametriton konstruktori.
    private Game() : base(GameId.Empty)
    {
    }
#pragma warning restore CS8618

    private Game(
        GameId id,
        string name,
        GamingPlatform platform,
        string description,
        bool isWishlist,
        int votesCount)
        : base(id)
    {
        Name = name;
        Platform = platform;
        Description = description;
        IsWishlist = isWishlist;
        VotesCount = votesCount;
    }

    /// <summary>
    /// Luo uuden pelin tai pelitoiveen ja varmistaa, että pakolliset tiedot ovat kelvollisia.
    /// </summary>
    /// <param name="id">Pelin yksilöivä tunniste.</param>
    /// <param name="name">Pelin nimi.</param>
    /// <param name="platform">Pelialusta.</param>
    /// <param name="description">Pelin kuvaus.</param>
    /// <param name="isWishlist">Onko kyseessä toivelistan peli.</param>
    /// <param name="votesCount">Alkuperäinen äänimäärä.</param>
    /// <returns>Validoitu <see cref="Game"/>-entiteetti.</returns>
    public static Game Create(
        GameId id,
        string name,
        GamingPlatform platform,
        string description = "",
        bool isWishlist = false,
        int votesCount = 0)
    {
        // Domain-sääntö: Pelillä on aina oltava selkeä nimi.
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("Pelin nimi ei voi olla tyhjä.");
        }

        // Varmistetaan, ettei äänimäärä voi koskaan olla negatiivinen.
        return new Game(id, name.Trim(), platform, description.Trim(), isWishlist, Math.Max(0, votesCount));
    }

    /// <summary>
    /// Kasvattaa pelin äänimäärää yhdellä.
    /// </summary>
    public void Upvote() => VotesCount++;

    /// <summary>
    /// Siirtää pelin toivelistalta varsinaiseen pelikirjastoon saataville.
    /// </summary>
    public void MarkAsAvailable() => IsWishlist = false;

    /// <summary>
    /// Merkitsee pelin toivelistalla olevaksi pelitoiveeksi.
    /// </summary>
    public void MarkAsWishlist() => IsWishlist = true;

    /// <summary>
    /// Päivittää pelin perustiedot ja validoi uuden nimen.
    /// </summary>
    /// <param name="name">Pelin uusi nimi.</param>
    /// <param name="description">Pelin uusi kuvaus.</param>
    /// <param name="platform">Pelin uusi pelialusta.</param>
    public void UpdateDetails(string name, string description, GamingPlatform platform)
    {
        // Tarkistetaan, ettei nimeä tyhjennetä muokkauksen yhteydessä.
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("Pelin nimi ei voi olla tyhjä.");
        }

        Name = name.Trim();
        Description = description.Trim();
        Platform = platform;
    }
}
