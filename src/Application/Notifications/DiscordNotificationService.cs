using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Pelihuone.Application.Settings;

namespace Pelihuone.Application.Notifications;

/// <summary>
/// Toteuttaa Discord-webhook-ilmoitusten lähettämisen tapahtumista ja vikailmoituksista.
/// </summary>
public sealed class DiscordNotificationService : IDiscordNotificationService
{
    private static readonly HttpClient HttpClient = new();
    private readonly ISettingsService _settingsService;
    private readonly ILogger<DiscordNotificationService> _logger;

    /// <summary>
    /// Alustaa uuden <see cref="DiscordNotificationService"/>-instanssin.
    /// </summary>
    public DiscordNotificationService(
        ISettingsService settingsService,
        ILogger<DiscordNotificationService> logger)
    {
        _settingsService = settingsService;
        _logger = logger;
    }

    /// <summary>
    /// Lähettää Discord-kanavalle viestin uudesta tapahtumavarauksesta, mikäli Webhook URL on asetettu.
    /// </summary>
    public async Task SendEventNotificationAsync(
        string eventTitle,
        string description,
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        string organizer,
        CancellationToken cancellationToken = default)
    {
        // Haetaan tallennettu Discord Webhook -osoite asetuksista
        var settingsResult = await _settingsService.GetSettingsAsync(cancellationToken);
        string webhookUrl = settingsResult.Value.DiscordWebhookUrl;

        // Ohitetaan lähetys hiljaisesti, jos webhookia ei ole määritelty
        if (string.IsNullOrWhiteSpace(webhookUrl))
        {
            _logger.LogInformation("Discord-ilmoitusta ei lähetetty: Webhook URL ei ole konfiguroitu.");
            return;
        }

        try
        {
            // Muodostetaan Discord-viestin sisältö
            var payload = new
            {
                content = $"🏆 **UUSI TAPAHTUMA XAMK GAME ROOMISSA!**\n\n" +
                          $"**Otsikko:** {eventTitle}\n" +
                          $"**Ajankohta:** {startUtc:dd.MM.yyyy HH:mm} – {endUtc:HH:mm} UTC\n" +
                          $"**Järjestäjä:** {organizer}\n" +
                          $"**Kuvaus:** {description}\n\n" +
                          $"Tervetuloa mukaan paikan päälle!"
            };

            var response = await HttpClient.PostAsJsonAsync(webhookUrl, payload, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Discord-ilmoitus tapahtumasta lähetetty onnistuneesti.");
            }
            else
            {
                _logger.LogWarning("Discord Webhook palautti statuskoodin {StatusCode}.", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            // Verkko- tai HTTP-virheet lokitetaan kaatamatta kutsuvaa prosessia
            _logger.LogError(ex, "Virhe lähetettäessä ilmoitusta Discord Webhookiin.");
        }
    }

    /// <summary>
    /// Lähettää Discord-kanavalle ilmoituksen uudesta vikailmoituksesta ylläpidolle.
    /// </summary>
    public async Task SendIssueReportNotificationAsync(
        string target,
        string title,
        string description,
        string reporterEmail,
        string reporterName,
        CancellationToken cancellationToken = default)
    {
        // Haetaan tallennettu Discord Webhook -osoite asetuksista
        var settingsResult = await _settingsService.GetSettingsAsync(cancellationToken);
        string webhookUrl = settingsResult.Value.DiscordWebhookUrl;

        if (string.IsNullOrWhiteSpace(webhookUrl))
        {
            _logger.LogInformation("Discord-ilmoitusta vikailmoituksesta ei lähetetty: Webhook URL ei ole konfiguroitu.");
            return;
        }

        try
        {
            // Näytetään ilmoittajan tiedot tai merkintä anonyymistä opiskelijasta
            string reporterInfo = string.IsNullOrWhiteSpace(reporterName) && string.IsNullOrWhiteSpace(reporterEmail)
                ? "Anonyymi opiskelija"
                : $"{reporterName} ({reporterEmail})".Trim();

            var payload = new
            {
                content = $"🚨 **UUSI VIKAILMOITUS / PALAUTE ADMINILLE!**\n\n" +
                          $"**Kohde:** {target}\n" +
                          $"**Otsikko:** {title}\n" +
                          $"**Ilmoittaja:** {reporterInfo}\n" +
                          $"**Kuvaus:**\n{description}\n\n" +
                          $"*Tarkista ja kuittaa ilmoitus Ylläpitopaneelissa.*"
            };

            var response = await HttpClient.PostAsJsonAsync(webhookUrl, payload, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Discord-vikailmoitus lähetetty ylläpidolle onnistuneesti.");
            }
            else
            {
                _logger.LogWarning("Discord Webhook vikailmoitukselle palautti statuskoodin {StatusCode}.", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Virhe lähetettäessä vikailmoitusta Discord Webhookiin.");
        }
    }
}
