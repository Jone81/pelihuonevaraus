namespace Pelihuone.Application.Notifications;

/// <summary>
/// Rajapinta järjestelmän vakavien virheiden, käsittelemättömien poikkeusten ja kaatumisten
/// automaattiseen hälytysviestintään ylläpitäjien (Admin ja SuperAdmin) sähköposteihin.
/// </summary>
public interface IErrorNotificationService
{
    /// <summary>
    /// Lähettää automaattisen virheraportin ja pinojäljen ylläpitäjien sähköpostiosoitteisiin.
    /// </summary>
    /// <param name="exception">Syntynyt käsittelemätön poikkeus.</param>
    /// <param name="path">HTTP-pyynnön osoitepolku tai suorituskonteksti (valinnainen).</param>
    /// <param name="traceId">Jäljitystunniste (Trace ID) pyynnön yhdistämiseen lokitietoihin.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkroniselle operaatiolle.</param>
    Task SendErrorAlertAsync(
        Exception exception,
        string? path = null,
        string? traceId = null,
        CancellationToken cancellationToken = default);
}
