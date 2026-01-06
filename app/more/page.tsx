import { PageHeader } from "../../components/page-header";

export default function MorePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mais"
        subtitle="Links, guias e informações da comunidade MCSR BR."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Links</div>
          <div className="mt-2 space-y-2 text-sm">
            <a className="block font-semibold text-emerald-600" href="https://discord.com" target="_blank" rel="noreferrer">
              Discord
            </a>
            <a className="block font-semibold text-emerald-600" href="https://www.youtube.com/@MinecraftSpeedrunBrasil/featured" target="_blank" rel="noreferrer">
              Youtube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
