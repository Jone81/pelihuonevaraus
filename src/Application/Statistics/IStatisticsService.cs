using Pelihuone.Application.Common;
using Pelihuone.Contracts.Statistics;

namespace Pelihuone.Application.Statistics;

public interface IStatisticsService
{
    Task<Result<StatisticsResponse>> GetStatisticsAsync(CancellationToken cancellationToken = default);
}
