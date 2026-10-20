using Microsoft.Extensions.Logging;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Settings;

namespace Pelihuone.Application.Settings;

public sealed class SettingsService : ISettingsService
{
    private static string _discordWebhookUrl = string.Empty;
    private readonly ILogger<SettingsService> _logger;

    public SettingsService(ILogger<SettingsService> logger)
    {
        _logger = logger;
    }

    public Task<Result<SiteSettingsResponse>> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var response = new SiteSettingsResponse(
            DiscordWebhookUrl: _discordWebhookUrl,
            OpeningHoursText: "08:00 – 18:00 (Ma–Pe)",
            MaxAdvanceBookingMonths: 2,
            MaxIndividualHours: 4,
            MaxStudentRoomHours: 4);

        return Task.FromResult(Result.Success(response));
    }

    public Task<Result<SiteSettingsResponse>> UpdateSettingsAsync(
        UpdateSiteSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        _discordWebhookUrl = request.DiscordWebhookUrl?.Trim() ?? string.Empty;
        _logger.LogInformation("Sivustoasetukset päivitetty onnistuneesti.");

        var response = new SiteSettingsResponse(
            DiscordWebhookUrl: _discordWebhookUrl,
            OpeningHoursText: "08:00 – 18:00 (Ma–Pe)",
            MaxAdvanceBookingMonths: 2,
            MaxIndividualHours: 4,
            MaxStudentRoomHours: 4);

        return Task.FromResult(Result.Success(response));
    }
}
