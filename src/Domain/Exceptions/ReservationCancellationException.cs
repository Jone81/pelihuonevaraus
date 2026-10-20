using Pelihuone.Domain.Common;

namespace Pelihuone.Domain.Exceptions;

public class ReservationCancellationException : DomainException
{
    public ReservationCancellationException(string message) : base(message)
    {
    }
}
