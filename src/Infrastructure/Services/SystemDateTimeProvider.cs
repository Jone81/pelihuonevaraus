using Pelihuone.Application.Abstractions.Time;

namespace Pelihuone.Infrastructure.Services;

public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    private readonly TimeProvider _timeProvider;

    public SystemDateTimeProvider(TimeProvider timeProvider)
    {
        _timeProvider = timeProvider;
    }

    public DateTimeOffset UtcNow => _timeProvider.GetUtcNow();
}
