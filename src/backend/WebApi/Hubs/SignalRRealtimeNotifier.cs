using Microsoft.AspNetCore.SignalR;
using Pelihuone.Application.Abstractions.Notifications;

namespace Pelihuone.WebApi.Hubs;

/// <summary>
/// SignalR-pohjainen toteutus <see cref="IRealtimeNotifier"/>-rajapinnalle, joka välittää tilamuutosilmoitukset kaikille yhdistetyille asiakasohjelmille.
/// </summary>
public sealed class SignalRRealtimeNotifier : IRealtimeNotifier
{
    private readonly IHubContext<GameRoomHub> _hubContext;

    /// <summary>
    /// Alustaa uuden <see cref="SignalRRealtimeNotifier"/>-instanssin annetulla SignalR-keskittimen kontekstilla.
    /// </summary>
    /// <param name="hubContext">SignalR-keskittimen konteksti viestien lähettämiseen yhdistetyille asiakasohjelmille.</param>
    public SignalRRealtimeNotifier(IHubContext<GameRoomHub> hubContext)
    {
        _hubContext = hubContext;
    }

    /// <inheritdoc />
    public Task NotifyReservationChangedAsync(CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.All.SendAsync("ReservationChanged", cancellationToken);
    }

    /// <inheritdoc />
    public Task NotifyStationStatusChangedAsync(CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.All.SendAsync("StationStatusChanged", cancellationToken);
    }

    /// <inheritdoc />
    public Task NotifySettingsChangedAsync(CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.All.SendAsync("SettingsChanged", cancellationToken);
    }

    /// <inheritdoc />
    public Task NotifyIssueReportChangedAsync(CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.All.SendAsync("IssueReportChanged", cancellationToken);
    }

    /// <inheritdoc />
    public Task NotifyNewsChangedAsync(CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.All.SendAsync("NewsChanged", cancellationToken);
    }

    /// <inheritdoc />
    public Task NotifyGamesChangedAsync(CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.All.SendAsync("GamesChanged", cancellationToken);
    }
}
