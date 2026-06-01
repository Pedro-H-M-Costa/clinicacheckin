import { useSyncExternalStore } from "react";

export type Prioridade = "normal" | "idoso" | "gestante" | "deficiencia" | "urgente";
export type TipoConsulta = "primeira_vez" | "retorno" | "exame" | "procedimento";

export interface Paciente {
  id: string;
  nome: string;
  horario_agendado: string; // HH:MM
  horario_chegada: string | null; // HH:MM ou null
  prioridade: Prioridade;
  tipo_consulta: TipoConsulta;
  risco_no_show: number; // 0..1
  checked_in: boolean;
  checkin_time: number | null; // epoch ms
}

export interface PacienteCalculado extends Paciente {
  minutos_esperando: number;
  score: number;
}

const DURACAO: Record<TipoConsulta, number> = {
  primeira_vez: 20,
  retorno: 10,
  exame: 25,
  procedimento: 30,
};

function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHm(total: number): string {
  const t = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function scorePaciente(p: Paciente, agora: number): { score: number; minutos_esperando: number } {
  let score = 0;

  // Prioridade
  if (p.prioridade === "urgente") score += 100;
  else if (p.prioridade === "idoso" || p.prioridade === "gestante" || p.prioridade === "deficiencia") score += 70;

  // Pontualidade
  const agendado = hmToMinutes(p.horario_agendado);
  if (p.horario_chegada) {
    const chegada = hmToMinutes(p.horario_chegada);
    const diff = chegada - agendado; // positivo = atrasado
    if (diff < 0) score += 40;
    else if (diff <= 15) score += 20;
    else if (diff <= 30) score += 5;
    else score += 0;
  } else {
    score -= 20;
  }

  // Espera
  const minutos_esperando = p.horario_chegada
    ? Math.max(0, agora - hmToMinutes(p.horario_chegada))
    : 0;
  score += minutos_esperando;

  // No-show
  score -= p.risco_no_show * 30;

  return { score: Math.round(score), minutos_esperando };
}

export function calcularFila(pacientes: Paciente[]): PacienteCalculado[] {
  const agora = nowMinutes();
  return pacientes
    .map((p) => ({ ...p, ...scorePaciente(p, agora) }))
    .sort((a, b) => b.score - a.score);
}

export function calcularHorarioPrevisto(fila: PacienteCalculado[], posicao: number): string {
  const agora = nowMinutes();
  let total = agora;
  for (let i = 0; i < posicao; i++) {
    total += DURACAO[fila[i].tipo_consulta] ?? 20;
  }
  return minutesToHm(total);
}

// ---------- Store ----------
const mockInicial: Paciente[] = [
  {
    id: "1",
    nome: "Maria Silva Santos",
    horario_agendado: "09:00",
    horario_chegada: "08:55",
    prioridade: "idoso",
    tipo_consulta: "retorno",
    risco_no_show: 0.1,
    checked_in: true,
    checkin_time: Date.now(),
  },
];

let pacientes: Paciente[] = [
  {
    id: "p-maria", nome: "Maria da Silva", horario_agendado: "14:30", horario_chegada: "14:18",
    prioridade: "normal", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
  },
  {
    id: "p-jorge", nome: "Jorge dos Santos", horario_agendado: "14:45", horario_chegada: "14:28",
    prioridade: "idoso", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
  },
  {
    id: "p-miguel", nome: "Miguel Batista", horario_agendado: "14:00", horario_chegada: "14:30",
    prioridade: "deficiencia", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
  },
  {
    id: "p-abner", nome: "Abner Amorim", horario_agendado: "15:00", horario_chegada: "14:57",
    prioridade: "normal", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
  },
  {
    id: "p-rafael", nome: "Rafael Cardoso", horario_agendado: "14:50", horario_chegada: "14:52",
    prioridade: "normal", tipo_consulta: "primeira_vez", risco_no_show: 0.85,
    checked_in: true, checkin_time: Date.now(),
  },
];


const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function adicionarPaciente(p: Omit<Paciente, "id" | "checked_in" | "checkin_time">) {
  pacientes = [...pacientes, { ...p, id: crypto.randomUUID(), checked_in: true, checkin_time: Date.now() }];
  emit();
}

export function checkInPaciente(id: string) {
  pacientes = pacientes.map((p) =>
    p.id === id ? { ...p, checked_in: true, checkin_time: Date.now() } : p,
  );
  emit();
}


export function removerPaciente(id: string) {
  pacientes = pacientes.filter((p) => p.id !== id);
  emit();
}

export function usePacientes(): Paciente[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => pacientes,
    () => pacientes,
  );
}

if (typeof window !== "undefined") {
  setInterval(() => emit(), 30_000);
}


// Tick a cada minuto para recalcular tempo de espera
if (typeof window !== "undefined") {
  setInterval(() => emit(), 30_000);
}
