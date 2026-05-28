import { createServerFn } from "@tanstack/react-start";

interface PacienteInput {
  nome: string;
  horario_agendado: string;
  horario_chegada: string | null;
}

export const aiDashboard = createServerFn({ method: "POST" })
  .inputValidator((data: { pacientes: PacienteInput[] }) => data)
  .handler(async ({ data }) => {
    const now = new Date();
    const hora_atual = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const toMin = (hm: string) => {
      const [h, m] = hm.split(":").map(Number);
      return h * 60 + m;
    };

    let atrasados = 0;
    let proximos_30min = 0;
    for (const p of data.pacientes) {
      const ag = toMin(p.horario_agendado);
      if (p.horario_chegada && toMin(p.horario_chegada) > ag + 10) atrasados++;
      if (ag >= nowMin && ag - nowMin <= 30) proximos_30min++;
    }

    const context = {
      hora_atual,
      fila_atual: {
        especialidade: "Clínica Geral",
        total_checkin: data.pacientes.length,
        atrasados,
        proximos_30min,
      },
      historico_mock: {
        seg_sex: { "08:00": 8, "09:00": 22, "10:00": 38, "11:00": 31, "14:00": 29, "15:00": 45, "16:00": 33 },
        sabado: { "09:00": 52, "10:00": 61, "11:00": 48 },
      },
    };

    const apiKey = process.env.LOVABLE_API_KEY!;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              'Você é um assistente de gestão de filas de uma clínica médica. Com base nos dados de fila atual e histórico fornecidos, responda APENAS em JSON com: { pico_esperado: string, sugestao: string, alerta: boolean, motivo_alerta: string }. Seja direto e objetivo. Nunca invente dados além do contexto fornecido.',
          },
          { role: "user", content: JSON.stringify(context) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      throw new Error(`AI gateway error: ${res.status}`);
    }
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content ?? "{}";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    try {
      return JSON.parse(cleaned) as {
        pico_esperado: string;
        sugestao: string;
        alerta: boolean;
        motivo_alerta: string;
      };
    } catch {
      return { pico_esperado: "—", sugestao: text, alerta: false, motivo_alerta: "" };
    }
  });
