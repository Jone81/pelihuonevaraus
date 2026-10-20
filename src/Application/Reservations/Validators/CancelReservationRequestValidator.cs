using FluentValidation;
using Pelihuone.Contracts.Reservations;

namespace Pelihuone.Application.Reservations.Validators;

public sealed class CancelReservationRequestValidator : AbstractValidator<CancelReservationRequest>
{
    public CancelReservationRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId on pakollinen.");
    }
}
