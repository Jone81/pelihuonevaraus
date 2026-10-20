namespace Pelihuone.Domain.ValueObjects;

public readonly record struct GamingStationId(Guid Value)
{
    public static GamingStationId New() => new(Guid.NewGuid());
    public static GamingStationId Empty => new(Guid.Empty);

    public override string ToString() => Value.ToString();
}
