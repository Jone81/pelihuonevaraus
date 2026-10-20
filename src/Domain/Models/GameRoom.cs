using Pelihuone.Domain.Common;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

public sealed class GameRoom : Entity<GameRoomId>
{
    private readonly List<GamingStation> _stations = [];

    public string Name { get; private set; }
    public bool HasSharedTv { get; private set; }
    public IReadOnlyCollection<GamingStation> Stations => _stations.AsReadOnly();

#pragma warning disable CS8618
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

    public static GameRoom Create(GameRoomId id, string name, bool hasSharedTv = true)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("Pelitilan nimi ei voi olla tyhjä.");
        }

        return new GameRoom(id, name.Trim(), hasSharedTv);
    }

    public void AddStation(GamingStation station)
    {
        if (_stations.Any(s => s.Id == station.Id))
        {
            throw new DomainException($"Pelipiste ID:llä {station.Id} on jo lisätty tilaan.");
        }

        _stations.Add(station);
    }

    public void RemoveStation(GamingStationId stationId)
    {
        GamingStation? station = _stations.FirstOrDefault(s => s.Id == stationId);
        if (station is not null)
        {
            _stations.Remove(station);
        }
    }
}
