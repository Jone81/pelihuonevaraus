# Muutosloki — Dark Neo-Brutalism UI & aktiivisen varauksen kesken lopettaminen

**Haara:** `feature/004-dark-neobrutalism-ui-ja-varauksen-lopetus`

## Tehdyt muutokset

### 1. Dark Neo-Brutalism -käyttöliittymäuudistus (`src/Client`)
- **Teema ja typografia (`index.html`, `src/index.css`):**
  - Tailwind CSS v4 `@theme`-väripaletti (`#121417`, `#1C1F24`, `#FFFFFF`, `#FACC15`, `#3B82F6`, `#22C55E`, `#EF4444`), terävät `0px`-kulmat (`rounded-none`), kovat varjot sekä fontit (`Space Grotesk`, `JetBrains Mono`, `Inter`).
  - Poistettu käyttämätön `App.css` ja siivottu ~4 900 riviä vanhaa legacy-CSS:ää (CSS-paketti pieneni 116 kB → 45 kB).
  - Lisätty `::selection`-korostus (`#FACC15` / `#09090B`), tumma terävä vierityspalkki sekä tumma `<body>`-tausta valkoisen välähdyksen estämiseksi.
- **Jaetut UI-komponentit (`src/components/ui/*`):**
  - Päivitetty `Button`, `Badge`, `Card`, `Dialog`, `DropdownMenu`, `Input`, `Label`, `NativeSelect`, `Table`, `Tabs` ja `Textarea` Dark Neo-Brutalism -tyyliin.
  - Lisätty virallinen Discord-logo (`DiscordIcon`) ja otettu se käyttöön kaikissa Discord-linkeissä ja -painikkeissa.
- **Näkymät ja käytettävyysparannukset:**
  - Refaktoroitu kaikki sovelluksen 16 sivua ja komponenttia uuteen tyyliin ilman logiikan rikkomista.
  - **Ylänavigaatio (`Navbar.tsx`):** 2-rivinen desktop-rakenne, jotta kaikki painikkeet (mm. `PELIHUONEVARAUS`, `Omat varaukset` ja `Admin`) näkyvät kokonaan; `Admin` muutettu split-painikkeeksi (suora siirtymä hallintapaneeliin + alasvetovalikko).
  - **Varauslomake ja aikataulumatriisi (`BookingCalendar.tsx`):** `Alkamisaika` ja `Päättymisaika` sijoitettu rinnakkain, ylimääräiset pelipistepalikat poistettu matriisin alta, ja mobiilin kosketusnäytön Drag-to-Select (`touch-action`) palautettu.
  - **Etusivu (`LandingPage.tsx` & `NewsBanner.tsx`):** Yhdenmukaistettu Xamk X -logo ja tumma Hero-infolaatikko, siirretty `Tilan pohjakuva` ja `Tilan ohjeet ja säännöt` -kortit kirjautumisen ja uutisten alle, sekä poistettu ylimääräinen pohjakuvavälilehti ja lyhyt sääntölaatikko.
  - **Hallintapaneeli (`AdminPanel.tsx`):** Poistettu yläosan 4 kortin KPI-rivi.
  - **Alatunnisteet (`App.tsx`, `LandingPage.tsx`):** Siivottu 4-sarakkeisiksi täsmäämään käyttäjän oikeita valikoita.

### 2. Aktiivisen varauksen lopettaminen kesken (`Spec 004`)
- **Dokumentaatio ja spec:** Päivitetty `Docs/domain.md` (sääntö #12), `Docs/rajapinta.md`, `Docs/testaus.md` ja lisätty `specs/004-lopeta-varaus-kesken.md`.
- **Backend (`Domain`, `Contracts`, `Application`, `WebApi`):**
  - `TimeWindow.TruncateEnd` ja `Reservation.EndEarly`: katkaisee käynnissä olevan aktiivisen varauksen päättymisajan nykyhetkeen (`EndUtc = nowUtc`), jolloin pelipiste ja mahdollinen yhteinen 4K-TV vapautuvat heti.
  - Uusi päätepiste `POST /api/reservations/{id}/end` (`200 OK`, `403 Forbidden`, `404 Not Found`, `409 Conflict`).
  - Lisätty 23 uutta yksikkö- ja HTTP-päätepistetestiä (`EndReservationDomainTests`, `EndReservationServiceTests`, `EndReservationEndpointsTests`).
- **Frontend (`MyReservations.tsx`):**
  - Lisätty **Lopeta varaus** -painike käynnissä oleville varauksille (`api.endReservationEarly`), joka päivittää vapaiden laitteiden ja aikataulun näkymät automaattisesti.

## Paikallinen testaus

1. Käynnistä backend:
   ```bash
   dotnet run --project src/WebApi --launch-profile http
   ```
2. Käynnistä frontend:
   ```bash
   npm --prefix src/Client run dev
   ```
3. Avaa selaimessa `http://localhost:5173/`.
