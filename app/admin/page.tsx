"use client";

import { useEffect, useMemo, useState } from "react";

import {
  generateDoubleElimBracketFromParticipants,
  generateSingleElimBracketFromParticipants,
} from "../../lib/bracket";

type PlayerRow = { uuid: string; name: string; stateUF: string | null };

type PbRunRow = {
  id: number;
  playerUUID: string;
  category: string;
  timeMs: number;
  achievedAt: string | null;
  link: string | null;
  description?: string | null;
  seed?: string | null;
  bastion?: string | null;
};

type TournamentRow = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string | null;
  participantsCsv: string | null;
  type: string;
  bracketFormat?: string | null;
  losersBracketStartsRound?: number | null;
  prizepool?: string | null;
  winner?: string | null;
  bracketJson?: string | null;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dateToSqliteNoonText(dateValue: string) {
  const s = dateValue.trim();
  if (!s) return "";
  const d = new Date(`${s}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function durationPartsToMs(minStr: string, secStr: string, msStr: string) {
  const min = Number(minStr || 0);
  const sec = Number(secStr || 0);
  const ms = Number(msStr || 0);
  if (![min, sec, ms].every((n) => Number.isFinite(n) && n >= 0)) return NaN;
  return Math.floor(min * 60_000 + sec * 1000 + ms);
}

function authHeaders(secret: string): HeadersInit {
  const s = secret.trim();
  return s ? { Authorization: `Bearer ${s}` } : {};
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const ready = secret.trim().length > 0;

  // Players form
  const [pUuid, setPUuid] = useState("");
  const [pName, setPName] = useState("");
  const [pStateUF, setPStateUF] = useState("");
  const [pCountryCode, setPCountryCode] = useState("BR");

  // PB form
  const [pbPlayerUUID, setPbPlayerUUID] = useState("");
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [pbCategory, setPbCategory] = useState("1.16");
  const [pbTimeMin, setPbTimeMin] = useState("0");
  const [pbTimeSec, setPbTimeSec] = useState("0");
  const [pbTimeMs, setPbTimeMs] = useState("0");
  const [pbAchievedOn, setPbAchievedOn] = useState("");
  const [pbLink, setPbLink] = useState("");
  const [pbDescription, setPbDescription] = useState("");
  const [pbSeed, setPbSeed] = useState("");
  const [pbBastion, setPbBastion] = useState("");

  // Tournament form
  const [tId, setTId] = useState("");
  const [tName, setTName] = useState("");
  const [tStartsAt, setTStartsAt] = useState("");
  const [tEndsAt, setTEndsAt] = useState("");
  const [tParticipants, setTParticipants] = useState("");
  const [tType, setTType] = useState<"event" | "btrl" | "bracket">("event");
  const [tBracketFormat, setTBracketFormat] = useState<"single_elim" | "double_elim">("single_elim");
  const [tLosersStart, setTLosersStart] = useState("1");
  const [tPrizepool, setTPrizepool] = useState("");
  const [tWinner, setTWinner] = useState("");
  const [tBracketJson, setTBracketJson] = useState("");

  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!ready) {
        setPlayers([]);
        return;
      }
      setPlayersLoading(true);
      try {
        const url = new URL("/api/admin/players", window.location.origin);
        url.searchParams.set("limit", "200");

        const res = await fetch(url.toString(), {
          headers: { ...authHeaders(secret) },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { rows?: PlayerRow[] };
        if (cancelled) return;
        setPlayers(Array.isArray(data.rows) ? data.rows : []);
      } catch {
        if (!cancelled) setPlayers([]);
      } finally {
        if (!cancelled) setPlayersLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [ready, secret]);

  const canSubmitPlayer = useMemo(() => ready && pUuid.trim() && pName.trim(), [ready, pUuid, pName]);
  const computedPbTimeMs = useMemo(() => durationPartsToMs(pbTimeMin, pbTimeSec, pbTimeMs), [pbTimeMin, pbTimeSec, pbTimeMs]);
  const canSubmitPb = useMemo(
    () => ready && pbPlayerUUID.trim() && pbCategory.trim() && Number.isFinite(computedPbTimeMs) && computedPbTimeMs > 0,
    [ready, pbPlayerUUID, pbCategory, computedPbTimeMs]
  );
  const canSubmitTournament = useMemo(
    () => ready && tId.trim() && tName.trim() && tStartsAt.trim() && tType.trim(),
    [ready, tId, tName, tStartsAt, tType]
  );

  function pushLog(line: string) {
    setLog((l) => [line, ...l].slice(0, 8));
  }

  async function postJson(path: string, body: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders(secret) },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="font-minecraft text-xl font-black text-zinc-950 dark:text-zinc-50">Admin</div>
        <div className="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
          Insira o secret para liberar ações de CRUD.
        </div>

        <input
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="ADMIN_SECRET"
          className="font-minecraft mt-4 w-full rounded-xl border border-zinc-200 bg-white px-5 py-4 text-sm font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 focus:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <section className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="font-minecraft text-sm font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Players
          </div>

          <div className="mt-3 space-y-2">
            <input
              value={pUuid}
              onChange={(e) => setPUuid(e.target.value)}
              placeholder="UUID"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="Nome"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              value={pStateUF}
              onChange={(e) => setPStateUF(e.target.value)}
              placeholder="UF (opcional)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />

            <input
              value={pCountryCode}
              onChange={(e) => setPCountryCode(e.target.value)}
              placeholder="Country Code (ex: BR)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />

            <button
              type="button"
              disabled={!canSubmitPlayer}
              onClick={async () => {
                try {
                  await postJson("/api/admin/players", {
                    uuid: pUuid,
                    name: pName,
                    stateUF: pStateUF || null,
                    countryCode: pCountryCode || null,
                  } satisfies PlayerRow & { countryCode?: string | null });
                  pushLog(`Player salvo: ${pName}`);
                } catch (e) {
                  pushLog(`Erro: ${e instanceof Error ? e.message : "failed"}`);
                }
              }}
              className={
                "font-minecraft mt-2 w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider shadow-sm transition-all " +
                (canSubmitPlayer
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500")
              }
            >
              Salvar
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="font-minecraft text-sm font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            PB Runs
          </div>

          <div className="mt-3 space-y-2">
            <select
              value={pbPlayerUUID}
              onChange={(e) => setPbPlayerUUID(e.target.value)}
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            >
              {!ready ? <option value="">Insira o secret para carregar players</option> : null}
              {ready && playersLoading ? <option value="">Carregando...</option> : null}
              {ready && !playersLoading ? <option value="">Selecionar player</option> : null}
              {players.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={pbCategory}
              onChange={(e) => setPbCategory(e.target.value)}
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            >
              <option value="1.16">1.16</option>
              <option value="1.16 SSG">1.16 SSG</option>
            </select>

            <div className="grid grid-cols-3 gap-2">
              <input
                inputMode="numeric"
                value={pbTimeMin}
                onChange={(e) => setPbTimeMin(e.target.value)}
                placeholder="Min"
                className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <input
                inputMode="numeric"
                value={pbTimeSec}
                onChange={(e) => setPbTimeSec(e.target.value)}
                placeholder="Sec"
                className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <input
                inputMode="numeric"
                value={pbTimeMs}
                onChange={(e) => setPbTimeMs(e.target.value)}
                placeholder="Ms"
                className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            <input
              type="date"
              value={pbAchievedOn}
              onChange={(e) => setPbAchievedOn(e.target.value)}
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              value={pbLink}
              onChange={(e) => setPbLink(e.target.value)}
              placeholder="Link (opcional)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />

            <input
              value={pbDescription}
              onChange={(e) => setPbDescription(e.target.value)}
              placeholder="Description (opcional)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />

            <input
              value={pbSeed}
              onChange={(e) => setPbSeed(e.target.value)}
              placeholder="Seed (opcional)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />

            <input
              value={pbBastion}
              onChange={(e) => setPbBastion(e.target.value)}
              placeholder="Bastion (opcional)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />

            <button
              type="button"
              disabled={!canSubmitPb}
              onClick={async () => {
                try {
                  await postJson("/api/admin/pb-runs", {
                    playerUUID: pbPlayerUUID,
                    category: pbCategory,
                    timeMs: computedPbTimeMs,
                    achievedAt: pbAchievedOn ? dateToSqliteNoonText(pbAchievedOn) : null,
                    link: pbLink || null,
                    description: pbDescription || null,
                    seed: pbSeed || null,
                    bastion: pbBastion || null,
                  } satisfies Partial<PbRunRow>);
                  pushLog(`PB salvo: ${pbPlayerUUID} ${pbCategory}`);
                } catch (e) {
                  pushLog(`Erro: ${e instanceof Error ? e.message : "failed"}`);
                }
              }}
              className={
                "font-minecraft mt-2 w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider shadow-sm transition-all " +
                (canSubmitPb
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500")
              }
            >
              Adicionar
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="font-minecraft text-sm font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Torneios
          </div>

          <div className="mt-3 space-y-2">
            <input
              value={tId}
              onChange={(e) => setTId(e.target.value)}
              placeholder="ID"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              value={tName}
              onChange={(e) => setTName(e.target.value)}
              placeholder="Nome"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />

            <input
              type="date"
              value={tStartsAt}
              onChange={(e) => setTStartsAt(e.target.value)}
              placeholder="Start date"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              type="date"
              value={tEndsAt}
              onChange={(e) => setTEndsAt(e.target.value)}
              placeholder="End date (opcional)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />

            <textarea
              value={tParticipants}
              onChange={(e) => setTParticipants(e.target.value)}
              placeholder="Participants (CSV)"
              rows={3}
              className="font-minecraft w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />

            <select
              value={tType}
              onChange={(e) => setTType((e.target.value as any) || "event")}
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            >
              <option value="event">Event</option>
              <option value="btrl">BTRL</option>
              <option value="bracket">Bracket</option>
            </select>

            {tType === "bracket" ? (
              <>
                <select
                  value={tBracketFormat}
                  onChange={(e) => setTBracketFormat((e.target.value as any) || "single_elim")}
                  className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                >
                  <option value="single_elim">Single Elimination</option>
                  <option value="double_elim">Double Elimination</option>
                </select>

                <input
                  inputMode="numeric"
                  value={tLosersStart}
                  onChange={(e) => setTLosersStart(e.target.value)}
                  placeholder="Losers bracket starts round (Double Elim) (ex: 2)"
                  disabled={tBracketFormat !== "double_elim"}
                  className={
                    "font-minecraft w-full rounded-xl border px-4 py-3 text-xs font-black shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 " +
                    (tBracketFormat === "double_elim"
                      ? "border-zinc-200 bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                      : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-500")
                  }
                />
              </>
            ) : null}

            <input
              value={tPrizepool}
              onChange={(e) => setTPrizepool(e.target.value)}
              placeholder="Prizepool (opcional)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />

            <input
              value={tWinner}
              onChange={(e) => setTWinner(e.target.value)}
              placeholder="Winner (opcional)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />

            <textarea
              value={tBracketJson}
              onChange={(e) => setTBracketJson(e.target.value)}
              placeholder="Bracket JSON (opcional)"
              rows={6}
              className="font-minecraft w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={tType !== "bracket" || !tParticipants.trim()}
                onClick={() => {
                  if (tType !== "bracket") return;
                  const losersStart = Number.isFinite(Number(tLosersStart)) ? Math.floor(Number(tLosersStart)) : 1;
                  const bracket =
                    tBracketFormat === "double_elim"
                      ? generateDoubleElimBracketFromParticipants(tParticipants, {
                          tournamentId: tId || "t",
                          losersBracketStartsRound: losersStart,
                        })
                      : generateSingleElimBracketFromParticipants(tParticipants, tId || "t");
                  setTBracketJson(JSON.stringify(bracket, null, 2));
                }}
                className={
                  "font-minecraft w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider shadow-sm transition-all " +
                  (tType === "bracket" && tParticipants.trim()
                    ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    : "cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500")
                }
              >
                Gerar Bracket JSON
              </button>

              <button
                type="button"
                onClick={() => setTBracketJson("")}
                className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Limpar JSON
              </button>
            </div>

            <button
              type="button"
              disabled={!canSubmitTournament}
              onClick={async () => {
                try {
                  await postJson("/api/admin/tournaments", {
                    id: tId,
                    name: tName,
                    startsAt: dateToSqliteNoonText(tStartsAt),
                    endsAt: tEndsAt ? dateToSqliteNoonText(tEndsAt) : null,
                    participantsCsv: tParticipants || null,
                    type: tType,
                    bracketFormat: tType === "bracket" ? tBracketFormat : null,
                    losersBracketStartsRound:
                      tType === "bracket" ? (Number.isFinite(Number(tLosersStart)) ? Math.floor(Number(tLosersStart)) : null) : null,
                    prizepool: tPrizepool || null,
                    winner: tWinner || null,
                    bracketJson: tBracketJson || null,
                  } satisfies Partial<TournamentRow>);
                  pushLog(`Torneio salvo: ${tName}`);
                } catch (e) {
                  pushLog(`Erro: ${e instanceof Error ? e.message : "failed"}`);
                }
              }}
              className={
                "font-minecraft mt-2 w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider shadow-sm transition-all " +
                (canSubmitTournament
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500")
              }
            >
              Salvar
            </button>
          </div>
        </section>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="font-minecraft text-sm font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Status
        </div>
        <div className="mt-3 space-y-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {log.length === 0 ? <div>Nenhuma ação ainda.</div> : null}
          {log.map((l, i) => (
            <div key={i} className="truncate">
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
