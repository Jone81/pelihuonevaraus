namespace Pelihuone.Application.Abstractions.Notifications;

/// <summary>
/// Kehysriippumaton rajapinta reaaliaikaisten tilamuutosilmoitusten lähettämiseen asiakasohjelmille.
/// </summary>
public interface IRealtimeNotifier
{
    /// <summary>
    /// Ilmoittaa asiakasohjelmille, että varaustilanne on muuttunut.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Asynkroninen tehtävä, joka kuvaa ilmoituksen lähettämistä.</returns>
    Task NotifyReservationChangedAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Ilmoittaa asiakasohjelmille, että pelipisteen tila tai tiedot ovat muuttuneet.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Asynkroninen tehtävä, joka kuvaa ilmoituksen lähettämistä.</returns>
    Task NotifyStationStatusChangedAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Ilmoittaa asiakasohjelmille, että sivuston asetukset ovat muuttuneet.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Asynkroninen tehtävä, joka kuvaa ilmoituksen lähettämistä.</returns>
    Task NotifySettingsChangedAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Ilmoittaa asiakasohjelmille, että vikailmoitusten tilanne on muuttunut.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Asynkroninen tehtävä, joka kuvaa ilmoituksen lähettämistä.</returns>
    Task NotifyIssueReportChangedAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Ilmoittaa asiakasohjelmille, että tiedotteet ovat muuttuneet.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Asynkroninen tehtävä, joka kuvaa ilmoituksen lähettämistä.</returns>
    Task NotifyNewsChangedAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Ilmoittaa asiakasohjelmille, että pelikirjasto on muuttunut.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Asynkroninen tehtävä, joka kuvaa ilmoituksen lähettämistä.</returns>
    Task NotifyGamesChangedAsync(CancellationToken cancellationToken = default);
}
