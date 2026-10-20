namespace Pelihuone.Domain.ValueObjects;

public readonly record struct GameId(Guid Value)
{
    public static GameId New() => new(Guid.NewGuid());
    public static GameId Empty => new(Guid.Empty);

    public override string ToString() => Value.ToString();
}
