namespace Pelihuone.Application.Common;

public enum ErrorType
{
    Failure = 1,
    Validation = 2,
    NotFound = 3,
    Conflict = 4,
    Unauthorized = 5,
    Forbidden = 6
}

public sealed record Error(string Code, string Description, ErrorType Type = ErrorType.Failure)
{
    public static readonly Error None = new(string.Empty, string.Empty, ErrorType.Failure);
    public static readonly Error NullValue = new("Error.NullValue", "Null-arvo annettu.", ErrorType.Failure);

    public static Error Failure(string code, string description) => new(code, description, ErrorType.Failure);
    public static Error Validation(string code, string description) => new(code, description, ErrorType.Validation);
    public static Error NotFound(string code, string description) => new(code, description, ErrorType.NotFound);
    public static Error Conflict(string code, string description) => new(code, description, ErrorType.Conflict);
    public static Error Unauthorized(string code, string description) => new(code, description, ErrorType.Unauthorized);
    public static Error Forbidden(string code, string description) => new(code, description, ErrorType.Forbidden);
}
