export type BracketMatch = {
  id: string;
  p1?: string;
  p2?: string;
  s1?: number;
  s2?: number;
  winner?: 1 | 2;
  note?: string;
};

export type BracketRound = {
  name: string;
  matches: BracketMatch[];
};

export type TournamentBracket = {
  version: 1;
  kind: "single_elim" | "double_elim" | "custom";
  participants?: string[];
  winners?: BracketRound[];
  losers?: BracketRound[];
  finals?: BracketRound[];
};

export function safeParseBracketJson(json: string | null | undefined): TournamentBracket | null {
  const raw = String(json ?? "").trim();
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as unknown;
    if (!obj || typeof obj !== "object") return null;
    const b = obj as Partial<TournamentBracket>;
    if (b.version !== 1) return null;
    if (b.kind !== "single_elim" && b.kind !== "double_elim" && b.kind !== "custom") return null;
    return b as TournamentBracket;
  } catch {
    return null;
  }
}

function splitParticipants(csv: string): string[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function nextPow2(n: number) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function seededPositions(size: number): number[] {
  // Standard seeded bracket ordering so that round-1 pairings are:
  // (1 vs size), (size/2 vs size/2+1), etc.
  // Example size=8 => [1,8,4,5,2,7,3,6]
  let positions = [1, 2];
  for (let s = 4; s <= size; s *= 2) {
    positions = positions.flatMap((p) => [p, s + 1 - p]);
  }
  return positions;
}

type SlotLabel = string | undefined;

export function generateSingleElimBracketFromParticipants(participantsCsv: string, tournamentId?: string): TournamentBracket {
  const participants = splitParticipants(participantsCsv);
  const n = participants.length;
  const size = nextPow2(Math.max(2, n));
  const totalRounds = Math.max(1, Math.round(Math.log2(size)));
  const positions = seededPositions(size);

  const rounds: BracketRound[] = [];

  // Build round-by-round slots. Each round output slot is either:
  // - a known participant name (because of a bye), or
  // - a placeholder like "Winner of ...".
  // Round 1 is special: we only include *real* matches (no BYE matches).
  let prevOutputs: SlotLabel[] = [];

  // Round 1
  const round1Matches: BracketMatch[] = [];
  const round1Outputs: SlotLabel[] = [];
  const round1PairCount = size / 2;
  for (let i = 0; i < round1PairCount; i++) {
    const seedA = positions[i * 2];
    const seedB = positions[i * 2 + 1];
    const nameA = seedA <= n ? participants[seedA - 1] : undefined;
    const nameB = seedB <= n ? participants[seedB - 1] : undefined;

    if (nameA && nameB) {
      const id = `${tournamentId ?? "t"}-w1-m${round1Matches.length + 1}`;
      round1Matches.push({ id, p1: nameA, p2: nameB });
      round1Outputs.push(`Winner of ${id}`);
    } else {
      // Bye: promote the existing seed directly, without generating a fake match.
      round1Outputs.push(nameA ?? nameB);
    }
  }
  rounds.push({ name: "Round 1", matches: round1Matches });
  prevOutputs = round1Outputs;

  // Subsequent rounds: always create full round structure (with placeholders).
  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = size / Math.pow(2, r);
    const matches: BracketMatch[] = [];
    const outputs: SlotLabel[] = [];

    for (let m = 0; m < matchCount; m++) {
      const id = `${tournamentId ?? "t"}-w${r}-m${m + 1}`;
      const left = prevOutputs[m * 2];
      const right = prevOutputs[m * 2 + 1];
      matches.push({ id, p1: left, p2: right });
      outputs.push(`Winner of ${id}`);
    }

    rounds.push({ name: matchCount === 1 ? "Final" : `Round ${r}`, matches });
    prevOutputs = outputs;
  }

  return {
    version: 1,
    kind: "single_elim",
    participants,
    winners: rounds,
  };
}

export function generateDoubleElimBracketFromParticipants(
  participantsCsv: string,
  opts?: { tournamentId?: string; losersBracketStartsRound?: number }
): TournamentBracket {
  const participants = splitParticipants(participantsCsv);
  const base = generateSingleElimBracketFromParticipants(participantsCsv, opts?.tournamentId);
  const winners = base.winners ?? [];
  const losersStart = Math.max(1, Math.floor(opts?.losersBracketStartsRound ?? 1));

  // This project uses a lightweight bracket JSON primarily for display/editing.
  // For double-elim we generate a *displayable* losers bracket that starts at the
  // configured winners round. When losersStart=2, losers from round 1 are treated
  // as eliminated and do not appear in the losers bracket.
  const losers: BracketRound[] = [];

  const startIdx = Math.max(1, Math.min(winners.length, losersStart)) - 1;
  const entrants = winners[startIdx]?.matches.length ?? 0;
  const losersSize = nextPow2(Math.max(2, entrants));
  const losersRoundsCount = Math.max(1, Math.round(Math.log2(losersSize)));

  for (let r = 1; r <= losersRoundsCount; r++) {
    const matchCount = losersSize / Math.pow(2, r);
    losers.push({
      name: `Losers Round ${losersStart + r - 1}`,
      matches: Array.from({ length: matchCount }).map((_, idx) => ({
        id: `${opts?.tournamentId ?? "t"}-l${losersStart + r - 1}-m${idx + 1}`,
      })),
    });
  }

  const finals: BracketRound[] = [
    {
      name: "Grand Final",
      matches: [{ id: `${opts?.tournamentId ?? "t"}-gf-m1` }],
    },
  ];

  return {
    version: 1,
    kind: "double_elim",
    participants,
    winners,
    losers,
    finals,
  };
}
