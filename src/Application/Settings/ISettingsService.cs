using Pelihuone.Application.Common;
using Pelihuone.Contracts.Settings;

namespace Pelihuone.Application.Settings;

/// <summary>
/// Sovelluspalvelurajapinta sivuston yleisten asetusten (kuten Discord-webhookin ja aukioloaikojen) hakemiseen ja päivittämiseen.
/// </summary>
public interface ISettingsService
{
    /// <summary>
    /// Hakee voimassa olevat sivustoasetukset.
    /// </summary>
    Task<Result<SiteSettingsResponse>> GetSettingsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Päivittää sivuston muokattavat asetukset.
    /// </summary>
    Task<Result<SiteSettingsResponse>> UpdateSettingsAsync(
        UpdateSiteSettingsRequest request,
        CancellationToken cancellationToken = default);
}
