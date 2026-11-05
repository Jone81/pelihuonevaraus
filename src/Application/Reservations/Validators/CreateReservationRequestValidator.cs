using FluentValidation;
using Pelihuone.Contracts.Reservations;

namespace Pelihuone.Application.Reservations.Validators;

/// <summary>
/// Validaattori uuden varauksen luontipyynnölle (<see cref="CreateReservationRequest"/>).
/// </summary>
public sealed class CreateReservationRequestValidator : AbstractValidator<CreateReservationRequest>
{
    /// <summary>
    /// Alustaa varauspyynnön validointisäännöt.
    /// </summary>
    public CreateReservationRequestValidator()
    {
        // Idempotenssiavain estää vahingossa lähetetyt tuplavaraukset
        RuleFor(x => x.IdempotencyKey)
            .NotEmpty().WithMessage("IdempotencyKey on pakollinen kaksoiskutsujen estämiseksi.");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId on pakollinen.");

        RuleFor(x => x.ReservationType)
            .InclusiveBetween(1, 3).WithMessage("Tuntematon varaustyyppi (1=Individual, 2=Room, 3=Event).");

        // Yksittäisvarauksessa on aina ilmoitettava varattava pelipiste
        When(x => x.ReservationType == 1, () =>
        {
            RuleFor(x => x.GamingStationId)
                .NotNull().WithMessage("Yksittäisvaraukselle on määriteltävä pelipiste.")
                .NotEqual(Guid.Empty).WithMessage("Pelipisteen ID ei voi olla tyhjä.");
        });

        // Aikavälin perusrajoitteet: ei menneisyyteen eikä yli 2 kuukautta etukäteen
        RuleFor(x => x.StartUtc)
            .LessThan(x => x.EndUtc).WithMessage("Alkuajan on oltava ennen loppuaikaa.")
            .GreaterThan(DateTimeOffset.UtcNow.AddMinutes(-15)).WithMessage("Varausta ei voi tehdä menneisyyteen.")
            .LessThan(DateTimeOffset.UtcNow.AddMonths(2).AddDays(2)).WithMessage("Varauksen voi tehdä enintään 2 kuukautta etukäteen.");

        RuleFor(x => x.EndUtc - x.StartUtc)
            .GreaterThanOrEqualTo(TimeSpan.FromMinutes(30))
            .WithMessage("Varauksen vähimmäiskesto on 30 minuuttia.");

        // Yksittäisvaraus saa kestää korkeintaan 4 tuntia
        When(x => x.ReservationType == 1, () =>
        {
            RuleFor(x => x.EndUtc - x.StartUtc)
                .LessThanOrEqualTo(TimeSpan.FromHours(4))
                .WithMessage("Yksittäisvarauksen enimmäiskesto on 4 tuntia.");
        });

        // Tila- ja tapahtumavaraukset saavat kestää korkeintaan 10 tuntia
        When(x => x.ReservationType is 2 or 3, () =>
        {
            RuleFor(x => x.EndUtc - x.StartUtc)
                .LessThanOrEqualTo(TimeSpan.FromHours(10))
                .WithMessage("Tila- tai tapahtumavarauksen enimmäiskesto on 10 tuntia.");
        });
    }
}
