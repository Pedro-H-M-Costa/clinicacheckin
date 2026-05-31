import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { adicionarPaciente, type Prioridade, type TipoConsulta } from "@/lib/queue-store";

export const Route = createFileRoute("/totem")({
  component: TotemCheckin,
  head: () => ({
    meta: [
      { title: "Check-in — Clínica Vitae" },
      { name: "description", content: "Registre sua chegada na clínica." },
    ],
  }),
});

function TotemCheckin() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [horario, setHorario] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("normal");
  const [tipo, setTipo] = useState<TipoConsulta>("primeira_vez");
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !horario) return;
    const agora = new Date();
    const chegada = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    adicionarPaciente({
      nome,
      horario_agendado: horario,
      horario_chegada: chegada,
      prioridade,
      tipo_consulta: tipo,
      risco_no_show: 0.1,
    });

    setSucesso(true);
    setTimeout(() => navigate({ to: "/recepcao" }), 1500);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-foreground">Check-in do Paciente</h1>
          <Link
            to="/recepcao"
            className="rounded-xl border-2 border-border bg-card px-5 py-2 text-base font-semibold text-foreground hover:bg-accent"
          >
            Ver Painel
          </Link>
        </div>

        {sucesso ? (
          <div className="rounded-3xl border-2 border-primary bg-primary/10 p-10 text-center">
            <p className="text-3xl font-bold text-primary">Check-in confirmado!</p>
            <p className="mt-2 text-muted-foreground">Redirecionando para o painel…</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Nome completo</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg text-foreground outline-none focus:border-primary"
                placeholder="Maria da Silva"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Horário agendado</label>
              <input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                required
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Prioridade</label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as Prioridade)}
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg text-foreground outline-none focus:border-primary"
              >
                <option value="normal">Normal</option>
                <option value="idoso">Idoso</option>
                <option value="gestante">Gestante</option>
                <option value="deficiencia">Pessoa com deficiência</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Tipo de consulta</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoConsulta)}
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg text-foreground outline-none focus:border-primary"
              >
                <option value="primeira_vez">Primeira vez (20 min)</option>
                <option value="retorno">Retorno (10 min)</option>
                <option value="exame">Exame (25 min)</option>
                <option value="procedimento">Procedimento (30 min)</option>
              </select>
            </div>

            <button
              type="submit"
              className="h-16 w-full rounded-2xl bg-[image:var(--gradient-primary)] text-xl font-bold text-primary-foreground shadow-[var(--shadow-touch)] transition-all active:scale-[0.98]"
            >
              Confirmar chegada
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
