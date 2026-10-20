using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence.Extensions;

namespace Pelihuone.Infrastructure.Persistence.Configurations;

public sealed class GamingStationConfiguration : IEntityTypeConfiguration<GamingStation>
{
    public void Configure(EntityTypeBuilder<GamingStation> builder)
    {
        builder.ToTable("gaming_stations");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .HasConversion(id => id.Value, value => new GamingStationId(value));

        builder.Property(s => s.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(s => s.Type)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(s => s.IsActive)
            .IsRequired();

        builder.Ignore(s => s.UsesSharedTv);

        builder.UseXminAsConcurrencyToken();
    }
}
