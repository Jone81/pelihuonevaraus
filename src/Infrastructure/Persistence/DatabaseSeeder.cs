using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, ILogger logger)
    {
        try
        {
            await context.Database.EnsureCreatedAsync();

            // 1. Pelitila
            GameRoom? room = await context.GameRooms.FirstOrDefaultAsync();
            if (room is null)
            {
                logger.LogInformation("Alustetaan GameRoom (Xamk Pääpelitila)...");
                room = GameRoom.Create(GameRoomId.New(), "Xamk Game Room", hasSharedTv: true);
                await context.GameRooms.AddAsync(room);
                await context.SaveChangesAsync();
            }

            // 2. Pelipisteet (6 PC:tä, PS5, Switch) tunnisteilla
            if (!await context.GamingStations.AnyAsync())
            {
                logger.LogInformation("Alustetaan oletuspelipisteet tietokantaan...");
                var stations = new List<GamingStation>
                {
                    GamingStation.Create(GamingStationId.New(), "PC 1", GamingStationType.PC, isActive: true, stationCode: "PC-01"),
                    GamingStation.Create(GamingStationId.New(), "PC 2", GamingStationType.PC, isActive: true, stationCode: "PC-02"),
                    GamingStation.Create(GamingStationId.New(), "PC 3", GamingStationType.PC, isActive: true, stationCode: "PC-03"),
                    GamingStation.Create(GamingStationId.New(), "PC 4", GamingStationType.PC, isActive: true, stationCode: "PC-04"),
                    GamingStation.Create(GamingStationId.New(), "PC 5", GamingStationType.PC, isActive: true, stationCode: "PC-05"),
                    GamingStation.Create(GamingStationId.New(), "PC 6", GamingStationType.PC, isActive: true, stationCode: "PC-06"),
                    GamingStation.Create(GamingStationId.New(), "PlayStation 5", GamingStationType.PlayStation5, isActive: true, stationCode: "PS5-01"),
                    GamingStation.Create(GamingStationId.New(), "Nintendo Switch", GamingStationType.NintendoSwitch, isActive: true, stationCode: "NSW-01"),
                };

                await context.GamingStations.AddRangeAsync(stations);
                await context.SaveChangesAsync();
                logger.LogInformation("6 kpl PC-pelipisteitä ja 2 kpl konsoleita alustettu onnistuneesti (yht. 8 pelipistettä).");
            }

            // 3. Käyttäjät
            User? adminUser = await context.Users.FirstOrDefaultAsync(u => u.Email.Value == "admin@xamk.fi");
            if (!await context.Users.AnyAsync())
            {
                logger.LogInformation("Alustetaan oletuskäyttäjät tietokantaan...");
                var now = DateTimeOffset.UtcNow;
                adminUser = User.Create(
                    UserId.New(),
                    SchoolEmail.Create("admin@xamk.fi"),
                    "Pääkäyttäjä (SuperAdmin)",
                    UserRole.SuperAdmin,
                    now);

                var normalUser = User.Create(
                    UserId.New(),
                    SchoolEmail.Create("opiskelija@edu.xamk.fi"),
                    "Matti Meikäläinen",
                    UserRole.User,
                    now);

                await context.Users.AddRangeAsync(adminUser, normalUser);
                await context.SaveChangesAsync();
                logger.LogInformation("Oletuskäyttäjät alustettu onnistuneesti.");
            }

            // 4. Pelit ja toivelista (Domain Spec: Peli: nimi, alusta, kuvaus, toivelista-tieto)
            if (!await context.Games.AnyAsync())
            {
                logger.LogInformation("Alustetaan pelit ja toivelista...");
                var games = new List<Game>
                {
                    // PC-pelit
                    Game.Create(GameId.New(), "Counter-Strike 2", GamingPlatform.PC, "Taktinen 5v5 FPS-ammuntapeli. Asennettu kaikkiin PC-koneisiin.", isWishlist: false),
                    Game.Create(GameId.New(), "Valorant", GamingPlatform.PC, "Riot Gamesin hahmopohjainen taktinen räiskintäpeli.", isWishlist: false),
                    Game.Create(GameId.New(), "Dota 2", GamingPlatform.PC, "Suosittu MOBA-strategiapeli.", isWishlist: false),
                    Game.Create(GameId.New(), "Rocket League", GamingPlatform.PC, "Fysiikkapohjainen autojalkapallopeli.", isWishlist: false),

                    // PS5-pelit
                    Game.Create(GameId.New(), "Marvel's Spider-Man 2", GamingPlatform.PlayStation5, "PS5-yksinoikeustoimintapeli.", isWishlist: false),
                    Game.Create(GameId.New(), "Gran Turismo 7", GamingPlatform.PlayStation5, "Realistinen ajosimulaattori rattipolkimilla tuettuna.", isWishlist: false),
                    Game.Create(GameId.New(), "EA Sports FC 25", GamingPlatform.PlayStation5, "Jalkapallopeli paikalliseen moninpeliin.", isWishlist: false),

                    // Switch-pelit
                    Game.Create(GameId.New(), "Mario Kart 8 Deluxe", GamingPlatform.NintendoSwitch, "Hupiajelu jopa 4 pelaajalle jaetulla ruudulla.", isWishlist: false),
                    Game.Create(GameId.New(), "Super Smash Bros. Ultimate", GamingPlatform.NintendoSwitch, "Klassinen taistelupeli Nintendon hahmoilla.", isWishlist: false),

                    // Toivelistapelit (Wishlist)
                    Game.Create(GameId.New(), "Tekken 8", GamingPlatform.PlayStation5, "Opiskelijoiden toivelistalla: turnaussuosikki taistelupeli.", isWishlist: true, votesCount: 9),
                    Game.Create(GameId.New(), "Helldivers 2", GamingPlatform.PC, "Opiskelijoiden toivelistalla: 4 pelaajan co-op räiskintä.", isWishlist: true, votesCount: 16),
                };

                await context.Games.AddRangeAsync(games);
                await context.SaveChangesAsync();
                logger.LogInformation("Oletuspelivalikoima ja toivelista alustettu onnistuneesti.");
            }

            // 5. Uutiset ja tiedotteet (Domain Spec: Admin hallinnoi uutisia)
            if (!await context.News.AnyAsync())
            {
                logger.LogInformation("Alustetaan uutiset ja tiedotteet...");
                UserId authorId = adminUser?.Id ?? UserId.New();
                var now = DateTimeOffset.UtcNow;

                var newsList = new List<News>
                {
                    News.Create(
                        NewsId.New(),
                        "🏆 Perjantain CS2-turnaus tulossa!",
                        "SuperAdmin järjestää perjantaina opiskelijaturnauksen klo 14–18. Tilassa saattaa olla turnauksen aikana tavallista enemmän pelaajia. Tervetuloa kannustamaan!",
                        authorId,
                        now.AddHours(-2),
                        isPinned: true),
                };

                await context.News.AddRangeAsync(newsList);
                await context.SaveChangesAsync();
                logger.LogInformation("Oletusuutiset alustettu onnistuneesti.");
            }

            // 6. Vikailmoitukset
            if (!await context.IssueReports.AnyAsync())
            {
                logger.LogInformation("Alustetaan esimerkkivikailmoitukset...");
                var now = DateTimeOffset.UtcNow;
                var sampleIssues = new List<IssueReport>
                {
                    IssueReport.Create(
                        IssueReportId.New(),
                        "opiskelija@edu.xamk.fi",
                        "Matti Meikäläinen",
                        "PC 2",
                        "Hiiren johto löysällä",
                        "USB-portti tuntuu pätkivän kun hiirtä liikuttaa nopeasti.",
                        now.AddDays(-1)),
                };
                await context.IssueReports.AddRangeAsync(sampleIssues);
                await context.SaveChangesAsync();
                logger.LogInformation("Esimerkkivikailmoitukset alustettu onnistuneesti.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Virhe tietokannan varmistuksessa tai alustuksessa.");
        }
    }
}
