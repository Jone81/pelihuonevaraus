namespace Pelihuone.Contracts.Settings;

/// <summary>
/// Vastausmalli, joka sisältää sivuston ja varausjärjestelmän yleiset asetukset.
/// </summary>
/// <param name="DiscordWebhookUrl">Määritetty Discord-webhook-osoite ilmoituksia varten.</param>
/// <param name="OpeningHoursText">Aukioloaikojen esitysteksti käyttöliittymää varten.</param>
/// <param name="MaxAdvanceBookingMonths">Ennakkovarauksen enimmäisaika kuukausina.</param>
/// <param name="MaxIndividualHours">Yksittäisvarauksen enimmäiskesto tunteina.</param>
/// <param name="MaxStudentRoomHours">Opiskelijan tilavarauksen enimmäiskesto tunteina.</param>
public sealed record SiteSettingsResponse(
    string DiscordWebhookUrl,
    string OpeningHoursText,
    int MaxAdvanceBookingMonths,
    int MaxIndividualHours,
    int MaxStudentRoomHours);

/// <summary>
/// Pyynnön tietomalli järjestelmän asetusten päivittämiseksi ylläpitonäkymästä.
/// </summary>
/// <param name="DiscordWebhookUrl">Uusi Discord-webhook-osoite tai tyhjä arvo ilmoitusten poistamiseksi käytöstä.</param>
public sealed record UpdateSiteSettingsRequest(
    string? DiscordWebhookUrl);
