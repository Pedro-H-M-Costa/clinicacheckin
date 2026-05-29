import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Fingerprint, IdCard, CheckCircle2, Clock, User, AlertCircle, Smile, Phone, Calendar, SearchX, AlarmClock } from "lucide-react";
import { TotemLayout } from "@/components/totem/TotemLayout";
import { BigButton } from "@/components/totem/BigButton";
import { Numpad } from "@/components/totem/Numpad";
import { checkInPaciente, type Prioridade } from "@/lib/queue-store";

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

type Step =
  | "welcome"
  | "method"
  | "cpf"
  | "convenio"
  | "confirmCpf"
  | "confirmConvenio"
  | "atrasoSevero"
  | "ticket"
  | "notFound"
  | "outraData";

interface PatientRecord {
  id: string;
  nome: string;
  horario_agendado: string;
  horario_chegada: string;
  prioridade: Prioridade;
  especialidade: string;
  medico: string;
}

interface LookupEntry {
  cpf: string; // 11 digits
  convenio: string; // 16 digits
  patient: PatientRecord | "otherDate";
}

const LOOKUP: LookupEntry[] = [
  {
    cpf: "22222222222",
    convenio: "2222222222222222",
    patient: {
      id: "lk-maria",
      nome: "Maria da Silva",
      horario_agendado: "14:30",
      horario_chegada: "14:18",
      prioridade: "normal",
      especialidade: "Clínica Geral",
      medico: "Dra. Helena Ribeiro",
    },
  },
  {
    cpf: "33333333333",
    convenio: "3333333333333333",
    patient: {
      id: "lk-jorge",
      nome: "Jorge dos Santos",
      horario_agendado: "14:45",
      horario_chegada: "14:28",
      prioridade: "idoso",
      especialidade: "Geriatria",
      medico: "Dr. Paulo Andrade",
    },
  },
  {
    cpf: "44444444444",
    convenio: "4444444444444444",
    patient: "otherDate",
  },
  {
    cpf: "55555555555",
    convenio: "5555555555555555",
    patient: {
      id: "lk-miguel",
      nome: "Miguel Batista",
      horario_agendado: "14:00",
      horario_chegada: "14:30",
      prioridade: "deficiencia",
      especialidade: "Ortopedia",
      medico: "Dr. Rafael Lima",
    },
  },
  {
    cpf: "66666666666",
    convenio: "6666666666666666",
    patient: {
      id: "lk-abner",
      nome: "Abner Amorim",
      horario_agendado: "15:00",
      horario_chegada: "14:57",
      prioridade: "normal",
      especialidade: "Cardiologia",
      medico: "Dr. Carlos Mendes",
    },
  },
];

function lookupByCpf(cpf: string): PatientRecord | "otherDate" | null {
  return LOOKUP.find((e) => e.cpf === cpf)?.patient ?? null;
}
function lookupByConvenio(c: string): PatientRecord | "otherDate" | null {
  return LOOKUP.find((e) => e.convenio === c)?.patient ?? null;
}

function TotemPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [cpf, setCpf] = useState("");
  const [convenio, setConvenio] = useState("");
  const [current, setCurrent] = useState<PatientRecord | null>(null);

  const reset = () => {
    setStep("welcome");
    setCpf("");
    setConvenio("");
    setCurrent(null);
  };

  const formatCpfDisplay = (v: string) => {
    const padded = v.padEnd(11, "•").slice(0, 11);
    return `${padded.slice(0, 3)}.${padded.slice(3, 6)}.${padded.slice(6, 9)}-${padded.slice(9, 11)}`;
  };

  const formatConvenioDisplay = (v: string) => {
    const padded = v.padEnd(16, "•").slice(0, 16);
    return `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 12)} ${padded.slice(12, 16)}`;
  };

  const handleCpfConfirm = () => {
    const result = lookupByCpf(cpf);
    if (result === null) return setStep("notFound");
    if (result === "otherDate") return setStep("outraData");
    setCurrent(result);
    if (result.id === "lk-miguel") return setStep("atrasoSevero");
    setStep("confirmCpf");
  };

  const handleConvenioConfirm = () => {
    const result = lookupByConvenio(convenio);
    if (result === null) return setStep("notFound");
    if (result === "otherDate") return setStep("outraData");
    setCurrent(result);
    if (result.id === "lk-miguel") return setStep("atrasoSevero");
    setStep("confirmConvenio");
  };
  const finalizeCheckin = () => {
    if (current) {
      checkInPaciente(current.id);
    }
    setStep("ticket");
  };


  // ---------- WELCOME ----------
  if (step === "welcome") {
    return (
      <TotemLayout hideBack>
        <div className="flex w-full flex-col items-center text-center">
          <div className="mb-12 flex h-40 w-40 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-touch)]">
            <Smile className="h-24 w-24 text-primary-foreground" strokeWidth={2.5} />
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
              title="Cartão do Convênio"
              subtitle="Digite os 16 números do seu cartão"
              icon={<IdCard className="h-14 w-14" />}
              onClick={() => setStep("convenio")}
            />
            <BigButton
              variant="secondary"
              title="CPF"
              subtitle="Digite os 11 números do seu CPF"
              icon={<Fingerprint className="h-14 w-14" />}
              onClick={() => setStep("cpf")}
            />
          </div>
        </div>
      </TotemLayout>
    );
  }

  // ---------- CONVÊNIO ----------
  if (step === "convenio") {
    return (
      <TotemLayout onBack={() => setStep("method")}>
        <div className="flex w-full flex-col items-center">
          <h1 className="text-5xl font-bold text-foreground text-center">
            Digite o número do seu cartão de convênio
          </h1>
          <p className="mt-3 text-2xl text-muted-foreground">{"\u200B"}</p>

          <div className="my-10 w-full rounded-3xl border-2 border-primary/30 bg-card px-10 py-8 text-center shadow-[var(--shadow-card)]">
            <p className="font-mono text-6xl font-bold tracking-wider text-primary tabular-nums">
              {formatConvenioDisplay(convenio)}
            </p>
          </div>

          <Numpad value={convenio} onChange={setConvenio} maxLength={16} />

          <button
            disabled={convenio.length < 16}
            onClick={handleConvenioConfirm}
            className="mt-8 h-24 w-full rounded-3xl bg-[image:var(--gradient-primary)] text-3xl font-bold text-primary-foreground shadow-[var(--shadow-touch)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            Confirmar
          </button>
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
              {formatCpfDisplay(cpf)}
            </p>
          </div>

          <Numpad value={cpf} onChange={setCpf} maxLength={11} />

          <button
            disabled={cpf.length < 11}
            onClick={handleCpfConfirm}
            className="mt-8 h-24 w-full rounded-3xl bg-[image:var(--gradient-primary)] text-3xl font-bold text-primary-foreground shadow-[var(--shadow-touch)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            Confirmar
          </button>
        </div>
      </TotemLayout>
    );
  }

  // ---------- CONFIRM CPF ----------
  if (step === "confirmCpf" && current) {
    return (
      <TotemLayout onBack={() => setStep("cpf")}>
        <div className="flex w-full flex-col">
          <h1 className="text-5xl font-bold text-foreground">Confirme seus dados</h1>
          <p className="mt-3 text-2xl text-muted-foreground">
            Verifique se as informações estão corretas
          </p>

          <div className="mt-10 space-y-5">
            <InfoRow icon={<User />} label="Paciente" value={current.nome} />
            <InfoRow icon={<IdCard />} label="CPF" value={formatCpfDisplay(cpf)} />
            <InfoRow
              icon={<Clock />}
              label="Consulta agendada"
              value={`${current.horario_agendado} — ${current.medico}`}
              accent
            />
            <InfoRow icon={<AlertCircle />} label="Especialidade" value={current.especialidade} />
          </div>

          <button
            onClick={finalizeCheckin}
            className="mt-10 h-28 w-full rounded-3xl bg-[image:var(--gradient-primary)] text-4xl font-bold text-primary-foreground shadow-[var(--shadow-touch)] transition-all active:scale-[0.98]"
          >
            Confirmar
          </button>
        </div>
      </TotemLayout>
    );
  }

  // ---------- CONFIRM CONVÊNIO ----------
  if (step === "confirmConvenio" && current) {
    return (
      <TotemLayout onBack={() => setStep("convenio")}>
        <div className="flex w-full flex-col">
          <h1 className="text-5xl font-bold text-foreground">Confirme seus dados</h1>
          <p className="mt-3 text-2xl text-muted-foreground">
            Verifique se as informações estão corretas
          </p>

          <div className="mt-10 space-y-5">
            <InfoRow icon={<User />} label="Paciente" value={current.nome} />
            <InfoRow
              icon={<IdCard />}
              label="Número do cartão do convênio"
              value={formatConvenioDisplay(convenio)}
            />
            <InfoRow
              icon={<Clock />}
              label="Consulta agendada"
              value={`${current.horario_agendado} — ${current.medico}`}
              accent
            />
            <InfoRow icon={<AlertCircle />} label="Especialidade" value={current.especialidade} />
          </div>

          <button
            onClick={finalizeCheckin}
            className="mt-10 h-28 w-full rounded-3xl bg-[image:var(--gradient-primary)] text-4xl font-bold text-primary-foreground shadow-[var(--shadow-touch)] transition-all active:scale-[0.98]"
          >
            Confirmar
          </button>
        </div>
      </TotemLayout>
    );
  }

  // ---------- OUTRA DATA ----------
  if (step === "outraData") {
    return (
      <TotemLayout onBack={reset} backLabel="Voltar ao início">
        <div className="flex w-full flex-col items-center text-center">
          <div className="mb-8 flex h-40 w-40 items-center justify-center rounded-full bg-accent">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary shadow-[var(--shadow-touch)]">
              <Calendar className="h-16 w-16 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-foreground">
            Agendamento em outra data
          </h1>
          <p className="mt-4 max-w-xl text-2xl text-muted-foreground">
            Localizamos seu cadastro, mas sua consulta não está marcada para hoje.
          </p>

          <div className="mt-10 w-full rounded-3xl border border-border bg-card p-8 text-left shadow-[var(--shadow-card)]">
            <p className="text-lg font-semibold uppercase tracking-wider text-muted-foreground">
              O que fazer?
            </p>
            <div className="mt-6 flex items-start gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                <Phone className="h-7 w-7" />
              </div>
              <p className="pt-2 text-2xl text-foreground">
                Confirme a data do seu agendamento na recepção ou retorne no dia correto.
              </p>
            </div>
          </div>

          <button
            onClick={reset}
            className="mt-10 h-24 w-full rounded-3xl bg-[image:var(--gradient-primary)] text-3xl font-bold text-primary-foreground shadow-[var(--shadow-touch)] transition-all active:scale-[0.98]"
          >
            Concluir
          </button>
        </div>
      </TotemLayout>
    );
  }

  // ---------- ATRASO SEVERO ----------
  if (step === "atrasoSevero" && current) {
    return (
      <TotemLayout onBack={reset} backLabel="Cancelar operação">
        <div className="flex w-full flex-col items-center text-center">
          <div
            className="mb-8 flex h-40 w-40 items-center justify-center rounded-full"
            style={{ backgroundColor: "#F59E0B22" }}
          >
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full shadow-[var(--shadow-touch)]"
              style={{ backgroundColor: "#F59E0B" }}
            >
              <AlarmClock className="h-16 w-16 text-white" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-foreground">Atraso Severo.</h1>
          <p className="mt-4 max-w-xl text-2xl text-muted-foreground">
            Seu agendamento era às {current.horario_agendado}. Sua chegada será registrada,
            mas seu atendimento será feito como encaixe, sujeito a um tempo de espera maior.
          </p>

          <div className="mt-10 flex w-full flex-col gap-5">
            <button
              onClick={finalizeCheckin}
              className="h-24 w-full rounded-3xl text-3xl font-bold text-white shadow-[var(--shadow-touch)] transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#F59E0B" }}
            >
              Estou ciente, quero aguardar o encaixe.
            </button>
            <button
              onClick={reset}
              className="h-24 w-full rounded-3xl border-2 border-border bg-card text-2xl font-semibold text-foreground active:scale-[0.98]"
            >
              Prefiro falar com a recepção.
            </button>
          </div>

          <button
            onClick={reset}
            className="mt-8 text-xl font-medium text-muted-foreground underline underline-offset-4"
          >
            Cancelar operação
          </button>
        </div>
      </TotemLayout>
    );
  }

  // ---------- NOT FOUND ----------
  if (step === "notFound") {
    return (
      <TotemLayout onBack={reset} backLabel="Voltar ao início">
        <div className="flex w-full flex-col items-center text-center">
          <div className="mb-8 flex h-40 w-40 items-center justify-center rounded-full bg-destructive/15">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-destructive shadow-[var(--shadow-touch)]">
              <SearchX className="h-16 w-16 text-destructive-foreground" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-foreground">
            Agendamento não encontrado
          </h1>
          <p className="mt-4 max-w-xl text-2xl text-muted-foreground">
            Não encontramos um agendamento com os dados informados.
          </p>

          <div className="mt-10 w-full rounded-3xl border border-border bg-card p-8 text-left shadow-[var(--shadow-card)]">
            <p className="text-lg font-semibold uppercase tracking-wider text-muted-foreground">
              O que fazer?
            </p>
            <div className="mt-6 flex items-start gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                <Phone className="h-7 w-7" />
              </div>
              <p className="pt-2 text-2xl text-foreground">
                Dirija-se à recepção para que possamos verificar sua situação.
              </p>
            </div>
          </div>

          <button
            onClick={reset}
            className="mt-10 h-24 w-full rounded-3xl bg-[image:var(--gradient-primary)] text-3xl font-bold text-primary-foreground shadow-[var(--shadow-touch)] transition-all active:scale-[0.98]"
          >
            Voltar ao início
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
          <Stat label="Paciente" value={current?.nome ?? "—"} />
          <Stat label="Consulta" value={current?.horario_agendado ?? "—"} highlight />
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
