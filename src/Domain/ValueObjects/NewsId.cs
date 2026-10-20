namespace Pelihuone.Domain.ValueObjects;

public readonly record struct NewsId(Guid Value)
{
    public static NewsId New() => new(Guid.NewGuid());
    public static NewsId Empty => new(Guid.Empty);

    public override string ToString() => Value.ToString();

    public static implicit operator Guid(NewsId id) => id.Value;
}
