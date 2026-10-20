namespace Pelihuone.Domain.ValueObjects;

public readonly record struct GameRoomId(Guid Value)
{
    public static GameRoomId New() => new(Guid.NewGuid());
    public static GameRoomId Empty => new(Guid.Empty);

    public override string ToString() => Value.ToString();
}
