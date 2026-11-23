using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Reservations;

namespace Pelihuone.Application.Features.Reservations.Commands;

/// <summary>
/// Komento olemassa olevien varausten jyräämiseen ja tapahtumavarauksen luomiseen (SuperAdmin).
/// </summary>
/// <param name="Request">Tapahtumavarauksen luontipyynnön tiedot.</param>
/// <param name="OverrideReason">Perustelu päällekkäisten varausten jyräämiselle.</param>
public sealed record OverrideReservationCommand(CreateReservationRequest Request, string OverrideReason)
    : IRequest<Result<ReservationResponse>>;

/// <summary>
/// Käsittelijä <see cref="OverrideReservationCommand"/>-komennolle.
/// </summary>
public sealed class OverrideReservationCommandHandler
    : IRequestHandler<OverrideReservationCommand, Result<ReservationResponse>>
{
    private readonly IReservationService _reservationService;
    private readonly ICacheService _cacheService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="OverrideReservationCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="reservationService">Varauspalvelu tapahtumavarauksen jyräyslogiikkaan.</param>
    /// <param name="cacheService">Välimuistipalvelu tilastojen invalidoimiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin varaustilanteen muutoksen välittämiseen.</param>
    public OverrideReservationCommandHandler(
        IReservationService reservationService,
        ICacheService cacheService,
        IRealtimeNotifier realtimeNotifier)
    {
        _reservationService = reservationService;
        _cacheService = cacheService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Jyrää päällekkäiset varaukset, luo tapahtumavarauksen, invalidoi tilastot ja ilmoittaa muutoksesta reaaliajassa.
    /// </summary>
    /// <param name="request">Tapahtumavarauksen jyräyskomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Luotu tapahtumavaraus tai virhetulos.</returns>
    public async Task<Result<ReservationResponse>> Handle(
        OverrideReservationCommand request,
        CancellationToken cancellationToken)
    {
        Result<ReservationResponse> result = await _reservationService.OverrideAndCreateEventAsync(
            request.Request,
            request.OverrideReason,
            cancellationToken);

        if (result.IsSuccess)
        {
            await _cacheService.RemoveByTagAsync(CacheTags.Statistics, cancellationToken);
            await _realtimeNotifier.NotifyReservationChangedAsync(cancellationToken);
        }

        return result;
    }
}
