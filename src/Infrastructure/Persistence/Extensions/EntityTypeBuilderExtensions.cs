using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Pelihuone.Infrastructure.Persistence.Extensions;

public static class EntityTypeBuilderExtensions
{
    /// <summary>
    /// Ottaa käyttöön PostgreSQL xmin-järjestelmäsarakkeeseen perustuvan optimistisen rivilukituksen
    /// EF Coren IsRowVersion() -määrityksellä ilman, että Domain-luokkiin tarvitsee lisätä teknisiä kenttiä.
    /// </summary>
    public static EntityTypeBuilder<TEntity> UseXminAsConcurrencyToken<TEntity>(
        this EntityTypeBuilder<TEntity> builder)
        where TEntity : class
    {
        builder.Property<uint>("Version").IsRowVersion();
        return builder;
    }
}
