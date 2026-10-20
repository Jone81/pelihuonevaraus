using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pelihuone.Infrastructure.Outbox;

namespace Pelihuone.Infrastructure.Persistence.Configurations;

public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("outbox_messages");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Type)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(o => o.Content)
            .HasColumnType("text")
            .IsRequired();

        builder.Property(o => o.OccurredOnUtc)
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.Property(o => o.ProcessedOnUtc)
            .HasColumnType("timestamptz");

        builder.Property(o => o.Error)
            .HasColumnType("text");

        builder.HasIndex(o => o.ProcessedOnUtc);
    }
}
