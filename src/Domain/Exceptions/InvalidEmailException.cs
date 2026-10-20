using Pelihuone.Domain.Common;

namespace Pelihuone.Domain.Exceptions;

public class InvalidEmailException : DomainException
{
    public InvalidEmailException(string message) : base(message)
    {
    }
}
