namespace Pelihuone.Contracts.Settings;

public sealed record SiteSettingsResponse(
    string DiscordWebhookUrl,
    string OpeningHoursText,
    int MaxAdvanceBookingMonths,
    int MaxIndividualHours,
    int MaxStudentRoomHours);

public sealed record UpdateSiteSettingsRequest(
    string? DiscordWebhookUrl);
