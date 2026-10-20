namespace Pelihuone.Domain.ValueObjects;

public readonly record struct ReservationId(Guid Value)
{
    public static ReservationId New() => new(Guid.NewGuid());
    public static ReservationId Empty => new(Guid.Empty);

    public override string ToString() => Value.ToString();
}
