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
  especialidade?: string;
  medico?: string;
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
let pacientes: Paciente[] = [
  {
    id: "p-maria", nome: "Maria da Silva", horario_agendado: "15:30", horario_chegada: "15:18",
    prioridade: "normal", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
    especialidade: "Clínica Geral", medico: "Dra. Helena Ribeiro",
  },
  {
    id: "p-jorge", nome: "Jorge dos Santos", horario_agendado: "15:45", horario_chegada: "15:28",
    prioridade: "idoso", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
    especialidade: "Geriatria", medico: "Dr. Paulo Andrade",
  },
  {
    id: "p-miguel", nome: "Miguel Batista", horario_agendado: "17:00", horario_chegada: "17:30",
    prioridade: "deficiencia", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
    especialidade: "Ortopedia", medico: "Dr. Rafael Lima",
  },
  {
    id: "p-abner", nome: "Abner Amorim", horario_agendado: "17:30", horario_chegada: "17:27",
    prioridade: "normal", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
    especialidade: "Cardiologia", medico: "Dr. Carlos Mendes",
  },
  {
    id: "p-pitch", nome: "Pitch", horario_agendado: "17:00", horario_chegada: "17:02",
    prioridade: "normal", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
    especialidade: "Clínica Geral", medico: "Dra. Helena Ribeiro",
  },
  {
    id: "p-ana", nome: "Ana Beatriz Lima", horario_agendado: "15:00", horario_chegada: "14:55",
    prioridade: "normal", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
    especialidade: "Dermatologia", medico: "Dra. Fernanda Costa",
  },
  {
    id: "p-roberto", nome: "Roberto Carlos Dias", horario_agendado: "15:15", horario_chegada: "15:10",
    prioridade: "idoso", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
    especialidade: "Geriatria", medico: "Dr. Paulo Andrade",
  },
  {
    id: "p-juliana", nome: "Juliana Martins", horario_agendado: "16:00", horario_chegada: "16:05",
    prioridade: "gestante", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
    especialidade: "Ginecologia", medico: "Dra. Carla Souza",
  },
  {
    id: "p-fernando", nome: "Fernando Henrique", horario_agendado: "16:30", horario_chegada: "16:40",
    prioridade: "normal", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
    especialidade: "Ortopedia", medico: "Dr. Rafael Lima",
  },
  {
    id: "p-beatriz", nome: "Beatriz Cristina", horario_agendado: "18:00", horario_chegada: "17:50",
    prioridade: "normal", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
    especialidade: "Cardiologia", medico: "Dr. Carlos Mendes",
  },
  {
    id: "p-lucas", nome: "Lucas Oliveira", horario_agendado: "14:45", horario_chegada: "14:42",
    prioridade: "urgente", tipo_consulta: "primeira_vez", risco_no_show: 0.1,
    checked_in: true, checkin_time: Date.now(),
    especialidade: "Clínica Geral", medico: "Dra. Helena Ribeiro",
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

export function registrarPaciente(p: Omit<Paciente, "id" | "checked_in" | "checkin_time">) {
  pacientes = [...pacientes, { ...p, id: crypto.randomUUID(), checked_in: false, checkin_time: null }];
  emit();
}

export function checkInPaciente(id: string) {
  pacientes = pacientes.map((p) =>
    p.id === id ? { ...p, checked_in: true, checkin_time: Date.now() } : p,
  );
  emit();
}

export function checkInByNome(nome: string): boolean {
  const target = pacientes.find((p) => p.nome === nome && !p.checked_in);
  if (!target) return false;
  pacientes = pacientes.map((p) =>
    p.id === target.id ? { ...p, checked_in: true, checkin_time: Date.now() } : p,
  );
  emit();
  return true;
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

// Tick periódico para recalcular tempo de espera
if (typeof window !== "undefined") {
  setInterval(() => emit(), 30_000);
}
