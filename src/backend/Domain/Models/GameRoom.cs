using Pelihuone.Domain.Common;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

/// <summary>
/// Edustaa fyysistä pelihuonetta ja sen sisältämiä pelipisteitä.
/// </summary>
public sealed class GameRoom : Entity<GameRoomId>
{
    // Sisäinen kokoelma pelitilaan sijoitetuista pelipisteistä.
    private readonly List<GamingStation> _stations = [];

    /// <summary>
    /// Pelitilan nimi (esim. kampuksen pelihuoneen tunnus).
    /// </summary>
    public string Name { get; private set; }

    /// <summary>
    /// Ilmaisee, onko tilassa konsolien jakama yhteinen televisio (SharedTV).
    /// </summary>
    public bool HasSharedTv { get; private set; }

    /// <summary>
    /// Pelitilaan kuuluvat pelipisteet vain luku -kokoelmana.
    /// </summary>
    public IReadOnlyCollection<GamingStation> Stations => _stations.AsReadOnly();

#pragma warning disable CS8618
    // EF Coren vaatima parametriton konstruktori.
    private GameRoom() : base(GameRoomId.Empty)
    {
    }
#pragma warning restore CS8618

    private GameRoom(GameRoomId id, string name, bool hasSharedTv)
        : base(id)
    {
        Name = name;
        HasSharedTv = hasSharedTv;
    }

    /// <summary>
    /// Luo uuden pelitilan ja varmistaa, että tilan nimi on annettu.
    /// </summary>
    /// <param name="id">Pelitilan yksilöivä tunniste.</param>
    /// <param name="name">Pelitilan nimi.</param>
    /// <param name="hasSharedTv">Määrittelee, onko tilassa konsolien jakama yhteinen TV.</param>
    /// <returns>Validoitu <see cref="GameRoom"/>-entiteetti.</returns>
    public static GameRoom Create(GameRoomId id, string name, bool hasSharedTv = true)
    {
        // Domain-sääntö: Pelitilalla on oltava tyhjästä poikkeava nimi.
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("Pelitilan nimi ei voi olla tyhjä.");
        }

        return new GameRoom(id, name.Trim(), hasSharedTv);
    }

    /// <summary>
    /// Lisää uuden pelipisteen pelitilaan varmistaen, ettei samaa pistettä lisätä kahdesti.
    /// </summary>
    /// <param name="station">Lisättävä pelipiste.</param>
    public void AddStation(GamingStation station)
    {
        // Estetään duplikaattipelipisteiden lisääminen samaan huoneeseen.
        if (_stations.Any(s => s.Id == station.Id))
        {
            throw new DomainException($"Pelipiste ID:llä {station.Id} on jo lisätty tilaan.");
        }

        _stations.Add(station);
    }

    /// <summary>
    /// Poistaa pelipisteen pelitilasta tunnisteen perusteella, jos se löytyy tilasta.
    /// </summary>
    /// <param name="stationId">Poistettavan pelipisteen tunniste.</param>
    public void RemoveStation(GamingStationId stationId)
    {
        // Etsitään pelipiste listalta ja poistetaan se, mikäli se on olemassa.
        GamingStation? station = _stations.FirstOrDefault(s => s.Id == stationId);
        if (station is not null)
        {
            _stations.Remove(station);
        }
    }
}
