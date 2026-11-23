using MediatR;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Reservations;

namespace Pelihuone.Application.Features.Reservations.Queries;

/// <summary>
/// Kysely yksittäisen varauksen hakemiseen tunnisteen perusteella. Ei käytä välimuistia.
/// </summary>
/// <param name="ReservationId">Haettavan varauksen yksilöllinen tunniste.</param>
public sealed record GetReservationByIdQuery(Guid ReservationId)
    : IRequest<Result<ReservationResponse>>;

/// <summary>
/// Käsittelijä <see cref="GetReservationByIdQuery"/>-kyselylle.
/// </summary>
public sealed class GetReservationByIdQueryHandler
    : IRequestHandler<GetReservationByIdQuery, Result<ReservationResponse>>
{
    private readonly IReservationService _reservationService;

    /// <summary>
    /// Alustaa uuden <see cref="GetReservationByIdQueryHandler"/>-instanssin.
    /// </summary>
    /// <param name="reservationService">Varauspalvelu yksittäisen varauksen hakemiseen.</param>
    public GetReservationByIdQueryHandler(IReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    /// <summary>
    /// Hakee yksittäisen varauksen tunnisteen perusteella.
    /// </summary>
    /// <param name="request">Varaushakukysely.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Löydetty varaus tai virhetulos.</returns>
    public Task<Result<ReservationResponse>> Handle(
        GetReservationByIdQuery request,
        CancellationToken cancellationToken)
    {
        return _reservationService.GetByIdAsync(request.ReservationId, cancellationToken);
    }
}
