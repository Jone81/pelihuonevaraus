namespace Pelihuone.Contracts.Settings;

/// <summary>
/// Vastausmalli, joka sisältää sivuston ja varausjärjestelmän yleiset asetukset sekä kiintiösäännöt.
/// </summary>
/// <param name="DiscordWebhookUrl">Määritetty Discord-webhook-osoite ilmoituksia varten.</param>
/// <param name="OpeningHoursText">Aukioloaikojen esitysteksti käyttöliittymää varten.</param>
/// <param name="OpenTimeHour">Päivittäinen avaamiskellonaika täysinä tunteina (0–23).</param>
/// <param name="CloseTimeHour">Päivittäinen sulkemiskellonaika täysinä tunteina (1–24).</param>
/// <param name="OnlyWeekdays">Ilmaisee, onko pelitila avoinna vain arkisin (ma–pe) vai myös viikonloppuisin (ma–su).</param>
/// <param name="MaxAdvanceBookingMonths">Ennakkovarauksen enimmäisaika kuukausina.</param>
/// <param name="MaxIndividualHours">Yksittäisvarauksen ja opiskelijan päiväkiintiön enimmäiskesto tunteina.</param>
/// <param name="MaxStudentRoomHours">Opiskelijan tilavarauksen enimmäiskesto tunteina.</param>
/// <param name="MinReservationMinutes">Varauksen vähimmäiskesto minuutteina (esim. 30 tai 60).</param>
/// <param name="EnforceSharedTvLock">Valvotaanko konsolien (PS5 ja Switch) yhteisen television rinnakkaislukkoa.</param>
/// <param name="IsMaintenanceMode">Ilmaisee, onko pelihuone asetettu tilapäiseen huoltotilaan (estää uudet opiskelijavaraukset).</param>
/// <param name="MaintenanceMessage">Käyttäjille näytettävä tiedote huoltokatkon syystä.</param>
public sealed record SiteSettingsResponse(
    string DiscordWebhookUrl,
    string OpeningHoursText,
    int OpenTimeHour,
    int CloseTimeHour,
    bool OnlyWeekdays,
    int MaxAdvanceBookingMonths,
    int MaxIndividualHours,
    int MaxStudentRoomHours,
    int MinReservationMinutes = 30,
    bool EnforceSharedTvLock = true,
    bool IsMaintenanceMode = false,
    string MaintenanceMessage = "");

/// <summary>
/// Pyynnön tietomalli järjestelmän asetusten ja kiintiösääntöjen päivittämiseksi ylläpitonäkymästä.
/// </summary>
/// <param name="DiscordWebhookUrl">Uusi Discord-webhook-osoite tai tyhjä arvo ilmoitusten poistamiseksi käytöstä.</param>
/// <param name="OpenTimeHour">Valinnainen uusi avaamiskellonaika täysinä tunteina (0–23).</param>
/// <param name="CloseTimeHour">Valinnainen uusi sulkemiskellonaika täysinä tunteina (1–24).</param>
/// <param name="OnlyWeekdays">Valinnainen asetus sille, onko tila avoinna vain arkisin (ma–pe).</param>
/// <param name="MaxAdvanceBookingMonths">Valinnainen ennakkovarauksen enimmäisaika kuukausina.</param>
/// <param name="MaxIndividualHours">Valinnainen yksittäisvarauksen ja päiväkiintiön enimmäiskesto tunteina.</param>
/// <param name="MaxStudentRoomHours">Valinnainen opiskelijan tilavarauksen enimmäiskesto tunteina.</param>
/// <param name="MinReservationMinutes">Valinnainen varauksen vähimmäiskesto minuutteina.</param>
/// <param name="EnforceSharedTvLock">Valinnainen asetus konsolien yhteisen television rinnakkaislukolle.</param>
/// <param name="IsMaintenanceMode">Valinnainen asetus pelihuoneen tilapäiselle huoltotilalle.</param>
/// <param name="MaintenanceMessage">Valinnainen huoltotiedotteen teksti.</param>
public sealed record UpdateSiteSettingsRequest(
    string? DiscordWebhookUrl = null,
    int? OpenTimeHour = null,
    int? CloseTimeHour = null,
    bool? OnlyWeekdays = null,
    int? MaxAdvanceBookingMonths = null,
    int? MaxIndividualHours = null,
    int? MaxStudentRoomHours = null,
    int? MinReservationMinutes = null,
    bool? EnforceSharedTvLock = null,
    bool? IsMaintenanceMode = null,
    string? MaintenanceMessage = null);
