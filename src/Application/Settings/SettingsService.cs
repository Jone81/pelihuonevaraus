using System.Globalization;
using System.IO;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Settings;

namespace Pelihuone.Application.Settings;

/// <summary>
/// Toteuttaa sivustoasetusten, aukioloaikojen, varauskiintiöiden ja huoltotilan hallinnan sekä pysyväistallennuksen JSON-tiedostoon.
/// </summary>
public sealed class SettingsService : ISettingsService
{
    private static readonly string SettingsFilePath = Path.Combine(AppContext.BaseDirectory, "site_settings.json");
    private static readonly JsonSerializerOptions IndentedJsonOptions = new() { WriteIndented = true };
    private static readonly object SyncLock = new();

    private static string _discordWebhookUrl = string.Empty;
    private static int _openTimeHour = 8;
    private static int _closeTimeHour = 18;
    private static bool _onlyWeekdays = true;
    private static int _maxAdvanceBookingMonths = 2;
    private static int _maxIndividualHours = 4;
    private static int _maxStudentRoomHours = 4;
    private static int _minReservationMinutes = 30;
    private static bool _enforceSharedTvLock = true;
    private static bool _isMaintenanceMode;
    private static string _maintenanceMessage = string.Empty;

    private readonly ILogger<SettingsService> _logger;

    /// <summary>
    /// Alustaa uuden <see cref="SettingsService"/>-instanssin ja lataa mahdolliset tallennetut asetukset levyltä.
    /// </summary>
    /// <param name="logger">Lokituspalvelu tapahtumien ja virheiden kirjaamiseen.</param>
    public SettingsService(ILogger<SettingsService> logger)
    {
        _logger = logger;
        LoadFromDisk();
    }

    /// <summary>
    /// Palauttaa nykyiset sivustoasetukset, aukioloajat, varausrajoitukset ja huoltotilan tiedot.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Onnistunut tulos, joka sisältää voimassa olevan <see cref="SiteSettingsResponse"/>-asetusmallin.</returns>
    public Task<Result<SiteSettingsResponse>> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        lock (SyncLock)
        {
            return Task.FromResult(Result.Success(BuildResponse()));
        }
    }

    /// <summary>
    /// Päivittää sivustoasetukset ja varauskiintiöt muistiin sekä tallentaa ne JSON-tiedostoon.
    /// </summary>
    /// <param name="request">Päivitettävät asetustiedot sisältävä pyyntö.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Onnistunut tulos päivitetyillä asetuksilla tai validointivirhe virheellisillä raja-arvoilla.</returns>
    public Task<Result<SiteSettingsResponse>> UpdateSettingsAsync(
        UpdateSiteSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        lock (SyncLock)
        {
            // Tarkistetaan ja päivitetään aukioloajat, jos ne ovat mukana pyynnössä
            int nextOpenHour = request.OpenTimeHour ?? _openTimeHour;
            int nextCloseHour = request.CloseTimeHour ?? _closeTimeHour;

            if (nextOpenHour is < 0 or > 23)
            {
                return Task.FromResult(Result.Failure<SiteSettingsResponse>(
                    Error.Validation("Settings.InvalidOpenHour", "Avaamisajan on oltava välillä 00:00–23:00.")));
            }

            if (nextCloseHour is < 1 or > 24 || nextCloseHour <= nextOpenHour)
            {
                return Task.FromResult(Result.Failure<SiteSettingsResponse>(
                    Error.Validation("Settings.InvalidCloseHour", "Sulkemisajan on oltava avaamisajan jälkeen (välillä 01:00–24:00).")));
            }

            // Tarkistetaan ennakkovarausraja (1–12 kuukautta)
            int nextAdvanceMonths = request.MaxAdvanceBookingMonths ?? _maxAdvanceBookingMonths;
            if (nextAdvanceMonths is < 1 or > 12)
            {
                return Task.FromResult(Result.Failure<SiteSettingsResponse>(
                    Error.Validation("Settings.InvalidAdvanceMonths", "Ennakkovarausrajan on oltava välillä 1–12 kuukautta.")));
            }

            // Tarkistetaan yksittäisvarauksen enimmäiskesto (1–12 tuntia)
            int nextIndividualHours = request.MaxIndividualHours ?? _maxIndividualHours;
            if (nextIndividualHours is < 1 or > 12)
            {
                return Task.FromResult(Result.Failure<SiteSettingsResponse>(
                    Error.Validation("Settings.InvalidIndividualHours", "Yksittäisvarauksen enimmäiskeston on oltava välillä 1–12 tuntia.")));
            }

            // Tarkistetaan opiskelijan tilavarauksen enimmäiskesto (1–12 tuntia)
            int nextRoomHours = request.MaxStudentRoomHours ?? _maxStudentRoomHours;
            if (nextRoomHours is < 1 or > 12)
            {
                return Task.FromResult(Result.Failure<SiteSettingsResponse>(
                    Error.Validation("Settings.InvalidRoomHours", "Opiskelijan tilavarauksen enimmäiskeston on oltava välillä 1–12 tuntia.")));
            }

            // Tarkistetaan vähimmäiskesto (15–240 minuuttia)
            int nextMinMinutes = request.MinReservationMinutes ?? _minReservationMinutes;
            if (nextMinMinutes is < 15 or > 240)
            {
                return Task.FromResult(Result.Failure<SiteSettingsResponse>(
                    Error.Validation("Settings.InvalidMinMinutes", "Varauksen vähimmäiskeston on oltava välillä 15–240 minuuttia.")));
            }

            // Päivitetään kentät, jotka on annettu pyynnössä
            if (request.DiscordWebhookUrl is not null)
            {
                _discordWebhookUrl = request.DiscordWebhookUrl.Trim();
            }

            _openTimeHour = nextOpenHour;
            _closeTimeHour = nextCloseHour;

            if (request.OnlyWeekdays.HasValue)
            {
                _onlyWeekdays = request.OnlyWeekdays.Value;
            }

            _maxAdvanceBookingMonths = nextAdvanceMonths;
            _maxIndividualHours = nextIndividualHours;
            _maxStudentRoomHours = nextRoomHours;
            _minReservationMinutes = nextMinMinutes;

            if (request.EnforceSharedTvLock.HasValue)
            {
                _enforceSharedTvLock = request.EnforceSharedTvLock.Value;
            }

            if (request.IsMaintenanceMode.HasValue)
            {
                _isMaintenanceMode = request.IsMaintenanceMode.Value;
            }

            if (request.MaintenanceMessage is not null)
            {
                _maintenanceMessage = request.MaintenanceMessage.Trim();
            }

            SaveToDisk();

            _logger.LogInformation(
                "Sivustoasetukset päivitetty: Aukiolo={Open}:00-{Close}:00, MaxIndividual={Ind}h, MaxRoom={Room}h, Maintenance={Maint}",
                _openTimeHour,
                _closeTimeHour,
                _maxIndividualHours,
                _maxStudentRoomHours,
                _isMaintenanceMode);

            return Task.FromResult(Result.Success(BuildResponse()));
        }
    }

    private static SiteSettingsResponse BuildResponse()
    {
        string daysLabel = _onlyWeekdays ? "Ma–Pe" : "Ma–Su";
        string openingHoursText = string.Format(
            CultureInfo.InvariantCulture,
            "{0:D2}:00 – {1:D2}:00 ({2})",
            _openTimeHour,
            _closeTimeHour,
            daysLabel);

        return new SiteSettingsResponse(
            DiscordWebhookUrl: _discordWebhookUrl,
            OpeningHoursText: openingHoursText,
            OpenTimeHour: _openTimeHour,
            CloseTimeHour: _closeTimeHour,
            OnlyWeekdays: _onlyWeekdays,
            MaxAdvanceBookingMonths: _maxAdvanceBookingMonths,
            MaxIndividualHours: _maxIndividualHours,
            MaxStudentRoomHours: _maxStudentRoomHours,
            MinReservationMinutes: _minReservationMinutes,
            EnforceSharedTvLock: _enforceSharedTvLock,
            IsMaintenanceMode: _isMaintenanceMode,
            MaintenanceMessage: _maintenanceMessage);
    }

    private void LoadFromDisk()
    {
        lock (SyncLock)
        {
            try
            {
                if (!File.Exists(SettingsFilePath))
                {
                    return;
                }

                string content = File.ReadAllText(SettingsFilePath);
                using JsonDocument doc = JsonDocument.Parse(content);
                JsonElement root = doc.RootElement;

                if (root.TryGetProperty("discordWebhookUrl", out JsonElement webhookProp))
                {
                    _discordWebhookUrl = webhookProp.GetString() ?? string.Empty;
                }

                if (root.TryGetProperty("openTimeHour", out JsonElement openProp) && openProp.TryGetInt32(out int openH))
                {
                    _openTimeHour = Math.Clamp(openH, 0, 23);
                }

                if (root.TryGetProperty("closeTimeHour", out JsonElement closeProp) && closeProp.TryGetInt32(out int closeH))
                {
                    _closeTimeHour = Math.Clamp(closeH, Math.Min(24, _openTimeHour + 1), 24);
                }

                if (root.TryGetProperty("onlyWeekdays", out JsonElement weekdaysProp) &&
                    weekdaysProp.ValueKind is JsonValueKind.True or JsonValueKind.False)
                {
                    _onlyWeekdays = weekdaysProp.GetBoolean();
                }

                if (root.TryGetProperty("maxAdvanceBookingMonths", out JsonElement advProp) && advProp.TryGetInt32(out int advM))
                {
                    _maxAdvanceBookingMonths = Math.Clamp(advM, 1, 12);
                }

                if (root.TryGetProperty("maxIndividualHours", out JsonElement indProp) && indProp.TryGetInt32(out int indH))
                {
                    _maxIndividualHours = Math.Clamp(indH, 1, 12);
                }

                if (root.TryGetProperty("maxStudentRoomHours", out JsonElement roomProp) && roomProp.TryGetInt32(out int roomH))
                {
                    _maxStudentRoomHours = Math.Clamp(roomH, 1, 12);
                }

                if (root.TryGetProperty("minReservationMinutes", out JsonElement minProp) && minProp.TryGetInt32(out int minM))
                {
                    _minReservationMinutes = Math.Clamp(minM, 15, 240);
                }

                if (root.TryGetProperty("enforceSharedTvLock", out JsonElement tvProp) &&
                    tvProp.ValueKind is JsonValueKind.True or JsonValueKind.False)
                {
                    _enforceSharedTvLock = tvProp.GetBoolean();
                }

                if (root.TryGetProperty("isMaintenanceMode", out JsonElement maintProp) &&
                    maintProp.ValueKind is JsonValueKind.True or JsonValueKind.False)
                {
                    _isMaintenanceMode = maintProp.GetBoolean();
                }

                if (root.TryGetProperty("maintenanceMessage", out JsonElement msgProp))
                {
                    _maintenanceMessage = msgProp.GetString() ?? string.Empty;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Virhe luettaessa sivustoasetuksia tiedostosta.");
            }
        }
    }

    private void SaveToDisk()
    {
        try
        {
            Dictionary<string, object> payload = new()
            {
                ["discordWebhookUrl"] = _discordWebhookUrl,
                ["openTimeHour"] = _openTimeHour,
                ["closeTimeHour"] = _closeTimeHour,
                ["onlyWeekdays"] = _onlyWeekdays,
                ["maxAdvanceBookingMonths"] = _maxAdvanceBookingMonths,
                ["maxIndividualHours"] = _maxIndividualHours,
                ["maxStudentRoomHours"] = _maxStudentRoomHours,
                ["minReservationMinutes"] = _minReservationMinutes,
                ["enforceSharedTvLock"] = _enforceSharedTvLock,
                ["isMaintenanceMode"] = _isMaintenanceMode,
                ["maintenanceMessage"] = _maintenanceMessage
            };

            string json = JsonSerializer.Serialize(payload, IndentedJsonOptions);
            File.WriteAllText(SettingsFilePath, json);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Virhe tallennettaessa sivustoasetuksia tiedostoon.");
        }
    }
}
