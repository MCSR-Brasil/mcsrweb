"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "../../../../components/page-header";
import { BracketEditView } from "../../../../components/bracket-edit-view";
import {
  generateDoubleElimBracketFromParticipants,
  generateSingleElimBracketFromParticipants,
  safeParseBracketJson,
  type TournamentBracket,
} from "../../../../lib/bracket";

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

function authHeaders(secret: string): HeadersInit {
  const s = secret.trim();
  return s ? { Authorization: `Bearer ${s}` } : {};
}

export default function AdminBracketEditPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const [secret, setSecret] = useState("");
  const ready = secret.trim().length > 0;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tournament, setTournament] = useState<TournamentRow | null>(null);
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!ready) {
        setTournament(null);
        setBracket(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/tournaments", {
          headers: { ...authHeaders(secret) },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { rows?: TournamentRow[] };
        const rows = Array.isArray(data.rows) ? data.rows : [];
        const t = rows.find((r) => r.id === id) ?? null;
        if (!t) throw new Error("Tournament not found");

        const fromDb = safeParseBracketJson(t.bracketJson ?? null);
        const generated =
          !fromDb && t.type === "bracket" && t.participantsCsv
            ? String(t.bracketFormat ?? "").toLowerCase() === "double_elim"
              ? generateDoubleElimBracketFromParticipants(t.participantsCsv, {
                  tournamentId: t.id,
                  losersBracketStartsRound: t.losersBracketStartsRound ?? 1,
                })
              : generateSingleElimBracketFromParticipants(t.participantsCsv, t.id)
            : null;

        if (cancelled) return;
        setTournament(t);
        setBracket(fromDb ?? generated);
      } catch (e) {
        if (!cancelled) {
          setTournament(null);
          setBracket(null);
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [ready, secret, id]);

  const canSave = useMemo(() => ready && !!tournament && !!bracket && !saving, [ready, tournament, bracket, saving]);

  async function save() {
    if (!tournament || !bracket) return;

    setSaving(true);
    setError(null);
    try {
      const body: Partial<TournamentRow> = {
        id: tournament.id,
        name: tournament.name,
        startsAt: tournament.startsAt,
        endsAt: tournament.endsAt,
        participantsCsv: tournament.participantsCsv,
        type: tournament.type,
        bracketFormat: tournament.bracketFormat ?? null,
        losersBracketStartsRound: tournament.losersBracketStartsRound ?? null,
        prizepool: tournament.prizepool ?? null,
        winner: tournament.winner ?? null,
        bracketJson: JSON.stringify(bracket),
      };

      const res = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeaders(secret) },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={"Editar Bracket"}
        subtitle={"Admin only. Preencha apenas os slots vazios."}
        right={
          <Link
            href="/admin"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Voltar
          </Link>
        }
      />

      <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="text-sm font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200">Torneio</div>
        <div className="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{id}</div>

        <input
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="ADMIN_SECRET"
          className="font-minecraft mt-4 w-full rounded-xl border border-zinc-200 bg-white px-5 py-4 text-sm font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 focus:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {loading ? <div className="text-xs font-semibold text-zinc-500">Carregando…</div> : null}
            {error ? <div className="text-xs font-semibold text-red-600">{error}</div> : null}
            {!loading && ready && tournament ? (
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">
                {tournament.name}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            disabled={!canSave}
            onClick={() => void save()}
            className={
              "font-minecraft rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider shadow-sm transition-all " +
              (canSave
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500")
            }
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>

      {bracket ? (
        <BracketEditView
          bracket={bracket}
          onChange={(next) => {
            setBracket(next);
          }}
        />
      ) : ready && !loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 text-sm font-semibold text-zinc-700 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-200">
          Nenhum bracket para editar.
        </div>
      ) : null}
    </div>
  );
}
