using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Pelihuone.Infrastructure.Persistence.Extensions;

/// <summary>
/// Tarjoaa laajennusmetodeja EF Coren <see cref="EntityTypeBuilder{TEntity}"/>-rakentajalle
/// yhteisten tietokantaominaisuuksien, kuten rinnakkaisuudenhallinnan, määrittämiseen.
/// </summary>
public static class EntityTypeBuilderExtensions
{
    /// <summary>
    /// Ottaa käyttöön PostgreSQL xmin-järjestelmäsarakkeeseen perustuvan optimistisen rivilukituksen
    /// EF Coren IsRowVersion() -määrityksellä ilman, että Domain-luokkiin tarvitsee lisätä teknisiä kenttiä.
    /// </summary>
    /// <typeparam name="TEntity">Konfiguroitavan entiteetin tyyppi.</typeparam>
    /// <param name="builder">Entiteettityypin rakentaja.</param>
    /// <returns>Sama <see cref="EntityTypeBuilder{TEntity}"/>-instanssi ketjutusta varten.</returns>
    public static EntityTypeBuilder<TEntity> UseXminAsConcurrencyToken<TEntity>(
        this EntityTypeBuilder<TEntity> builder)
        where TEntity : class
    {
        // Määritetään varjokenttä (shadow property) "Version" riviversioksi optimistista lukitusta varten
        builder.Property<uint>("Version").IsRowVersion();
        return builder;
    }
}
