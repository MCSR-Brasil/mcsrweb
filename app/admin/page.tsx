"use client";

import { useMemo, useState } from "react";

type PlayerRow = { uuid: string; name: string; stateUF: string | null };

type PbRunRow = {
  id: number;
  playerUUID: string;
  category: string;
  timeMs: number;
  achievedAt: string | null;
  link: string | null;
};

type TournamentRow = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  prizepool: string | null;
};

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

  // PB form
  const [pbPlayerUUID, setPbPlayerUUID] = useState("");
  const [pbCategory, setPbCategory] = useState("Any%");
  const [pbTimeMs, setPbTimeMs] = useState("");
  const [pbLink, setPbLink] = useState("");

  // Tournament form
  const [tId, setTId] = useState("");
  const [tName, setTName] = useState("");
  const [tStartsAt, setTStartsAt] = useState("");
  const [tEndsAt, setTEndsAt] = useState("");
  const [tPrizepool, setTPrizepool] = useState("");

  const [log, setLog] = useState<string[]>([]);

  const canSubmitPlayer = useMemo(() => ready && pUuid.trim() && pName.trim(), [ready, pUuid, pName]);
  const canSubmitPb = useMemo(
    () => ready && pbPlayerUUID.trim() && pbCategory.trim() && Number(pbTimeMs) > 0,
    [ready, pbPlayerUUID, pbCategory, pbTimeMs]
  );
  const canSubmitTournament = useMemo(
    () => ready && tId.trim() && tName.trim() && tStartsAt.trim() && tEndsAt.trim(),
    [ready, tId, tName, tStartsAt, tEndsAt]
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

            <button
              type="button"
              disabled={!canSubmitPlayer}
              onClick={async () => {
                try {
                  await postJson("/api/admin/players", {
                    uuid: pUuid,
                    name: pName,
                    stateUF: pStateUF || null,
                  } satisfies PlayerRow);
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
            <input
              value={pbPlayerUUID}
              onChange={(e) => setPbPlayerUUID(e.target.value)}
              placeholder="Player UUID"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              value={pbCategory}
              onChange={(e) => setPbCategory(e.target.value)}
              placeholder="Categoria (ex: Any%)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              value={pbTimeMs}
              onChange={(e) => setPbTimeMs(e.target.value)}
              placeholder="Time (ms)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              value={pbLink}
              onChange={(e) => setPbLink(e.target.value)}
              placeholder="Link (opcional)"
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
                    timeMs: Number(pbTimeMs),
                    link: pbLink || null,
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
              value={tStartsAt}
              onChange={(e) => setTStartsAt(e.target.value)}
              placeholder="StartsAt (ISO)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              value={tEndsAt}
              onChange={(e) => setTEndsAt(e.target.value)}
              placeholder="EndsAt (ISO)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <input
              value={tPrizepool}
              onChange={(e) => setTPrizepool(e.target.value)}
              placeholder="Prizepool (opcional)"
              className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />

            <button
              type="button"
              disabled={!canSubmitTournament}
              onClick={async () => {
                try {
                  await postJson("/api/admin/tournaments", {
                    id: tId,
                    name: tName,
                    startsAt: tStartsAt,
                    endsAt: tEndsAt,
                    prizepool: tPrizepool || null,
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
