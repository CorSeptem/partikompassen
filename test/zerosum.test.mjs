// Fristående tester enligt spec §8. Extraherar <script id="logic"> ur
// index.html och kör den i en Node vm-kontext, så testerna verifierar den
// faktiskt levererade koden (samma källa som webbläsaren kör) — ingen
// duplicerad logik, inga dependencies.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

const match = html.match(/<script id="logic">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Kunde inte hitta <script id="logic"> i index.html');
const logicSource = match[1];

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(logicSource, sandbox, { filename: "index.html#logic" });

const { DATA, ZeroSum, Match } = sandbox;
const { MIN, MAX, TOTAL, N } = ZeroSum;

function sum(arr) { return arr.reduce((a, b) => a + b, 0); }

// ---------------------------------------------------------------------------
// Datavaliditet
// ---------------------------------------------------------------------------

test("varje partis scores summerar till exakt 400", () => {
  for (const p of DATA.parties) {
    assert.equal(sum(p.scores), TOTAL, `${p.id} summerar till ${sum(p.scores)}`);
    assert.equal(p.scores.length, N, `${p.id} har fel antal axlar`);
  }
});

test("neutral profil summerar till exakt 400", () => {
  const neutral = ZeroSum.neutralProfile();
  assert.equal(sum(neutral), TOTAL);
});

test("summan är exakt 400 efter drag, slider-ändring, slumpa och nollställ", () => {
  let scores = ZeroSum.neutralProfile();
  const locked = new Array(N).fill(false);

  scores = ZeroSum.redistribute(scores, 0, 90, locked); // drag
  assert.equal(sum(scores), TOTAL);

  scores = ZeroSum.redistribute(scores, 3, 20, locked); // "slider"-ändring
  assert.equal(sum(scores), TOTAL);

  for (let i = 0; i < 50; i++) {
    const rnd = ZeroSum.randomProfile(); // slumpa
    assert.equal(sum(rnd), TOTAL);
  }

  const reset = ZeroSum.neutralProfile(); // nollställ
  assert.equal(sum(reset), TOTAL);
});

// ---------------------------------------------------------------------------
// Nollsummelogik
// ---------------------------------------------------------------------------

test("dra en axel 50 -> 90: övriga minskar proportionellt, ingen under MIN", () => {
  const start = ZeroSum.neutralProfile();
  const locked = new Array(N).fill(false);
  const result = ZeroSum.redistribute(start, 0, 90, locked);

  assert.equal(sum(result), TOTAL);
  assert.equal(result[0], 90);
  for (let i = 1; i < N; i++) {
    assert.ok(result[i] < start[i], `axel ${i} borde ha minskat`);
    assert.ok(result[i] >= MIN, `axel ${i} gick under MIN: ${result[i]}`);
  }
});

test("5 låsta axlar: dragning omfördelar endast mellan de 2 olåsta", () => {
  const start = ZeroSum.neutralProfile();
  const locked = [true, true, true, true, true, false, false, false];
  // axisIndex 5 är den vi drar i (olåst), 6 och 7 är de två övriga olåsta
  const before = start.slice();
  const result = ZeroSum.redistribute(start, 5, 90, locked);

  assert.equal(sum(result), TOTAL);
  assert.equal(result[5], 90);
  for (let i = 0; i < 5; i++) {
    assert.equal(result[i], before[i], `låst axel ${i} ska inte ändras`);
  }
  // residualen ska ha absorberats av axel 6 och 7
  assert.notEqual(result[6] + result[7], before[6] + before[7]);
});

test("6+ låsta axlar: dragning blockeras (isDragBlocked + no-op redistribute)", () => {
  const start = ZeroSum.neutralProfile();
  const locked = [true, true, true, true, true, true, false, false];
  assert.equal(ZeroSum.isDragBlocked(locked), true);

  const result = ZeroSum.redistribute(start, 6, 90, locked);
  assert.deepEqual(result, start, "redistribute ska vara no-op när drag är blockerad");
});

test("axel kan aldrig hamna utanför [MIN,MAX] (fuzz: 1000 slumpdrag)", () => {
  let scores = ZeroSum.neutralProfile();
  const locked = new Array(N).fill(false);
  let seed = 42;
  function prng() { // enkel deterministisk PRNG för reproducerbarhet
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed % 10000) / 10000;
  }

  for (let iter = 0; iter < 1000; iter++) {
    const axis = Math.floor(prng() * N);
    const value = MIN + prng() * (MAX - MIN + 40); // ibland utanför giltigt intervall också
    scores = ZeroSum.redistribute(scores, axis, value, locked);
    assert.equal(sum(scores), TOTAL, `iteration ${iter}: summa blev ${sum(scores)}`);
    for (let i = 0; i < N; i++) {
      assert.ok(scores[i] >= MIN && scores[i] <= MAX, `iteration ${iter}, axel ${i} = ${scores[i]} utanför [${MIN},${MAX}]`);
    }
  }
});

// ---------------------------------------------------------------------------
// Matchning
// ---------------------------------------------------------------------------

test("identisk profil med ett parti ger högst match (~100%) på det partiet", () => {
  const target = DATA.parties[3]; // Centerpartiet
  const matches = Match.computeMatches(target.scores, DATA.parties, { MIN, MAX, TOTAL });
  assert.equal(matches[0].id, target.id);
  assert.ok(matches[0].matchPercent > 99.9, `matchPercent = ${matches[0].matchPercent}`);
});

test("neutral profil ger stabil ranking utan NaN", () => {
  const neutral = ZeroSum.neutralProfile();
  const matches = Match.computeMatches(neutral, DATA.parties, { MIN, MAX, TOTAL });
  assert.equal(matches.length, DATA.parties.length);
  for (const m of matches) {
    assert.ok(Number.isFinite(m.matchPercent), `${m.id} gav NaN/Infinity`);
    assert.ok(m.matchPercent >= 0 && m.matchPercent <= 100);
  }
  // fallande sortering
  for (let i = 1; i < matches.length; i++) {
    assert.ok(matches[i - 1].matchPercent >= matches[i].matchPercent);
  }
});

test("extremprofil (en axel på MAX, resten jämnt fördelat) fungerar utan fel", () => {
  // OBS: med TOTAL=400 och N=8 kan inte "resten" ligga på MIN-golvet (10*7=70)
  // samtidigt som en axel tar 120 och summan ändå blir 400 — inte matematiskt
  // görbart. Testar därför den mest extrema *görbara* profilen: en axel på
  // MAX, återstoden jämnt fördelad över de övriga sju.
  const extreme = new Array(N).fill(0);
  extreme[0] = MAX;
  const restEach = (TOTAL - MAX) / (N - 1);
  for (let i = 1; i < N; i++) extreme[i] = restEach;
  assert.ok(extreme[0] <= MAX);
  assert.equal(sum(extreme), TOTAL);

  const matches = Match.computeMatches(extreme, DATA.parties, { MIN, MAX, TOTAL });
  assert.equal(matches.length, DATA.parties.length);
  for (const m of matches) {
    assert.ok(Number.isFinite(m.matchPercent));
  }
});

test("topDifferences returnerar de tre axlar med störst avvikelse", () => {
  const user = ZeroSum.neutralProfile();
  const party = DATA.parties[0];
  const diffs = Match.topDifferences(user, party.scores, DATA.axes, 3);
  assert.equal(diffs.length, 3);
  const all = DATA.axes.map((ax, i) => Math.abs(user[i] - party.scores[i]));
  const sortedAll = [...all].sort((a, b) => b - a).slice(0, 3);
  const got = diffs.map((d) => Math.abs(d.diff));
  assert.equal(got.length, sortedAll.length);
  got.forEach((v, i) => assert.equal(v, sortedAll[i]));
});
