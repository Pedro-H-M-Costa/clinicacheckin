import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Fingerprint, IdCard, CheckCircle2, Clock, User, AlertCircle, Check } from "lucide-react";
import { TotemLayout } from "@/components/totem/TotemLayout";
import { BigButton } from "@/components/totem/BigButton";
import { Numpad } from "@/components/totem/Numpad";

export const Route = createFileRoute("/")({
  component: TotemPage,
  head: () => ({
    meta: [
      { title: "Totem de Atendimento — Clínica Vitae" },
      {
        name: "description",
        content:
          "Totem de auto check-in para pacientes com agendamento. Registre sua chegada e acompanhe sua posição na fila.",
      },
    ],
  }),
});

type Step = "welcome" | "method" | "cpf" | "confirm" | "ticket";

function TotemPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [cpf, setCpf] = useState("");

  const reset = () => {
    setStep("welcome");
    setCpf("");
  };

  const formatCpf = (v: string) =>
    v
      .padEnd(11, "•")
      .slice(0, 11)
      .replace(/(.{3})(.{3})(.{3})(.{2})/, "$1.$2.$3-$4");

  // ---------- WELCOME ----------
  if (step === "welcome") {
    return (
      <TotemLayout hideBack>
        <div className="flex w-full flex-col items-center text-center">
          <div className="mb-12 flex h-40 w-40 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-touch)]">
            <CheckCircle2 className="h-24 w-24 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-7xl font-bold leading-tight text-foreground">
            Bem-vindo(a)
          </h1>
          <p className="mt-6 max-w-2xl text-3xl text-muted-foreground">
            Registre sua chegada de forma rápida e autônoma
          </p>

          <div className="mt-16 w-full">
            <BigButton
              title="Toque para iniciar"
              subtitle="Faça seu check-in em menos de 30 segundos"
              icon={<CheckCircle2 className="h-14 w-14" strokeWidth={2.5} />}
              onClick={() => setStep("method")}
            />
          </div>

          <p className="mt-12 text-xl text-muted-foreground">
            Já possui agendamento? Aqui você confirma sua presença.
          </p>
        </div>
      </TotemLayout>
    );
  }

  // ---------- METHOD ----------
  if (step === "method") {
    return (
      <TotemLayout onBack={reset}>
        <div className="flex w-full flex-col">
          <h1 className="text-6xl font-bold leading-tight text-foreground">
            Como deseja se identificar?
          </h1>
          <p className="mt-4 text-2xl text-muted-foreground">
            Escolha uma das opções abaixo
          </p>

          <div className="mt-12 flex w-full flex-col gap-6">
            <BigButton
              title="CPF"
              subtitle="Digite os 11 números do seu documento"
              icon={<IdCard className="h-14 w-14" />}
              onClick={() => setStep("cpf")}
            />
            <BigButton
              variant="secondary"
              title="Cartão da clínica"
              subtitle="Aproxime seu cartão do leitor abaixo"
              icon={<Fingerprint className="h-14 w-14" />}
              onClick={() => setStep("cpf")}
            />
          </div>
        </div>
      </TotemLayout>
    );
  }

  // ---------- CPF ----------
  if (step === "cpf") {
    return (
      <TotemLayout onBack={() => setStep("method")}>
        <div className="flex w-full flex-col items-center">
          <h1 className="text-5xl font-bold text-foreground text-center">
            Digite seu CPF
          </h1>
          <p className="mt-3 text-2xl text-muted-foreground">
            Apenas os números, sem pontos ou traço
          </p>

          <div className="my-10 w-full rounded-3xl border-2 border-primary/30 bg-card px-10 py-8 text-center shadow-[var(--shadow-card)]">
            <p className="font-mono text-6xl font-bold tracking-wider text-primary tabular-nums">
              {formatCpf(cpf)}
            </p>
          </div>

          <Numpad value={cpf} onChange={setCpf} />

          <button
            disabled={cpf.length !== 11}
            onClick={() => setStep("confirm")}
            className="mt-8 h-24 w-full rounded-3xl bg-[image:var(--gradient-primary)] text-3xl font-bold text-primary-foreground shadow-[var(--shadow-touch)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            Confirmar
          </button>
        </div>
      </TotemLayout>
    );
  }

  // ---------- CONFIRM ----------
  if (step === "confirm") {
    return (
      <TotemLayout onBack={() => setStep("cpf")}>
        <div className="flex w-full flex-col">
          <h1 className="text-5xl font-bold text-foreground">
            Confirme seus dados
          </h1>
          <p className="mt-3 text-2xl text-muted-foreground">
            Verifique se as informações estão corretas
          </p>

          <div className="mt-10 space-y-5">
            <InfoRow icon={<User />} label="Paciente" value="Maria Silva Santos" />
            <InfoRow icon={<IdCard />} label="CPF" value={formatCpf(cpf)} />
            <InfoRow
              icon={<Clock />}
              label="Consulta agendada"
              value="14:30 — Dr. Carlos Mendes"
              accent
            />
            <InfoRow icon={<AlertCircle />} label="Especialidade" value="Cardiologia" />
          </div>

          <button
            onClick={() => setStep("ticket")}
            className="mt-10 h-28 w-full rounded-3xl bg-[image:var(--gradient-primary)] text-4xl font-bold text-primary-foreground shadow-[var(--shadow-touch)] transition-all active:scale-[0.98]"
          >
            Confirmar chegada
          </button>
        </div>
      </TotemLayout>
    );
  }

  // ---------- TICKET ----------
  return (
    <TotemLayout hideBack>
      <div className="flex w-full flex-col items-center text-center">
        <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-success shadow-[var(--shadow-touch)]">
          <CheckCircle2 className="h-20 w-20 text-success-foreground" strokeWidth={2.5} />
        </div>

        <h1 className="text-6xl font-bold text-foreground">Check-in realizado!</h1>
        <p className="mt-4 text-2xl text-muted-foreground">
          Aguarde ser chamado no painel
        </p>

        <div className="mt-10 w-full rounded-3xl border-2 border-border bg-card p-10 shadow-[var(--shadow-card)]">
          <p className="text-2xl font-medium text-muted-foreground">Sua senha</p>
          <p className="mt-2 font-mono text-9xl font-bold tracking-wider text-primary">
            A042
          </p>
        </div>

        <div className="mt-8 grid w-full grid-cols-2 gap-5">
          <Stat label="Posição na fila" value="3º" />
          <Stat label="Tempo estimado" value="~12 min" highlight />
        </div>

        <button
          onClick={reset}
          className="mt-10 h-20 w-full rounded-2xl border-2 border-border bg-card text-2xl font-semibold text-foreground active:scale-[0.98]"
        >
          Concluir
        </button>
      </div>
    </TotemLayout>
  );
}

function InfoRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-6 rounded-2xl border-2 px-8 py-6 ${
        accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${
          accent ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
        } [&_svg]:h-8 [&_svg]:w-8`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xl text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-6 ${
        highlight
          ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-touch)]"
          : "border-2 border-border bg-card text-foreground"
      }`}
    >
      <p className={`text-lg ${highlight ? "text-primary-foreground/85" : "text-muted-foreground"}`}>
        {label}
      </p>
      <p className="mt-1 text-4xl font-bold">{value}</p>
    </div>
  );
}
