using Pelihuone.Application.Common;
using Pelihuone.Contracts.Settings;

namespace Pelihuone.Application.Settings;

public interface ISettingsService
{
    Task<Result<SiteSettingsResponse>> GetSettingsAsync(CancellationToken cancellationToken = default);

    Task<Result<SiteSettingsResponse>> UpdateSettingsAsync(
        UpdateSiteSettingsRequest request,
        CancellationToken cancellationToken = default);
}
