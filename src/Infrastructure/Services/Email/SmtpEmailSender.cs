using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Pelihuone.Application.Notifications;

namespace Pelihuone.Infrastructure.Services.Email;

/// <summary>
/// Toteuttaa sähköpostien lähettämisen SMTP-protokollalla tai simuloituna kehitysympäristön lokiin.
/// </summary>
public sealed class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailSender> _logger;

    /// <summary>
    /// Alustaa uuden <see cref="SmtpEmailSender"/>-instanssin.
    /// </summary>
    /// <param name="configuration">Sovelluksen konfiguraatio SMTP-asetusten lukemiseen.</param>
    /// <param name="logger">Lokituspalvelu.</param>
    public SmtpEmailSender(
        IConfiguration configuration,
        ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Lähettää sähköpostiviestin määritellyille vastaanottajille SMTP-palvelimen kautta tai kirjaa sen lokiin.
    /// </summary>
    /// <param name="recipients">Vastaanottajien sähköpostiosoitteet.</param>
    /// <param name="subject">Sähköpostin otsikko.</param>
    /// <param name="body">Sähköpostin leipäteksti.</param>
    /// <param name="isHtml">Ilmaisee, onko viestin sisältö HTML-muotoiltua.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkroniselle operaatiolle.</param>
    /// <returns><c>true</c>, jos viestin lähetys tai lokitus onnistui; muuten <c>false</c>.</returns>
    public async Task<bool> SendEmailAsync(
        IReadOnlyList<string> recipients,
        string subject,
        string body,
        bool isHtml = false,
        CancellationToken cancellationToken = default)
    {
        if (recipients.Count == 0)
        {
            _logger.LogWarning("Sähköpostia ei lähetetty: vastaanottajalista on tyhjä.");
            return false;
        }

        string? host = _configuration["Smtp:Host"];
        string senderEmail = _configuration["Smtp:SenderEmail"] ?? "no-reply@xamk.fi";
        string senderName = _configuration["Smtp:SenderName"] ?? "Xamk Game Room Alert";

        // Jos SMTP-palvelinta ei ole määritetty (esim. kehitys- tai testausympäristössä), simuloidaan lähetys lokiin
        if (string.IsNullOrWhiteSpace(host))
        {
            _logger.LogInformation(
                "[SÄHKÖPOSTISIMULAATIO] Vastaanottajat: {Recipients} | Aihe: {Subject} | Lähettäjä: {SenderName} <{SenderEmail}>",
                string.Join(", ", recipients),
                subject,
                senderName,
                senderEmail);
            return true;
        }

        int port = int.TryParse(_configuration["Smtp:Port"], out int parsedPort) ? parsedPort : 587;
        bool enableSsl = !bool.TryParse(_configuration["Smtp:EnableSsl"], out bool parsedSsl) || parsedSsl;
        string? username = _configuration["Smtp:Username"];
        string? password = _configuration["Smtp:Password"];

        try
        {
            using SmtpClient client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl
            };

            if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
            {
                client.Credentials = new NetworkCredential(username, password);
            }

            using MailMessage message = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml
            };

            foreach (string recipient in recipients)
            {
                if (!string.IsNullOrWhiteSpace(recipient))
                {
                    message.To.Add(recipient.Trim());
                }
            }

            await client.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("Sähköpostiviesti lähetetty onnistuneesti {Count} vastaanottajalle.", recipients.Count);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Virhe lähetettäessä sähköpostiviestiä SMTP-palvelimen kautta ({Host}:{Port}).", host, port);
            return false;
        }
    }
}
