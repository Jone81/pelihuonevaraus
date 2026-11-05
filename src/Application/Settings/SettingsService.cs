using System.IO;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Settings;

namespace Pelihuone.Application.Settings;

/// <summary>
/// Toteuttaa sivustoasetusten hallinnan ja pysyväistallennuksen paikalliseen JSON-tiedostoon.
/// </summary>
public sealed class SettingsService : ISettingsService
{
    private static readonly string SettingsFilePath = Path.Combine(AppContext.BaseDirectory, "site_settings.json");
    private static readonly JsonSerializerOptions IndentedJsonOptions = new() { WriteIndented = true };
    private static string _discordWebhookUrl = string.Empty;
    private readonly ILogger<SettingsService> _logger;

    /// <summary>
    /// Alustaa uuden <see cref="SettingsService"/>-instanssin ja lataa mahdolliset tallennetut asetukset levyltä.
    /// </summary>
    public SettingsService(ILogger<SettingsService> logger)
    {
        _logger = logger;
        try
        {
            // Luetaan aiemmin tallennettu Discord Webhook -osoite JSON-tiedostosta, jos tiedosto on olemassa
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

    /// <summary>
    /// Palauttaa nykyiset sivustoasetukset ja varausrajoitusten metatiedot.
    /// </summary>
    public Task<Result<SiteSettingsResponse>> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        // Koostetaan vastaus nykyisestä webhook-osoitteesta ja kiinteistä varaussäännöistä
        var response = new SiteSettingsResponse(
            DiscordWebhookUrl: _discordWebhookUrl,
            OpeningHoursText: "08:00 – 18:00 (Ma–Pe)",
            MaxAdvanceBookingMonths: 2,
            MaxIndividualHours: 4,
            MaxStudentRoomHours: 4);

        return Task.FromResult(Result.Success(response));
    }

    /// <summary>
    /// Päivittää sivustoasetukset muistiin ja tallentaa ne JSON-tiedostoon.
    /// </summary>
    public Task<Result<SiteSettingsResponse>> UpdateSettingsAsync(
        UpdateSiteSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        // Siistitään ja päivitetään Discord Webhook -osoite
        _discordWebhookUrl = request.DiscordWebhookUrl?.Trim() ?? string.Empty;
        _logger.LogInformation("Sivustoasetukset päivitetty onnistuneesti: {Url}", _discordWebhookUrl);

        try
        {
            // Kirjoitetaan päivitetyt asetukset levylle JSON-muodossa
            var json = JsonSerializer.Serialize(new { discordWebhookUrl = _discordWebhookUrl }, IndentedJsonOptions);
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
