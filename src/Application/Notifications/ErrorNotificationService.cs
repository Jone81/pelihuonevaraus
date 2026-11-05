using System.Collections.Concurrent;
using System.Globalization;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;

namespace Pelihuone.Application.Notifications;

/// <summary>
/// Toteuttaa järjestelmän odottamattomien virheiden ja kaatumisten automaattisen hälytysviestinnän
/// ylläpitäjien (Admin ja SuperAdmin) sähköposteihin sisältäen puskuroinnin ja spämmisuojauksen.
/// </summary>
public sealed class ErrorNotificationService : IErrorNotificationService
{
    private static readonly ConcurrentDictionary<string, DateTimeOffset> LastAlertTimes = new();
    private static readonly TimeSpan AlertCooldown = TimeSpan.FromMinutes(1);

    private readonly IUserRepository _userRepository;
    private readonly IEmailSender _emailSender;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ErrorNotificationService> _logger;

    /// <summary>
    /// Alustaa uuden <see cref="ErrorNotificationService"/>-instanssin.
    /// </summary>
    /// <param name="userRepository">Käyttäjien tietovarasto ylläpitäjien sähköpostien hakemiseen.</param>
    /// <param name="emailSender">Sähköpostin lähetyspalvelu.</param>
    /// <param name="dateTimeProvider">Aikapalvelu aikaleimojen luontiin.</param>
    /// <param name="configuration">Konfiguraatiopalvelu varavastaanottajien lukemiseen.</param>
    /// <param name="logger">Lokituspalvelu.</param>
    public ErrorNotificationService(
        IUserRepository userRepository,
        IEmailSender emailSender,
        IDateTimeProvider dateTimeProvider,
        IConfiguration configuration,
        ILogger<ErrorNotificationService> logger)
    {
        _userRepository = userRepository;
        _emailSender = emailSender;
        _dateTimeProvider = dateTimeProvider;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Lähettää automaattisen virheraportin ja pinojäljen ylläpitäjien sähköpostiosoitteisiin.
    /// Sisältää spämmisuojan (1 minuutin välikellon saman virheen toistuessa).
    /// </summary>
    /// <param name="exception">Syntynyt käsittelemätön poikkeus.</param>
    /// <param name="path">HTTP-pyynnön osoitepolku tai suorituskonteksti (valinnainen).</param>
    /// <param name="traceId">Jäljitystunniste (Trace ID) pyynnön yhdistämiseen lokitietoihin.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkroniselle operaatiolle.</param>
    public async Task SendErrorAlertAsync(
        Exception exception,
        string? path = null,
        string? traceId = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(exception);

        DateTimeOffset now = _dateTimeProvider.UtcNow;
        string throttleKey = $"{exception.GetType().FullName}:{exception.Message}:{path}";

        if (LastAlertTimes.TryGetValue(throttleKey, out DateTimeOffset lastSent) && now - lastSent < AlertCooldown)
        {
            _logger.LogInformation(
                "Virheilmoituksen lähetys ohitettu jäähdytysajan vuoksi. Avain: {ThrottleKey}",
                throttleKey);
            return;
        }

        LastAlertTimes[throttleKey] = now;

        List<string> recipientEmails = await ResolveAdminRecipientsAsync(cancellationToken);

        if (recipientEmails.Count == 0)
        {
            _logger.LogWarning("Virhehälytystä ei voitu lähettää: vastaanottajia (Admin/SuperAdmin) ei löydy.");
            return;
        }

        string subject = $"[KRIITTINEN VIRHE] Pelihuonevaraus - {exception.GetType().Name}: {exception.Message}";
        if (subject.Length > 120)
        {
            subject = subject[..117] + "...";
        }

        string body = BuildErrorEmailBody(exception, path, traceId, now);

        try
        {
            await _emailSender.SendEmailAsync(recipientEmails, subject, body, isHtml: true, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Virheilmoituksen lähetys ylläpitäjille epäonnistui.");
        }
    }

    /// <summary>
    /// Hakee tietokannasta kaikkien aktiivisten Admin- ja SuperAdmin-käyttäjien sähköpostiosoitteet.
    /// Mikäli tietokantaan ei saada yhteyttä tai käyttäjiä ei löydy, käytetään konfiguroitua varaosoitetta.
    /// </summary>
    private async Task<List<string>> ResolveAdminRecipientsAsync(CancellationToken cancellationToken)
    {
        HashSet<string> recipients = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        try
        {
            IReadOnlyList<User> users = await _userRepository.GetAllAsync(cancellationToken);
            DateTimeOffset now = _dateTimeProvider.UtcNow;

            foreach (User user in users)
            {
                if (user.IsAdmin && !user.IsBanned(now))
                {
                    if (!string.IsNullOrWhiteSpace(user.Email.Value))
                    {
                        recipients.Add(user.Email.Value);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Admin-sähköpostien haku tietokannasta epäonnistui virheilmoituksen yhteydessä. Käytetään konfiguroitua varasähköpostia.");
        }

        if (recipients.Count == 0)
        {
            string? fallbackEmail = _configuration["Alerts:AdminEmail"]
                ?? _configuration["Smtp:AdminEmail"]
                ?? _configuration["Smtp:FromEmail"];

            if (!string.IsNullOrWhiteSpace(fallbackEmail))
            {
                recipients.Add(fallbackEmail);
            }
        }

        return recipients.ToList();
    }

    /// <summary>
    /// Muodostaa rakenteisen HTML-virheraportin sähköpostiviestin leipätekstiksi.
    /// </summary>
    private static string BuildErrorEmailBody(
        Exception exception,
        string? path,
        string? traceId,
        DateTimeOffset timestampUtc)
    {
        StringBuilder sb = new StringBuilder();
        sb.AppendLine("<!DOCTYPE html><html><head><meta charset='utf-8'>");
        sb.AppendLine("<style>");
        sb.AppendLine("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c10; color: #e5e7eb; padding: 20px; }");
        sb.AppendLine(".card { background-color: #1a1c23; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; max-width: 800px; margin: 0 auto; }");
        sb.AppendLine(".header { border-bottom: 2px solid #dc2626; padding-bottom: 12px; margin-bottom: 16px; }");
        sb.AppendLine(".title { color: #f87171; font-size: 20px; font-weight: bold; margin: 0; }");
        sb.AppendLine(".meta-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px; }");
        sb.AppendLine(".meta-table td { padding: 6px 10px; border-bottom: 1px solid #2d3139; }");
        sb.AppendLine(".meta-label { font-weight: bold; color: #9ca3af; width: 180px; }");
        sb.AppendLine(".meta-value { color: #f3f4f6; word-break: break-all; }");
        sb.AppendLine(".stack-trace { background-color: #111827; border: 1px solid #374151; border-radius: 6px; padding: 12px; font-family: Consolas, monospace; font-size: 12px; color: #fca5a5; overflow-x: auto; white-space: pre-wrap; }");
        sb.AppendLine(".footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }");
        sb.AppendLine("</style></head><body>");

        sb.AppendLine("<div class='card'>");
        sb.AppendLine("<div class='header'><h2 class='title'>🚨 Automaattinen järjestelmävirhehälytys</h2></div>");
        sb.AppendLine("<p>Xamk Game Room -varausjärjestelmän palvelimella on tapahtunut käsittelemätön poikkeus tai kriittinen virhetilanne.</p>");

        sb.AppendLine("<table class='meta-table'>");
        sb.AppendFormat(CultureInfo.InvariantCulture, "<tr><td class='meta-label'>Aikaleima (UTC):</td><td class='meta-value'>{0:yyyy-MM-dd HH:mm:ss} UTC</td></tr>", timestampUtc);
        sb.AppendFormat(CultureInfo.InvariantCulture, "<tr><td class='meta-label'>Poikkeuksen tyyppi:</td><td class='meta-value'><code>{0}</code></td></tr>", System.Net.WebUtility.HtmlEncode(exception.GetType().FullName ?? exception.GetType().Name));
        sb.AppendFormat(CultureInfo.InvariantCulture, "<tr><td class='meta-label'>Virheviesti:</td><td class='meta-value'><strong>{0}</strong></td></tr>", System.Net.WebUtility.HtmlEncode(exception.Message));

        if (!string.IsNullOrWhiteSpace(path))
        {
            sb.AppendFormat(CultureInfo.InvariantCulture, "<tr><td class='meta-label'>Pyynnön polku:</td><td class='meta-value'>{0}</td></tr>", System.Net.WebUtility.HtmlEncode(path));
        }

        if (!string.IsNullOrWhiteSpace(traceId))
        {
            sb.AppendFormat(CultureInfo.InvariantCulture, "<tr><td class='meta-label'>Trace ID:</td><td class='meta-value'><code>{0}</code></td></tr>", System.Net.WebUtility.HtmlEncode(traceId));
        }

        sb.AppendFormat(CultureInfo.InvariantCulture, "<tr><td class='meta-label'>Palvelimen isäntäkone:</td><td class='meta-value'>{0} ({1})</td></tr>", System.Net.WebUtility.HtmlEncode(Environment.MachineName), System.Net.WebUtility.HtmlEncode(Environment.OSVersion.ToString()));
        sb.AppendLine("</table>");

        sb.AppendLine("<h3 style='color: #fca5a5; font-size: 14px; margin-top: 16px; margin-bottom: 8px;'>Pinojälki (Stack Trace):</h3>");
        sb.AppendFormat(CultureInfo.InvariantCulture, "<div class='stack-trace'>{0}</div>", System.Net.WebUtility.HtmlEncode(exception.ToString()));

        if (exception.InnerException is not null)
        {
            sb.AppendLine("<h3 style='color: #fca5a5; font-size: 14px; margin-top: 16px; margin-bottom: 8px;'>Sisäinen poikkeus (Inner Exception):</h3>");
            sb.AppendFormat(CultureInfo.InvariantCulture, "<div class='stack-trace'>{0}</div>", System.Net.WebUtility.HtmlEncode(exception.InnerException.ToString()));
        }

        sb.AppendLine("<div class='footer'>Tämä viesti on generoitu automaattisesti Xamk Game Room -taustajärjestelmästä.</div>");
        sb.AppendLine("</div></body></html>");

        return sb.ToString();
    }
}
