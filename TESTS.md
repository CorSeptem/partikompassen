# Testresultat — Prioriteringskompassen 2026

Testfallen nedan följer acceptanskriterierna i `UNDERLAG-partikompassen.md` §8.
Automatiserade tester körs mot den faktiskt levererade koden (extraheras direkt
ur `index.html`s `<script id="logic">`-block, se `test/zerosum.test.mjs`).
Manuella/UI-tester kördes end-to-end i en riktig Chromium-instans (Playwright)
mot den körande sidan, inte bara mot testfilen.

Kör själv: `node --test` (automatiserat) från projektroten.

## Datavaliditet

| Testfall | Resultat |
|---|---|
| Varje partis `scores` summerar till exakt 400 | **PASS** — verifierat för alla 8 partier (S, M, SD, C, KD, L, V, MP) |
| Användarens summa är exakt 400 efter varje interaktion (drag, slider, slumpa, nollställ) | **PASS** — verifierat efter `redistribute` (drag), `redistribute` (slider), 50× `randomProfile` (slumpa), `neutralProfile` (nollställ). Ett riktigt buggfynd under testning: `repair()` (används av Slumpa) hade fel tecken i sin residual-omfördelning och kunde ge summor som 396 istället för 400 — fixat, verifierat med efterföljande körning |

## Nollsummelogik

| Testfall | Resultat |
|---|---|
| Dra en axel 50 → 90: övriga 7 minskar proportionellt, ingen under 10 | **PASS** |
| 5 axlar låsta: dragning omfördelar endast mellan de 2 olåsta | **PASS** — låsta axlar oförändrade, residualen absorberad av de två olåsta |
| 6+ axlar låsta: dragning blockeras | **PASS** — `redistribute` är no-op när `isDragBlocked` är sant. Verifierat även i UI (Playwright): tooltip "Lås upp minst två områden" visas efter 6:e låsningen |
| Axel kan aldrig hamna utanför [10, 120] (fuzz: 1000 slumpdrag) | **PASS** — deterministisk PRNG, 1000 iterationer, summan är alltid exakt 400 och alla axlar inom [10,120] genom hela sekvensen |

## Matchning

| Testfall | Resultat |
|---|---|
| Användarprofil identisk med ett partis profil → det partiet får högst match (~100 %) | **PASS** — testat mot Centerpartiets profil, matchPercent > 99,9 % |
| Neutral profil (alla 50) ger rimlig, stabil ranking utan NaN | **PASS** — alla 8 partier finns i resultatet, inga NaN/Infinity, fallande sortering |
| Extremprofil fungerar utan fel | **PASS** — testat med en axel på MAX (120) och resten jämnt fördelat över de andra sju (den mest extrema *matematiskt görbara* profilen givet TOTAL=400/N=8/MIN=10 — en axel på 120 med *alla* övriga på golvet 10 är inte görbart eftersom 120+7×10=190≠400) |

## UI / Tillgänglighet — manuellt verifierat (Playwright mot körande sida, Chromium)

| Testfall | Resultat |
|---|---|
| Fungerar med enbart tangentbord (sliders fokusbara, piltangenter ±1, nollsumma upprätthålls) | **PASS** — fokuserade en slider, `ArrowRight` ökade värdet med exakt 1, budgetindikatorn förblev 400/400 |
| Fungerar med touch på 360 px-skärm | **PASS** — testat i 360×800-viewport; slider-höjd (touch-mål) mättes till 44 px enligt CSS-mediaquery för `max-width: 400px`. Draggbara SVG-punkter har 44 px osynlig träffyta (`.axis-point-hit`, r=22) oavsett skärmstorlek |
| Delnings-URL återskapar exakt profil vid inläsning | **PASS** — genererade delningslänk från ett resultat, öppnade den i en ny sida: landade direkt på resultatvyn med identisk toppmatchning. Ogiltig `?p=garbage` faller korrekt tillbaka till introvyn (neutral profil) |
| Metodvyn visar full matris, motiveringar och alla 8 källänkar | **PASS** — matristabellen har 9 rader (8 politikområden + summeringsrad), källistan har exakt 8 poster (en per parti) |
| Disclaimer synlig på intro- och resultatvyn | **PASS** — verifierat visuellt i DOM: disclaimer-text finns i både `#view-intro` och `#view-resultat` |

## Under testningen upptäckt och åtgärdat

1. **`repair()`-bugg (Slumpa-knappen):** residual-omfördelningen vid clamping i den generella "reparera profil"-funktionen hade omvänt tecken, vilket kunde ge slumpprofiler vars summa avvek från 400 (observerat: 396). Roten var att när en axel klipps mot ett gränsvärde ska den *frigjorda* (eller *saknade*) mängden läggas tillbaka på de fria axlarna — koden subtraherade istället för att addera. Fixat och om-verifierat med 50 upprepade slumpningar plus fuzz-testet.
2. **SVG-etiketter klickbara utanför synligt fält:** `<svg>`-element har `overflow: hidden` som standard, vilket klippte bort (och gjorde oklickbara) axeletiketter som hamnade nära kanten av `viewBox` (t.ex. "Ekonomi & skatter" vid högerkanten). Fixat med `overflow: visible` på `svg#radar`, verifierat genom att låsa samtliga 8 axeletiketter i följd utan att någon klick-timeout uppstod.
