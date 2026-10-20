namespace Pelihuone.Contracts.Rooms;

public sealed record GameRoomResponse(
    Guid Id,
    string Name,
    bool HasSharedTv,
    int StationCount);
