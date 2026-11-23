using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

/// <summary>
/// Edustaa yksittäistä varattavissa olevaa pelipistettä (esim. pelitietokonetta tai konsolia) pelihuoneessa.
/// </summary>
public sealed class GamingStation : Entity<GamingStationId>
{
    /// <summary>
    /// Pelipisteen näyttönimi (esim. "Pelitietokone 1" tai "PlayStation 5").
    /// </summary>
    public string Name { get; private set; }

    /// <summary>
    /// Pelipisteen tekninen laitekoodi (esim. "PC-1").
    /// </summary>
    public string StationCode { get; private set; }

    /// <summary>
    /// Pelipisteen laitetyyppi.
    /// </summary>
    public GamingStationType Type { get; private set; }

    /// <summary>
    /// Ilmaisee, onko pelipiste tällä hetkellä käytettävissä ja varattavissa.
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// Sääntö 6: PlayStation 5 ja Nintendo Switch jakavat saman TV:n (SharedTV).
    /// </summary>
    public bool UsesSharedTv => Type is GamingStationType.PlayStation5 or GamingStationType.NintendoSwitch;

#pragma warning disable CS8618
    // EF Coren vaatima parametriton konstruktori.
    private GamingStation() : base(GamingStationId.Empty)
    {
    }
#pragma warning restore CS8618

    private GamingStation(GamingStationId id, string name, string stationCode, GamingStationType type, bool isActive)
        : base(id)
    {
        Name = name;
        StationCode = stationCode;
        Type = type;
        IsActive = isActive;
    }

    /// <summary>
    /// Luo uuden pelipisteen ja generoi sille tarvittaessa oletusmuotoisen laitekoodin.
    /// </summary>
    /// <param name="id">Pelipisteen yksilöivä tunniste.</param>
    /// <param name="name">Pelipisteen näyttönimi.</param>
    /// <param name="type">Pelipisteen laitetyyppi.</param>
    /// <param name="isActive">Onko pelipiste heti aktiivinen ja varattavissa.</param>
    /// <param name="stationCode">Valinnainen tekninen laitekoodi.</param>
    /// <returns>Validoitu <see cref="GamingStation"/>-entiteetti.</returns>
    public static GamingStation Create(GamingStationId id, string name, GamingStationType type, bool isActive = true, string stationCode = "")
    {
        // Domain-sääntö: Pelipisteellä on oltava selkeä nimi.
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("Pelipisteen nimi ei voi olla tyhjä.");
        }

        // Jos erillistä laitekoodia ei ole annettu, muodostetaan se nimestä suuraakkosin ja väliviivoin.
        string code = string.IsNullOrWhiteSpace(stationCode) ? name.Trim().Replace(" ", "-").ToUpperInvariant() : stationCode.Trim().ToUpperInvariant();

        return new GamingStation(id, name.Trim(), code, type, isActive);
    }

    /// <summary>
    /// Päivittää pelipisteen näyttönimen.
    /// </summary>
    /// <param name="name">Uusi näyttönimi.</param>
    public void UpdateName(string name)
    {
        // Varmistetaan, ettei nimeä aseteta tyhjäksi.
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("Pelipisteen nimi ei voi olla tyhjä.");
        }

        Name = name.Trim();
    }

    /// <summary>
    /// Asettaa pelipisteen aktiiviseksi ja varattavaksi.
    /// </summary>
    public void Activate() => IsActive = true;

    /// <summary>
    /// Poistaa pelipisteen käytöstä esimerkiksi huollon ajaksi.
    /// </summary>
    public void Deactivate() => IsActive = false;
}
