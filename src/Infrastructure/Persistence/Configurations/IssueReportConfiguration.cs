using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence.Extensions;

namespace Pelihuone.Infrastructure.Persistence.Configurations;

public sealed class IssueReportConfiguration : IEntityTypeConfiguration<IssueReport>
{
    public void Configure(EntityTypeBuilder<IssueReport> builder)
    {
        builder.ToTable("issue_reports");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Id)
            .HasConversion(id => id.Value, value => new IssueReportId(value));

        builder.Property(i => i.ReporterEmail)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(i => i.ReporterName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(i => i.Target)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(i => i.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(i => i.Description)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(i => i.CreatedAt)
            .IsRequired();

        builder.Property(i => i.IsResolved)
            .IsRequired();

        builder.Property(i => i.ResolvedAt);

        builder.Property(i => i.AdminNotes)
            .HasMaxLength(2000);

        builder.UseXminAsConcurrencyToken();
    }
}
