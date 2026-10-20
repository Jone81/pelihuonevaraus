using Microsoft.Extensions.Logging;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Application.Common;
using Pelihuone.Application.Notifications;
using Pelihuone.Contracts.Issues;
using Pelihuone.Domain.Common;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Issues;

public sealed class IssueReportService : IIssueReportService
{
    private readonly IIssueReportRepository _issueReportRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly IDiscordNotificationService _discordNotificationService;
    private readonly ILogger<IssueReportService> _logger;

    public IssueReportService(
        IIssueReportRepository issueReportRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IDateTimeProvider dateTimeProvider,
        IDiscordNotificationService discordNotificationService,
        ILogger<IssueReportService> logger)
    {
        _issueReportRepository = issueReportRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _dateTimeProvider = dateTimeProvider;
        _discordNotificationService = discordNotificationService;
        _logger = logger;
    }

    public async Task<Result<IssueReportResponse>> CreateIssueReportAsync(
        CreateIssueReportRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Target))
        {
            return Result.Failure<IssueReportResponse>(Error.Validation("Issue.MissingTarget", "Kohteen (esim. laite tai tila) määrittely on pakollinen."));
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return Result.Failure<IssueReportResponse>(Error.Validation("Issue.MissingTitle", "Vikailmoituksen otsikko on pakollinen."));
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return Result.Failure<IssueReportResponse>(Error.Validation("Issue.MissingDescription", "Vikailmoituksen kuvaus on pakollinen."));
        }

        try
        {
            var now = _dateTimeProvider.UtcNow;
            var report = IssueReport.Create(
                IssueReportId.New(),
                request.ReporterEmail ?? "",
                request.ReporterName ?? "",
                request.Target,
                request.Title,
                request.Description,
                now);

            await _issueReportRepository.AddAsync(report, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Uusi vikailmoitus {IssueId} luotu kohteelle {Target}.", report.Id.Value, report.Target);

            // Lähetä reaaliaikainen ilmoitus ylläpidolle (Discord Webhook)
            try
            {
                await _discordNotificationService.SendIssueReportNotificationAsync(
                    report.Target,
                    report.Title,
                    report.Description,
                    report.ReporterEmail,
                    report.ReporterName,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Virhe lähetettäessä vikailmoituksen Discord-notifikaatiota.");
            }

            return Result.Success(MapToResponse(report));
        }
        catch (DomainException ex)
        {
            return Result.Failure<IssueReportResponse>(Error.Validation("Issue.DomainError", ex.Message));
        }
    }

    public async Task<Result<IReadOnlyList<IssueReportResponse>>> GetAllIssueReportsAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(new UserId(adminUserId), cancellationToken);
        if (user is null || !user.IsAdmin)
        {
            return Result.Failure<IReadOnlyList<IssueReportResponse>>(
                Error.Forbidden("Issue.Forbidden", "Vain ylläpitäjät voivat tarkastella vikailmoituksia."));
        }

        var reports = await _issueReportRepository.GetAllAsync(cancellationToken);
        var responses = reports.Select(MapToResponse).ToList();
        return Result.Success<IReadOnlyList<IssueReportResponse>>(responses);
    }

    public async Task<Result<IssueReportResponse>> ResolveIssueReportAsync(
        Guid issueId,
        ResolveIssueReportRequest request,
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(new UserId(adminUserId), cancellationToken);
        if (user is null || !user.IsAdmin)
        {
            return Result.Failure<IssueReportResponse>(
                Error.Forbidden("Issue.Forbidden", "Vain ylläpitäjät voivat kuitata vikailmoituksia."));
        }

        var report = await _issueReportRepository.GetByIdAsync(new IssueReportId(issueId), cancellationToken);
        if (report is null)
        {
            return Result.Failure<IssueReportResponse>(
                Error.NotFound("Issue.NotFound", "Vikailmoitusta ei löytynyt."));
        }

        report.Resolve(request.AdminNotes, _dateTimeProvider.UtcNow);
        await _issueReportRepository.UpdateAsync(report, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Vikailmoitus {IssueId} kuitattu ratkaistuksi Adminin {AdminId} toimesta.", issueId, adminUserId);

        return Result.Success(MapToResponse(report));
    }

    private static IssueReportResponse MapToResponse(IssueReport report)
    {
        return new IssueReportResponse(
            report.Id.Value,
            report.ReporterEmail,
            report.ReporterName,
            report.Target,
            report.Title,
            report.Description,
            report.CreatedAt,
            report.IsResolved,
            report.ResolvedAt,
            report.AdminNotes);
    }
}
