using FluentValidation;
using Pelihuone.Contracts.Reservations;

namespace Pelihuone.Application.Reservations.Validators;

/// <summary>
/// Validaattori varauksen peruutuspyynnölle (<see cref="CancelReservationRequest"/>).
/// </summary>
public sealed class CancelReservationRequestValidator : AbstractValidator<CancelReservationRequest>
{
    /// <summary>
    /// Alustaa peruutuspyynnön validointisäännöt.
    /// </summary>
    public CancelReservationRequestValidator()
    {
        // Peruuttajan käyttäjätunniste on aina oltava annettu
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId on pakollinen.");
    }
}
