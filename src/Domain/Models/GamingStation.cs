using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

public sealed class GamingStation : Entity<GamingStationId>
{
    public string Name { get; private set; }
    public string StationCode { get; private set; }
    public GamingStationType Type { get; private set; }
    public bool IsActive { get; private set; }

    /// <summary>
    /// Sääntö 6: PlayStation 5 ja Nintendo Switch jakavat saman TV:n (SharedTV).
    /// </summary>
    public bool UsesSharedTv => Type is GamingStationType.PlayStation5 or GamingStationType.NintendoSwitch;

#pragma warning disable CS8618
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

    public static GamingStation Create(GamingStationId id, string name, GamingStationType type, bool isActive = true, string stationCode = "")
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("Pelipisteen nimi ei voi olla tyhjä.");
        }

        string code = string.IsNullOrWhiteSpace(stationCode) ? name.Trim().Replace(" ", "-").ToUpperInvariant() : stationCode.Trim().ToUpperInvariant();

        return new GamingStation(id, name.Trim(), code, type, isActive);
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("Pelipisteen nimi ei voi olla tyhjä.");
        }

        Name = name.Trim();
    }

    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;
}
