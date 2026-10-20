namespace Pelihuone.Contracts.GamingStations;

public sealed record GamingStationResponse(
    Guid Id,
    string Name,
    string Type,
    bool UsesSharedTv,
    bool IsActive);
