using Pelihuone.Domain.Common;

namespace Pelihuone.Domain.Exceptions;

public class InvalidReservationTimeException : DomainException
{
    public InvalidReservationTimeException(string message) : base(message)
    {
    }
}
