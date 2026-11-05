namespace Pelihuone.Application.Notifications;

/// <summary>
/// Rajapinta reaaliaikaisten Discord-webhook-ilmoitusten lähettämiseen.
/// </summary>
public interface IDiscordNotificationService
{
    /// <summary>
    /// Lähettää ilmoituksen uudesta pelihuoneen tapahtumasta tai turnauksesta Discordiin.
    /// </summary>
    Task SendEventNotificationAsync(
        string eventTitle,
        string description,
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        string organizer,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lähettää ylläpidolle ilmoituksen uudesta vikailmoituksesta tai palautteesta Discordiin.
    /// </summary>
    Task SendIssueReportNotificationAsync(
        string target,
        string title,
        string description,
        string reporterEmail,
        string reporterName,
        CancellationToken cancellationToken = default);
}
