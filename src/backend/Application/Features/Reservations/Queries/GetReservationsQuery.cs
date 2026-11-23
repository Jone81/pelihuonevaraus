using MediatR;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Reservations;

namespace Pelihuone.Application.Features.Reservations.Queries;

/// <summary>
/// Kysely kaikkien annetulle aikavälille osuvien aktiivisten varausten hakemiseen. Ei käytä välimuistia reaaliaikaisuuden takaamiseksi.
/// </summary>
/// <param name="StartUtc">Haettavan aikavälin alkuaika UTC-muodossa.</param>
/// <param name="EndUtc">Haettavan aikavälin loppuaika UTC-muodossa.</param>
public sealed record GetReservationsQuery(DateTimeOffset StartUtc, DateTimeOffset EndUtc)
    : IRequest<Result<IReadOnlyList<ReservationResponse>>>;

/// <summary>
/// Käsittelijä <see cref="GetReservationsQuery"/>-kyselylle.
/// </summary>
public sealed class GetReservationsQueryHandler
    : IRequestHandler<GetReservationsQuery, Result<IReadOnlyList<ReservationResponse>>>
{
    private readonly IReservationService _reservationService;

    /// <summary>
    /// Alustaa uuden <see cref="GetReservationsQueryHandler"/>-instanssin.
    /// </summary>
    /// <param name="reservationService">Varauspalvelu aktiivisten varausten hakemiseen.</param>
    public GetReservationsQueryHandler(IReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    /// <summary>
    /// Hakee annetulle aikavälille osuvat aktiiviset varaukset.
    /// </summary>
    /// <param name="request">Varaushakukysely.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Lista aktiivisista varauksista tai virhetulos.</returns>
    public Task<Result<IReadOnlyList<ReservationResponse>>> Handle(
        GetReservationsQuery request,
        CancellationToken cancellationToken)
    {
        return _reservationService.GetActiveReservationsAsync(
            request.StartUtc,
            request.EndUtc,
            cancellationToken);
    }
}
