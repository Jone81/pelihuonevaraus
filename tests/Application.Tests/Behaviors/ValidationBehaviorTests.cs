using FluentValidation;
using MediatR;
using Pelihuone.Application.Common;
using Pelihuone.Application.Common.Behaviors;

namespace Pelihuone.Application.Tests.Behaviors;

/// <summary>
/// Yksikkötestit <see cref="ValidationBehavior{TRequest, TResponse}"/>-putkikäyttäytymiselle.
/// </summary>
public sealed class ValidationBehaviorTests
{
    /// <summary>
    /// Testikomento tyypitetyllä <see cref="Result{TValue}"/>-paluuarvolla.
    /// </summary>
    /// <param name="Name">Testikenttä validointia varten.</param>
    public sealed record TestTypedRequest(string Name) : IRequest<Result<string>>;

    /// <summary>
    /// Testikomento ei-geneerisellä <see cref="Result"/>-paluuarvolla.
    /// </summary>
    /// <param name="Name">Testikenttä validointia varten.</param>
    public sealed record TestUntypedRequest(string Name) : IRequest<Result>;

    private sealed class TestTypedRequestValidator : AbstractValidator<TestTypedRequest>
    {
        public TestTypedRequestValidator()
        {
            RuleFor(request => request.Name)
                .NotEmpty()
                .WithMessage("Nimi on pakollinen.");
        }
    }

    private sealed class TestUntypedRequestValidator : AbstractValidator<TestUntypedRequest>
    {
        public TestUntypedRequestValidator()
        {
            RuleFor(request => request.Name)
                .NotEmpty()
                .WithMessage("Nimi ei saa olla tyhjä.");
        }
    }

    /// <summary>
    /// Varmistaa, että kelvollinen pyyntö etenee käsittelijälle ja palauttaa onnistuneen tuloksen.
    /// </summary>
    [Fact]
    public async Task Handle_ValidRequest_CallsNextAndReturnsSuccess()
    {
        IValidator<TestTypedRequest>[] validators = [new TestTypedRequestValidator()];
        ValidationBehavior<TestTypedRequest, Result<string>> behavior = new(validators);
        bool nextCalled = false;

        Result<string> result = await behavior.Handle(
            new TestTypedRequest("Pelipiste 1"),
            () =>
            {
                nextCalled = true;
                return Task.FromResult(Result.Success("OK"));
            },
            CancellationToken.None);

        Assert.True(nextCalled);
        Assert.True(result.IsSuccess);
        Assert.Equal("OK", result.Value);
    }

    /// <summary>
    /// Varmistaa, että virheellinen syöte palauttaa <see cref="Result{TValue}"/>-validointivirheen eikä kutsu käsittelijää.
    /// </summary>
    [Fact]
    public async Task Handle_InvalidTypedRequest_ReturnsValidationFailureWithoutCallingNext()
    {
        IValidator<TestTypedRequest>[] validators = [new TestTypedRequestValidator()];
        ValidationBehavior<TestTypedRequest, Result<string>> behavior = new(validators);
        bool nextCalled = false;

        Result<string> result = await behavior.Handle(
            new TestTypedRequest(string.Empty),
            () =>
            {
                nextCalled = true;
                return Task.FromResult(Result.Success("OK"));
            },
            CancellationToken.None);

        Assert.False(nextCalled);
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Validation, result.Error.Type);
        Assert.Equal("Validation.Failed", result.Error.Code);
        Assert.Contains("Nimi on pakollinen.", result.Error.Description);
    }

    /// <summary>
    /// Varmistaa, että virheellinen syöte ei-geneerisessä <see cref="Result"/>-pyynnössä palauttaa validointivirheen ilman poikkeusta.
    /// </summary>
    [Fact]
    public async Task Handle_InvalidUntypedRequest_ReturnsValidationFailureWithoutCallingNext()
    {
        IValidator<TestUntypedRequest>[] validators = [new TestUntypedRequestValidator()];
        ValidationBehavior<TestUntypedRequest, Result> behavior = new(validators);
        bool nextCalled = false;

        Result result = await behavior.Handle(
            new TestUntypedRequest(string.Empty),
            () =>
            {
                nextCalled = true;
                return Task.FromResult(Result.Success());
            },
            CancellationToken.None);

        Assert.False(nextCalled);
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Validation, result.Error.Type);
        Assert.Contains("Nimi ei saa olla tyhjä.", result.Error.Description);
    }
}
