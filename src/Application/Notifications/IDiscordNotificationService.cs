namespace Pelihuone.Application.Notifications;

public interface IDiscordNotificationService
{
    Task SendEventNotificationAsync(
        string eventTitle,
        string description,
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        string organizer,
        CancellationToken cancellationToken = default);

    Task SendIssueReportNotificationAsync(
        string target,
        string title,
        string description,
        string reporterEmail,
        string reporterName,
        CancellationToken cancellationToken = default);
}
