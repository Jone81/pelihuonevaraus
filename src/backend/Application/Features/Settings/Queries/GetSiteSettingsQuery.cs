using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Settings;

namespace Pelihuone.Application.Features.Settings.Queries;

/// <summary>
/// Kysely sivuston yleisten asetusten hakemiseen välimuistia hyödyntäen.
/// </summary>
public sealed record GetSiteSettingsQuery()
    : IRequest<Result<SiteSettingsResponse>>, ICacheableQuery
{
    private static readonly string[] Tags = [Abstractions.Caching.CacheTags.Settings];

    /// <inheritdoc />
    public string CacheKey => "settings:site";

    /// <inheritdoc />
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);

    /// <inheritdoc />
    public IReadOnlyCollection<string> CacheTags => Tags;
}

/// <summary>
/// Käsittelijä <see cref="GetSiteSettingsQuery"/>-kyselylle.
/// </summary>
public sealed class GetSiteSettingsQueryHandler
    : IRequestHandler<GetSiteSettingsQuery, Result<SiteSettingsResponse>>
{
    private readonly ISettingsService _settingsService;

    /// <summary>
    /// Alustaa uuden <see cref="GetSiteSettingsQueryHandler"/>-instanssin.
    /// </summary>
    /// <param name="settingsService">Asetuspalvelu sivuston asetusten hakemiseen.</param>
    public GetSiteSettingsQueryHandler(ISettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    /// <summary>
    /// Hakee voimassa olevat sivustoasetukset.
    /// </summary>
    /// <param name="request">Asetuskysely.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Sivuston asetukset tai virhetulos.</returns>
    public Task<Result<SiteSettingsResponse>> Handle(
        GetSiteSettingsQuery request,
        CancellationToken cancellationToken)
    {
        return _settingsService.GetSettingsAsync(cancellationToken);
    }
}
