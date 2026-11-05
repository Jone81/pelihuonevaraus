using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Pelihuone.Application.Notifications;
using Pelihuone.Domain.Common;
using Pelihuone.Domain.Exceptions;
using Pelihuone.WebApi.Middleware;

namespace Pelihuone.WebApi.Tests;

/// <summary>
/// Yksikkötestit <see cref="GlobalExceptionHandler"/>-luokalle ja ylläpidon virhehälytysten kutsumiselle.
/// </summary>
public class GlobalExceptionHandlerTests
{
    private readonly FakeErrorNotificationService _fakeNotificationService = new();
    private readonly GlobalExceptionHandler _handler;

    /// <summary>
    /// Alustaa uuden <see cref="GlobalExceptionHandlerTests"/>-testiluokan.
    /// </summary>
    public GlobalExceptionHandlerTests()
    {
        TestScopeFactory scopeFactory = new TestScopeFactory(_fakeNotificationService);
        _handler = new GlobalExceptionHandler(
            NullLogger<GlobalExceptionHandler>.Instance,
            scopeFactory);
    }

    /// <summary>
    /// Varmistaa, että odottamaton palvelinvirhe (500) lähettää automaattisen hälytyssähköpostin ylläpitäjille.
    /// </summary>
    [Fact]
    public async Task TryHandleAsync_WhenUnexpectedException_SendsErrorAlertToAdmins()
    {
        // Arrange
        DefaultHttpContext context = new DefaultHttpContext();
        context.Request.Path = "/api/reservations";
        context.Response.Body = new MemoryStream();

        InvalidOperationException unexpectedEx = new InvalidOperationException("Odottamaton kaatuminen!");

        // Act
        bool handled = await _handler.TryHandleAsync(context, unexpectedEx, CancellationToken.None);

        // Assert
        Assert.True(handled);
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);

        Assert.Equal(1, _fakeNotificationService.CallCount);
        Assert.Same(unexpectedEx, _fakeNotificationService.LastException);
        Assert.Equal("/api/reservations", _fakeNotificationService.LastPath);
    }

    /// <summary>
    /// Varmistaa, että tavallinen toimintasääntövirhe (<see cref="DomainException"/>) palauttaa 400 Bad Request eikä lähetä hälytyssähköpostia.
    /// </summary>
    [Fact]
    public async Task TryHandleAsync_WhenDomainException_DoesNotSendErrorAlert()
    {
        // Arrange
        DefaultHttpContext context = new DefaultHttpContext();
        context.Request.Path = "/api/reservations";
        context.Response.Body = new MemoryStream();

        InvalidReservationTimeException domainEx = new InvalidReservationTimeException("Peliaika on virheellinen");

        // Act
        bool handled = await _handler.TryHandleAsync(context, domainEx, CancellationToken.None);

        // Assert
        Assert.True(handled);
        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);

        // DomainException ei saa laukaista kriittistä hälytyssähköpostia
        Assert.Equal(0, _fakeNotificationService.CallCount);
    }

    /// <summary>
    /// Valetoteutus <see cref="IErrorNotificationService"/>-rajapinnalle yksikkötestausta varten.
    /// </summary>
    private sealed class FakeErrorNotificationService : IErrorNotificationService
    {
        public int CallCount { get; private set; }
        public Exception? LastException { get; private set; }
        public string? LastPath { get; private set; }

        public Task SendErrorAlertAsync(
            Exception exception,
            string? path = null,
            string? traceId = null,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            LastException = exception;
            LastPath = path;
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Valetoteutus palveluskoopille ja sen tehtaalle yksikkötestauksessa.
    /// </summary>
    private sealed class TestScopeFactory : IServiceScopeFactory, IServiceScope, IServiceProvider
    {
        private readonly IErrorNotificationService _service;

        public TestScopeFactory(IErrorNotificationService service)
        {
            _service = service;
        }

        public IServiceScope CreateScope() => this;

        public IServiceProvider ServiceProvider => this;

        public object? GetService(Type serviceType)
        {
            if (serviceType == typeof(IErrorNotificationService))
            {
                return _service;
            }

            return null;
        }

        public void Dispose()
        {
        }
    }
}
