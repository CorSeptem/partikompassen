# Prioriteringskompassen 2026

Ett interaktivt nollsumme-spindeldiagram inför riksdagsvalet 2026-09-13.
Fördela 400 poäng över 8 politikområden — dra upp ett område och de andra
sjunker automatiskt — och se vilket parti som prioriterar mest likt dig.

Ingen officiell valkompass. Partipoängen är en redaktionell tolkning av
partiernas egna program, se metodsektionen i appen.

**Live:** https://corseptem.github.io/partikompassen/

## Köra lokalt

Ingen build, inga dependencies — en enda fil.

```bash
open index.html
# eller
python3 -m http.server 8000   # sedan http://localhost:8000
```

## Köra tester

```bash
node --test
```

Testerna extraherar räknelogiken (`DATA`, `ZeroSum`, `Match`) direkt ur
`index.html`s `<script id="logic">`-block via Node `vm`, så de verifierar den
faktiskt levererade koden. Se `TESTS.md` för fullständiga testresultat,
inklusive manuellt verifierade UI/tillgänglighetstester.

## Uppdatera partidata

Alla poäng, motiveringar och källor ligger i `DATA.parties` i `index.html`.
Kontrollera efter ändring att varje partis `scores`-array fortfarande
summerar till exakt 400 (`node --test` fångar detta automatiskt).
