using System.Reflection;
using FluentValidation;
using FluentValidation.Results;
using MediatR;

namespace Pelihuone.Application.Common.Behaviors;

/// <summary>
/// MediatR-putken validointikäyttäytyminen, joka ajaa kaikki pyyntöön liitetyt FluentValidation-validaattorit
/// ja palauttaa validointivirheet <see cref="Result"/>-mallilla ilman poikkeuksia.
/// </summary>
/// <typeparam name="TRequest">Käsiteltävän MediatR-pyynnön tyyppi.</typeparam>
/// <typeparam name="TResponse">Pyynnön paluuarvon tyyppi.</typeparam>
public sealed class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    /// <summary>
    /// Alustaa uuden <see cref="ValidationBehavior{TRequest, TResponse}"/>-instanssin.
    /// </summary>
    /// <param name="validators">Pyyntötyypille rekisteröidyt FluentValidation-validaattorit.</param>
    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    /// <summary>
    /// Validoi pyynnön ennen käsittelijän kutsumista ja palauttaa epäonnistuneen tuloksen, jos virheitä löytyy.
    /// </summary>
    /// <param name="request">Käsiteltävä pyyntö.</param>
    /// <param name="next">Putken seuraava käsittelijä.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Käsittelijän palauttama vastaus tai validointivirheen sisältävä <see cref="Result"/>.</returns>
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
        {
            return await next();
        }

        ValidationContext<TRequest> context = new(request);
        ValidationResult[] validationResults = await Task.WhenAll(
            _validators.Select(validator => validator.ValidateAsync(context, cancellationToken)));

        List<ValidationFailure> failures = validationResults
            .SelectMany(result => result.Errors)
            .Where(failure => failure is not null)
            .ToList();

        if (failures.Count == 0)
        {
            return await next();
        }

        string combinedMessage = string.Join(
            " ",
            failures.Select(failure => failure.ErrorMessage).Distinct());

        Error validationError = Error.Validation("Validation.Failed", combinedMessage);

        return CreateFailureResponse(validationError, failures);
    }

    private static TResponse CreateFailureResponse(Error validationError, List<ValidationFailure> failures)
    {
        Type responseType = typeof(TResponse);

        if (responseType == typeof(Result))
        {
            return (TResponse)(object)Result.Failure(validationError);
        }

        if (responseType.IsGenericType && responseType.GetGenericTypeDefinition() == typeof(Result<>))
        {
            Type valueType = responseType.GetGenericArguments()[0];
            MethodInfo failureMethod = typeof(Result)
                .GetMethods(BindingFlags.Public | BindingFlags.Static)
                .First(method => method.Name == nameof(Result.Failure) && method.IsGenericMethodDefinition);

            MethodInfo genericFailureMethod = failureMethod.MakeGenericMethod(valueType);
            object failureResult = genericFailureMethod.Invoke(null, [validationError])!;
            return (TResponse)failureResult;
        }

        throw new ValidationException(failures);
    }
}
