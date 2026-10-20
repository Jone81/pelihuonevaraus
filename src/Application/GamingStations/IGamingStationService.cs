using Pelihuone.Application.Common;
using Pelihuone.Contracts.GamingStations;

namespace Pelihuone.Application.GamingStations;

public interface IGamingStationService
{
    Task<Result<IReadOnlyList<GamingStationResponse>>> GetAllStationsAsync(
        CancellationToken cancellationToken = default);

    Task<Result<IReadOnlyList<GamingStationResponse>>> GetAvailableStationsAsync(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        CancellationToken cancellationToken = default);
}
