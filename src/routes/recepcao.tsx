import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, AlertTriangle, Clock, Lightbulb } from "lucide-react";
import {
  calcularFila,
  calcularHorarioPrevisto,
  usePacientes,
  removerPaciente,
  type Prioridade,
} from "@/lib/queue-store";
import { aiDashboard } from "@/lib/ai-dashboard.functions";

export const Route = createFileRoute("/recepcao")({
  component: RecepcaoPage,
  head: () => ({
    meta: [
      { title: "Painel da Recepção — Clínica Vitae" },
      { name: "description", content: "Painel inteligente de fila de atendimento da recepção." },
    ],
  }),
});

const prioridadeLabel: Record<Prioridade, string> = {
  normal: "Normal",
  idoso: "Idoso",
  gestante: "Gestante",
  deficiencia: "Deficiência",
  urgente: "Urgente",
};

const prioridadeBadge: Record<Prioridade, string> = {
  normal: "bg-secondary text-secondary-foreground",
  idoso: "bg-accent text-accent-foreground",
  gestante: "bg-accent text-accent-foreground",
  deficiencia: "bg-accent text-accent-foreground",
  urgente: "bg-destructive text-destructive-foreground",
};
function RecepcaoPage() {
  const pacientes = usePacientes();
  const fila = useMemo(() => calcularFila(pacientes), [pacientes]);
  const callAi = useServerFn(aiDashboard);
  const [ai, setAi] = useState<{
    pico_esperado: string;
    sugestao: string;
    alerta: boolean;
    motivo_alerta: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchAi = async () => {
      setAiLoading(true);
      try {
        const result = await callAi({
          data: {
            pacientes: pacientes.map((p) => ({
              nome: p.nome,
              horario_agendado: p.horario_agendado,
              horario_chegada: p.horario_chegada,
            })),
          },
        });
        if (!cancelled) setAi(result);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    };
    fetchAi();
    const id = setInterval(fetchAi, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [callAi, pacientes]);



  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Painel da Recepção</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Fila inteligente · {fila.length} paciente(s)
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/"
              className="rounded-xl border-2 border-border bg-card px-6 py-3 text-lg font-semibold text-foreground hover:bg-accent"
            >
              Ir para Check-in
            </Link>
          </div>
        </header>

        <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Insights da fila (IA)</h2>
            {aiLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          {ai?.alerta && (
            <div className="mb-4 flex items-start gap-3 rounded-xl bg-destructive px-4 py-3 text-destructive-foreground">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold">{ai.motivo_alerta}</p>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
              <Clock className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Pico esperado</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {ai?.pico_esperado ?? (aiLoading ? "Carregando…" : "—")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
              <Lightbulb className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Sugestão</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {ai?.sugestao ?? (aiLoading ? "Carregando…" : "—")}
                </p>
              </div>
            </div>
          </div>
        </div>


        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <table className="w-full text-left">
            <thead className="bg-muted text-sm uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Prioridade</th>
                <th className="px-4 py-3">Agendado</th>
                <th className="px-4 py-3">Chegada</th>
                <th className="px-4 py-3">Espera</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Previsão</th>
                <th className="px-4 py-3">Alerta</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {fila.map((p, idx) => {
                const previsao = calcularHorarioPrevisto(fila, idx);
                const isPrioritario = p.prioridade !== "normal";
                const alertas: string[] = [];
                if (p.minutos_esperando > 40) alertas.push(`Esperando ${p.minutos_esperando}min`);
                if (isPrioritario && idx > 1) alertas.push("Prioritário fora do top 2");
                if (p.risco_no_show > 0.7) alertas.push("Alto risco no-show");

                return (
                  <tr
                    key={p.id}
                    className={`border-t border-border ${alertas.length ? "bg-destructive/5" : ""}`}
                  >
                    <td className="px-4 py-4 text-xl font-bold text-primary">{idx + 1}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-foreground">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">{p.tipo_consulta.replace("_", " ")}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${prioridadeBadge[p.prioridade]}`}
                      >
                        {prioridadeLabel[p.prioridade]}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-foreground">{p.horario_agendado}</td>
                    <td className="px-4 py-4 font-mono text-foreground">
                      {p.horario_chegada ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-4 text-foreground">{p.minutos_esperando} min</td>
                    <td className="px-4 py-4 font-mono font-bold text-foreground">{p.score}</td>
                    <td className="px-4 py-4 font-mono font-bold text-primary">{previsao}</td>
                    <td className="px-4 py-4">
                      {alertas.length ? (
                        <div className="space-y-1">
                          {alertas.map((a) => (
                            <span
                              key={a}
                              className="block rounded-md bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">OK</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => removerPaciente(p.id)}
                        className="rounded-lg border border-border px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
                      >
                        Chamar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!fila.length && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum paciente na fila.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <strong className="text-foreground">Regras de score:</strong> Prioridade (urgente=100,
          idoso/gestante/deficiência=70) · Pontualidade (adiantado=+40, ≤15min=+20, ≤30min=+5,
          não chegou=-20) · +1pt por min esperando · -(risco × 30)
        </div>
      </div>
    </div>
  );
}
