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

export function generateSingleElimBracketFromParticipants(participantsCsv: string, tournamentId?: string): TournamentBracket {
  const participants = splitParticipants(participantsCsv);
  const size = nextPow2(Math.max(2, participants.length));
  const padded = [...participants];
  while (padded.length < size) padded.push("BYE");

  const rounds: BracketRound[] = [];

  const round1Matches: BracketMatch[] = [];
  for (let i = 0; i < padded.length; i += 2) {
    round1Matches.push({
      id: `${tournamentId ?? "t"}-w1-m${Math.floor(i / 2) + 1}`,
      p1: padded[i],
      p2: padded[i + 1],
    });
  }
  rounds.push({ name: "Round 1", matches: round1Matches });

  let matchesCount = round1Matches.length;
  let r = 2;
  while (matchesCount > 1) {
    matchesCount = Math.ceil(matchesCount / 2);
    rounds.push({
      name: matchesCount === 1 ? "Final" : `Round ${r}`,
      matches: Array.from({ length: matchesCount }).map((_, idx) => ({
        id: `${tournamentId ?? "t"}-w${r}-m${idx + 1}`,
      })),
    });
    r++;
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

  const losers: BracketRound[] = [];
  for (let i = 1; i < losersStart; i++) {
    losers.push({ name: `Losers Round ${i}`, matches: [] });
  }

  const losersRoundsCount = Math.max(1, winners.length - 1);
  for (let r = 1; r <= losersRoundsCount; r++) {
    const matchCount = Math.max(1, Math.floor(Math.pow(2, Math.max(0, winners.length - r - 1))));
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
