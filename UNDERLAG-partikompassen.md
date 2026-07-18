# UNDERLAG FÖR CLAUDE CODE: "Prioriteringskompassen – Valet 2026"

> Komplett specifikation för ett interaktivt nollsumme-spindeldiagram där användaren
> fördelar en fast prioriteringsbudget över 8 politikområden och sedan matchas mot
> de svenska riksdagspartiernas prioriteringar enligt deras partiprogram/valmanifest 2026.
>
> Detta dokument är självbärande: det innehåller koncept, datamatris med motiveringar,
> algoritmer, UI-spec, teknisk arkitektur och acceptanskriterier.

---

## 1. Koncept och syfte

**Grundidé:** Politik är prioriteringar. Man kan inte satsa allt på allt – ökar man på ett
område måste något annat minska. Verktyget visualiserar detta som ett spindeldiagram
(radar chart) med 8 axlar där **summan av alla axelvärden alltid är konstant (400 poäng)**.
Drar användaren upp en axel, sjunker de övriga proportionellt. När användaren är klar
jämförs profilen mot 8 partiprofiler (kodade från partiernas egna program) och en
rankad matchningslista visas.

**Målgrupp:** Allmänheten inför riksdagsvalet 13 september 2026. Ska fungera lika bra
på mobil som desktop.

**Viktig princip – transparens:** Partipoängen är en *tolkning* av partiernas dokument,
inte en objektiv sanning. Verktyget MÅSTE innehålla en synlig metodsektion
("Hur har vi räknat?") med källänkar och förklaring av kodningsmetoden (se §4.3).
Verktyget får inte framstå som en officiell valkompass.

---

## 2. De 8 axlarna

| # | Axel-ID | Namn (UI) | Omfattar |
|---|---------|-----------|----------|
| 1 | `vard` | Vård & omsorg | Sjukvård, väntetider, primärvård/husläkare, äldreomsorg, tandvård, psykiatri |
| 2 | `skola` | Skola & utbildning | Förskola–högskola, lärare, friskolefrågan, ordning/kunskapsfokus, forskning |
| 3 | `ekonomi` | Ekonomi & skatter | Skattetryck, plånboksfrågor, tillväxt, företagande, offentliga finanser, landsbygdens ekonomi |
| 4 | `arbete` | Jobb & arbetsmarknad | Sysselsättning, a-kassa, arbetsrätt, aktivitetsplikt, omställning, karensfrågan |
| 5 | `trygghet` | Brott & trygghet | Polis, straff, gängkriminalitet, rättsväsende, kvinnofrid |
| 6 | `migration` | Migration & integration | Asylpolitik, medborgarskap, språk-/bidragskrav, segregation, återvandring |
| 7 | `forsvar` | Försvar & säkerhet | Militärt försvar, totalförsvar/beredskap, Nato, Ukrainastöd, civilförsvar |
| 8 | `klimat` | Klimat & miljö | Utsläpp, energi, naturvård, biologisk mångfald, hållbara transporter |

**Designbeslut (fattade, ska ej omprövas av Claude Code):**
- Bostäder, EU, demokrati/rättsstat, kultur och jämställdhet är INTE egna axlar.
  De vägs in i närmaste axel (t.ex. bostäder → ekonomi, Nato/EU-säkerhet → försvar,
  hedersförtryck → trygghet/migration beroende på kontext).
- 8 axlar är taket – fler gör spindeldiagrammet oläsligt.
- Nollsummemodell: total = 400 poäng (snitt 50/axel), gäller både användare och partier.

---

## 3. Partidata (kodad matris)

### 3.1 Metod för kodningen (redovisas även i appens metodsektion)

Varje partis valmanifest/partiprogram 2026 har lästs i sin helhet (juli 2026).
Poängen speglar **relativ prioritering**, bedömd utifrån:
1. Hur framträdande området är i dokumentets struktur (egna kapitel, ordning, omfång).
2. Konkretionsgrad (skarpa, finansieringstunga löften > allmänna formuleringar).
3. Explicita ned-/bortprioriteringar (t.ex. "inte utrymme för...", "avvisar...").

Poängen är normerade så att varje parti summerar till exakt 400.
Skalan är relativ inom partiet – 80 på migration betyder att området dominerar
partiets program, inte att partiet är "för 80 % migration".

### 3.2 Datamatris

Ordning på axlar i alla arrayer: `[vard, skola, ekonomi, arbete, trygghet, migration, forsvar, klimat]`

```json
{
  "totalBudget": 400,
  "axes": [
    { "id": "vard",      "label": "Vård & omsorg" },
    { "id": "skola",     "label": "Skola & utbildning" },
    { "id": "ekonomi",   "label": "Ekonomi & skatter" },
    { "id": "arbete",    "label": "Jobb & arbetsmarknad" },
    { "id": "trygghet",  "label": "Brott & trygghet" },
    { "id": "migration", "label": "Migration & integration" },
    { "id": "forsvar",   "label": "Försvar & säkerhet" },
    { "id": "klimat",    "label": "Klimat & miljö" }
  ],
  "parties": [
    {
      "id": "S", "name": "Socialdemokraterna", "color": "#E8112d",
      "scores": [60, 60, 60, 60, 55, 40, 45, 20],
      "source": "Valplattform / val-2026 (socialdemokraterna.se/val-2026)",
      "motivation": "Tre likvärdiga huvudpelare: stark ekonomi i plånboken (plånbokslöfte, tillväxtplan), stark välfärd (kortare vårdköer, mindre klasser, vinstförbud i skolan, äldreomsorg) och trygghet. Jobbpolitiken bred (jobbtrappa, aktivitetsplikt, slopad karens). Migration: 'strama linjen ligger fast' men få nya förslag. Totalförsvaret ska byggas ut. Klimat nämns främst som del av tillväxt/omställning, utan egen pelare – tydligt nedprioriterat relativt 2018/2022."
    },
    {
      "id": "M", "name": "Moderaterna", "color": "#52BDEC",
      "scores": [40, 40, 75, 55, 65, 45, 50, 30],
      "source": "Vallöften 2026 (moderaterna.se/valloften-2026) + Idéprogram 'Frihet och ansvar' (2021)",
      "motivation": "Vallöftena domineras av plånbok/skatt: 5 000 kr mer för barnfamiljer, höjt ISK-tak, sänkt pensionsskatt, skattefritt månadskort, slöserikommission i stället för skattehöjningar. Trygghet stark tvåa (10 000 poliskameror, fler vakter, dubbla straff för kvinnofrid). Försvar: drönarvärn 10 000 personer. Arbetslinjen genomsyrar idéprogrammet. Vård/skola finns men utan motsvarande skärpa i löftena. Klimat: teknik- och kärnkraftsoptimism, lägre profil."
    },
    {
      "id": "SD", "name": "Sverigedemokraterna", "color": "#DDDD00",
      "scores": [50, 35, 55, 40, 70, 80, 55, 15],
      "source": "Valplattform 2026 'Hemma i Sverige' (sd.se, PDF juli 2026)",
      "motivation": "Struktur 'Trygg – Fri – Svensk'. 'Svensk'-delen (stram invandring, assimilering, uppvärderat medborgarskap, återvandring, kamp mot islamism, svenska språket) är plattformens ideologiska kärna → högst poäng. 'Trygg': gängjakt, pedofilregister, fler poliser, totalförsvar, men även tandvård/närsjukhus/a-kassa (ger vård+arbete substans). 'Fri': sänkta skatter på el/drivmedel/mat, regelförenkling, landsbygd. Klimat explicit bortprioriterat: 'inte utrymme för ineffektiva klimatpolitiska satsningar'."
    },
    {
      "id": "C", "name": "Centerpartiet", "color": "#009933",
      "scores": [55, 40, 65, 50, 45, 35, 45, 65],
      "source": "Valmanifest 2026 'Sverige kan mer', 328 förslag (val2026.centerpartiet.se)",
      "motivation": "Sju huvudområden där 'Fler jobb' (slopad anställningsskatt, regelförenklingsmyndighet, stopp för kompetensutvisningar) och 'Minskade utsläpp' (halverade tillståndstider, fossilfri el, elbilsbonus) uttryckligen anges som partiets prioriteringar → högst poäng på ekonomi/företagande och klimat. 'Fungerande välfärd i hela landet' (fast läkarkontakt, ungas psykiska hälsa) och 50 mdr till landsbygden (fördelas ekonomi/vård). Rättsstat och försvar finns som egna områden men med mindre tyngd. Migration lägst profil."
    },
    {
      "id": "KD", "name": "Kristdemokraterna", "color": "#000077",
      "scores": [70, 45, 50, 45, 55, 45, 50, 40],
      "source": "Principprogram (kristdemokraterna.se, PDF 2025/2026)",
      "motivation": "Vård & omsorg är KD:s tydligaste profilområde: solidariskt finansierad vård som 'välfärdens kärna', vårdgarantier, äldreomsorg med värdighetsgarantier, familj som grund. Rättssamhälle/kriminalpolitik eget kapitel med brottsofferfokus. Försvar/säkerhet omfattande kapitel (Nato-artikel 5, totalförsvarsplikt). Migration: stram linje, hjälp i närområdet, krav för medborgarskap. Skola: valfrihet, ordning, fostransuppdrag. Förvaltarskapsprincipen ger klimatet en mellanposition."
    },
    {
      "id": "L", "name": "Liberalerna", "color": "#006AB3",
      "scores": [45, 75, 55, 40, 50, 45, 45, 45],
      "source": "Valmanifest 2026 'För din frihet' (liberalerna.se) + Partiprogram 2025 (PDF)",
      "motivation": "Skolan uttryckligen först: 'framtiden börjar i skolan', två av åtta manifestdelar är skola/trygg start (mindre barngrupper, ordning i klassrummet, världens bästa skola); partiprogrammet ägnar skolan störst utrymme av alla sakområden. 'Ansträngning ska löna sig' (sänkt skatt på utbildning/arbete, sparande) ger ekonomi tvåan. Skydd för friheten (brott, hedersförtryck) och husläkarreform. Försvar/EU/Nato och klimat (kärnkraftspositiv, EU-styrmedel) jämnstarka. Migration: integrationkrav + värnad asylrätt."
    },
    {
      "id": "V", "name": "Vänsterpartiet", "color": "#DA291C",
      "scores": [65, 50, 60, 70, 35, 35, 25, 60],
      "source": "Partiprogram antaget av kongressen 2024 (vansterpartiet.se/resursbank/partiprogram)",
      "motivation": "Full sysselsättning och arbetsplatsmakt är programmets röda tråd (arbetstidsförkortning, stärkt arbetsrätt, trygghetssystem) → högst poäng. Välfärd utan vinst (vård, skola, tandvård in i högkostnadsskyddet) och ekonomisk omfördelning (höjd skatt på förmögenhet/arv/höga inkomster, gemensamt ägande) väger tungt. Klimat: utsläppsbudget, stora statliga investeringar, nej till kärnkraft. Försvar tydligt nedprioriterat: sikte på att lämna Nato, nedrustning. Brott: förebyggande snarare än straff. Migration: human asylrätt men begränsat utrymme."
    },
    {
      "id": "MP", "name": "Miljöpartiet", "color": "#83CF39",
      "scores": [50, 45, 45, 45, 45, 40, 40, 90],
      "source": "Politiskt handlingsprogram 2026–2030 (mp.se, PDF april 2026)",
      "motivation": "Klimat/miljö dominerar totalt: tre inledande kapitel (rättvis klimatomställning, ekosystem/biologisk mångfald, djurvälfärd) med koldioxidbudget, klimatfond, nationell utsläppshandel, järnvägssatsning, havsmiljölag, nej till kärnkraft → 90. Övriga områden medvetet breda men sekundära: jämlik välfärd/psykisk hälsa, jämlik skola, trygghet med förebyggande fokus, human migration, grön ekonomi, stärkt beredskap. Försvar/beredskap finns (civilförsvar, desinformation) men lägst egen profil."
    }
  ]
}
```

**Kontroll:** varje `scores`-array ska summera till exakt 400. (S: 400, M: 400, SD: 400,
C: 400, KD: 400, L: 400, V: 400, MP: 400 – verifiera med test, se §8.)

### 3.3 Källförteckning (visas i appens metodsektion)

- S: https://www.socialdemokraterna.se/val-2026 (+ Valplattform PDF)
- M: https://moderaterna.se/valloften-2026/ och https://moderaterna.se/app/uploads/2022/01/Ideprogram_digitalt_9dec.pdf
- SD: https://www.sd.se/wp-content/uploads/2026/07/valplattform-2026.pdf
- C: https://www.centerpartiet.se/centerpartiets-politik/valmanifest-2026 (fulltext: val2026.centerpartiet.se)
- KD: https://kristdemokraterna.se/download/18.7932b3db19c9887db6c221c/1773136182639/Principprogram%20hemsida.pdf
- L: https://www.liberalerna.se/liberalernas-valmanifest-2026 och https://www.liberalerna.se/wp-content/uploads/liberalernas-partiprogram-2025.pdf
- V: https://www.vansterpartiet.se/resursbank/partiprogram/
- MP: https://www.mp.se/wp-content/uploads/2026/04/politiskt-handlingsprogram-2026-2030.pdf

---

## 4. Funktionell specifikation

### 4.1 Nollsumme-mekaniken (kärnan)

- Användaren startar med en **neutral profil**: alla axlar = 50 (summa 400).
- Varje axel har intervallet **[min 10, max 120]**. Min > 0 för att ingen ska kunna
  "nolla" ett område helt (orealistiskt även politiskt) och för att undvika
  division-med-noll i omfördelningen. Max 120 hindrar extremprofiler som gör
  diagrammet oläsligt.
- **Omfördelningsalgoritm** när användaren drar axel *i* från `old_i` till `new_i`:

```text
delta = new_i - old_i
others = alla axlar j ≠ i
restSum = Σ old_j (för j i others)

För varje j i others:
    share_j = old_j / restSum            # proportionell fördelning
    prel_j  = old_j - delta * share_j

Clamp: om någon prel_j < MIN (10) eller > MAX (120):
    sätt j till gränsvärdet, lås j, och omfördela residualen
    proportionellt över kvarvarande olåsta axlar (iterera tills stabilt,
    max 8 iterationer). Om residual inte kan absorberas: begränsa delta
    (dvs. axeln användaren drar i stannar tidigare än fingret).

Avrunda till heltal med "largest remainder method" så att summan
alltid blir exakt 400 efter varje interaktion.
```

- **Lås-funktion:** användaren kan klicka på en axeletikett för att låsa den
  (🔒-ikon). Låsta axlar deltar inte i omfördelningen. Om ≥ 6 axlar är låsta
  inaktiveras dragning (visa tooltip "Lås upp minst två områden").
- En **budgetindikator** visas alltid: "400/400 poäng fördelade" (ska aldrig ändras –
  den finns för att pedagogiskt kommunicera nollsumman, med en kort animation
  som visar poäng "flyta" från övriga axlar när man drar).

### 4.2 Matchningsalgoritm

När användaren trycker "Visa min match":

1. Normalisera användarvektor `u` och varje partivektor `p` (samma skala, summa 400 –
   redan normerat, så ingen ytterligare normalisering krävs).
2. Beräkna två mått per parti:
   - **Cosine similarity** `cos(u, p)` – fångar profilens *form* (vad man prioriterar
     relativt annat).
   - **Normaliserat euklidiskt avstånd** `d = 1 - (||u - p|| / d_max)` där
     `d_max = ||u_extreme - p_extreme||` beräknas som teoretiskt maxavstånd givet
     min/max-gränserna (förberäkna konstant).
3. **Matchpoäng = 0,5 · cos + 0,5 · d**, skalat till 0–100 %.
4. Sortera fallande. Visa topp-1 stort ("Du prioriterar mest likt: …") och full
   ranking 1–8 med procentstaplar i partifärg.
5. Per parti i resultatlistan: expanderbar rad som visar (a) partiets spindel ovanpå
   användarens, (b) de tre axlar där man skiljer sig mest (± poäng), (c) partiets
   `motivation`-text och källänk.

### 4.3 Vyer / flöde

1. **Intro** – 3 meningar om konceptet + knapp "Sätt dina prioriteringar".
   Kort disclaimer-rad: "Ingen officiell valkompass – bygger på vår tolkning av
   partiernas program. Läs mer under Metod."
2. **Prioriteringsvyn** – spindeldiagrammet (huvudvy):
   - SVG-radar, 8 axlar, dragbara punkter (pointer events: mouse + touch).
   - Alternativ inmatning för tillgänglighet: under diagrammet finns 8 sliders
     (range inputs) synkade med diagrammet, med samma nollsummelogik.
   - Knappar: "Nollställ" (alla 50), "Slumpa" (validerad slumpprofil), "Visa min match".
   - Valfri toggle: "Visa ett partis profil som spökkontur" (dropdown) – för
     utforskande, göms tills användaren själv aktivt väljer det (får inte påverka
     användaren innan matchning; default AV).
3. **Resultatvyn** – enligt §4.2 punkt 4–5 + delningsknapp (kopierar URL med
   profilen serialiserad i query-param, t.ex. `?p=50.50.60.40.55.35.60.50`) +
   "Ändra mina prioriteringar" (tillbaka med bevarad profil).
4. **Metodvyn** – kodningsmetod (§3.1), hela matrisen som tabell, motiveringar,
   källänkar (§3.3), datum för kodningen (juli 2026), och texten:
   "Poängen är en redaktionell tolkning. Partierna har inte medverkat."

### 4.4 UI/Design

- Ren, nyhetsgrafik-aktig stil. Ljust tema default, mörkt via `prefers-color-scheme`.
- Neutral bas (grå/vit); partifärger används ENDAST i resultat/jämförelse.
- Typografi: system-stack. Rubrik: "Prioriteringskompassen 2026".
- Spindeldiagram: gridringar vid 25/50/75/100, axeletiketter klickbara (lås),
  aktiv dragpunkt förstoras, siffervärde visas vid punkten under drag.
- Mobil: diagram min 320 px brett, dragpunkter ≥ 44 px träffyta, sliders som
  primärt reglage på < 400 px skärmbredd.
- Animationer ≤ 150 ms, respektera `prefers-reduced-motion`.

---

## 5. Teknisk arkitektur

- **Stack: vanilla HTML + CSS + JS, en enda fil `index.html`** (inga ramverk,
  inga byggsteg, ingen backend). Data enligt §3.2 inbäddas som JS-konstant.
  Skälet: enkel hosting (statisk fil), delbar, granskningsbar.
- Ingen localStorage/sessionStorage. Profil-persistens sker enbart via URL-param.
- SVG ritas/uppdateras med ren DOM-manipulation (inga canvas-beroenden).
- Struktur i filen (kommenterade sektioner):
  1. `<style>` – design tokens som CSS-variabler
  2. `<body>` – de fyra vyerna som sektioner, växlas med `data-view`
  3. `<script>` – moduler som IIFE:er/objekt: `DATA`, `state`, `zeroSum` (algoritm §4.1),
     `radar` (rendering + pointer-hantering), `match` (algoritm §4.2), `router` (vyer + URL),
     `ui` (sliders, knappar, resultatrendering)
- All beräkningslogik (zeroSum, match, largest-remainder) skrivs som **rena funktioner**
  utan DOM-beroende så att de kan enhetstestas fristående.

---

## 6. Arbetsordning för Claude Code

1. Läs hela detta dokument. Ställ frågor INNAN kodning om något är oklart –
   presentera sedan en kort plan och invänta godkännande innan implementation
   (detta är beställarens arbetssätt: plan-verifiering före exekvering).
2. Implementera i ordning: datamodell + zeroSum-funktioner → tester (§8) →
   radar-rendering statisk → drag-interaktion → sliders/synk → matchning →
   resultatvy → metodvy → URL-delning → polish/tillgänglighet.
3. Verifiera acceptanskriterierna (§8) innan leverans.
4. Leverera `index.html` + en `TESTS.md` med utfall av testfallen.

---

## 7. Avgränsningar (bygg INTE)

- Ingen backend, inloggning, statistikinsamling eller cookies.
- Inga sakfrågepåståenden per parti utöver `motivation`-texterna i §3.2.
- Ingen viktning av axlar av användaren (nollsumman ÄR viktningen).
- Ingen AI-/API-integration i v1.

---

## 8. Acceptanskriterier & testfall

**Datavaliditet**
- [ ] Varje partis scores summerar till exakt 400 (automatiskt test vid init; kasta fel annars).
- [ ] Användarens summa är exakt 400 efter varje enskild interaktion (drag, slider, slumpa, nollställ).

**Nollsummelogik**
- [ ] Dra en axel från 50 → 90: övriga 7 minskar proportionellt, ingen under 10.
- [ ] Med 5 axlar låsta: dragning omfördelar endast mellan de 2 olåsta.
- [ ] Med 6+ låsta: dragning blockeras med förklarande tooltip.
- [ ] Axel kan aldrig hamna utanför [10, 120], oavsett dragsekvens (fuzz-test: 1000 slumpdrag).

**Matchning**
- [ ] Användarprofil identisk med ett partis profil → det partiet får högst match (≈100 %).
- [ ] Neutral profil (alla 50) ger rimlig, stabil ranking utan NaN.
- [ ] Extremprofil (en axel 120, resten på min-golv) fungerar utan fel.

**UI/Tillgänglighet**
- [ ] Fungerar med enbart tangentbord (sliders fokusbara, piltangenter ±1 poäng, nollsumma upprätthålls).
- [ ] Fungerar med touch på 360 px-skärm.
- [ ] Delnings-URL återskapar exakt profil vid inläsning (inkl. validering av felaktiga params → fallback till neutral).
- [ ] Metodvyn visar full matris, motiveringar och alla 8 källänkar.
- [ ] Disclaimer synlig på intro- och resultatvyn.

---

## 9. Kända begränsningar (dokumentera i metodvyn)

- KD:s och V:s poäng bygger på princip-/partiprogram (ej separata valmanifest 2026
  per juli 2026) – prioriteringar kan skifta när ev. valmanifest publiceras.
  Datastrukturen ska göra det trivialt att uppdatera `scores` + `source`.
- M:s vallöftessida uppdateras löpande fram till valdagen; kodningen avser läget 2026-07-17.
- Relativ prioritering ≠ sakpolitisk position. Två partier kan ha samma poäng på
  "Migration" men vilja motsatta saker. Verktyget mäter VAR partierna lägger sin
  energi, inte VAD de tycker. Detta ska framgå tydligt i metodvyn.
