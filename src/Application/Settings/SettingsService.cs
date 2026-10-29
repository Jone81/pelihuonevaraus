using System.IO;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Settings;

namespace Pelihuone.Application.Settings;

public sealed class SettingsService : ISettingsService
{
    private static readonly string SettingsFilePath = Path.Combine(AppContext.BaseDirectory, "site_settings.json");
    private static string _discordWebhookUrl = string.Empty;
    private readonly ILogger<SettingsService> _logger;

    public SettingsService(ILogger<SettingsService> logger)
    {
        _logger = logger;
        try
        {
            if (File.Exists(SettingsFilePath))
            {
                var content = File.ReadAllText(SettingsFilePath);
                using var doc = JsonDocument.Parse(content);
                if (doc.RootElement.TryGetProperty("discordWebhookUrl", out var prop))
                {
                    _discordWebhookUrl = prop.GetString() ?? string.Empty;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Virhe luettaessa sivustoasetuksia tiedostosta.");
        }
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
        _logger.LogInformation("Sivustoasetukset päivitetty onnistuneesti: {Url}", _discordWebhookUrl);

        try
        {
            var json = JsonSerializer.Serialize(new { discordWebhookUrl = _discordWebhookUrl }, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(SettingsFilePath, json);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Virhe tallennettaessa sivustoasetuksia tiedostoon.");
        }

        var response = new SiteSettingsResponse(
            DiscordWebhookUrl: _discordWebhookUrl,
            OpeningHoursText: "08:00 – 18:00 (Ma–Pe)",
            MaxAdvanceBookingMonths: 2,
            MaxIndividualHours: 4,
            MaxStudentRoomHours: 4);

        return Task.FromResult(Result.Success(response));
    }
}
