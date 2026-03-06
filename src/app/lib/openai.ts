const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const API_URL = "https://api.openai.com/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function gptComplete(
  messages: ChatMessage[],
  model = "gpt-4o-mini",
  maxTokens = 500
): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error("VITE_OPENAI_API_KEY não configurado");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.4 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `OpenAI error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

// ── Helpers de domínio ──────────────────────────────────────────────────

export async function classifyMessageAI(texto: string): Promise<string> {
  const content = await gptComplete([
    {
      role: "system",
      content:
        "Você é um assistente de auditoria ISO. Classifique a mensagem do usuário em UMA das categorias: geral, duvida, evidencia, urgencia, bloqueio. Responda SOMENTE com a palavra da categoria, sem pontuação.",
    },
    { role: "user", content: texto },
  ], "gpt-4o-mini", 10);
  const valid = ["geral", "duvida", "evidencia", "urgencia", "bloqueio"];
  return valid.includes(content.toLowerCase()) ? content.toLowerCase() : "geral";
}

export async function aiSuggestionGPT(
  classificacao: string,
  mensagem: string
): Promise<string> {
  return gptComplete([
    {
      role: "system",
      content:
        "Você é Carlos Silva, consultor de auditoria ISO. Responda de forma profissional, direta e em português, em até 2 frases.",
    },
    {
      role: "user",
      content: `Mensagem do cliente (classificação: ${classificacao}): "${mensagem}"`,
    },
  ], "gpt-4o-mini", 120);
}

export async function generateMeetingSummary(
  titulo: string,
  participantes: string[],
  transcricao: string
): Promise<string> {
  return gptComplete([
    {
      role: "system",
      content:
        "Você é um assistente especializado em reuniões de consultoria ISO. Gere um resumo executivo claro e objetivo em português, destacando: decisões tomadas, próximos passos e pontos de atenção. Use bullets.",
    },
    {
      role: "user",
      content: `Reunião: ${titulo}\nParticipantes: ${participantes.join(", ")}\n\nTranscrição:\n${transcricao}`,
    },
  ], "gpt-4o-mini", 400);
}

export async function generateRAI(params: {
  auditoria: string;
  cliente: string;
  norma: string;
  auditor: string;
  dataInicio: string;
  dataFim: string;
  findings: { tipo: string; clausula: string; descricao: string }[];
}): Promise<string> {
  const findingsText = params.findings
    .map((f, i) => `${i + 1}. [${f.tipo.toUpperCase()}] Cláusula ${f.clausula}: ${f.descricao}`)
    .join("\n");

  return gptComplete([
    {
      role: "system",
      content:
        "Você é um auditor líder ISO certificado. Gere um Relatório de Auditoria Interna (RAI) profissional em português com: Sumário Executivo, Escopo, Metodologia, Constatações detalhadas e Conclusão. Use linguagem técnica e formal.",
    },
    {
      role: "user",
      content: `Auditoria: ${params.auditoria}
Cliente: ${params.cliente}
Norma: ${params.norma}
Auditor líder: ${params.auditor}
Período: ${params.dataInicio} a ${params.dataFim}

Constatações:
${findingsText}`,
    },
  ], "gpt-4o-mini", 1000);
}

export async function generateDashboardInsights(data: {
  totalProjetos: number;
  projetosAtivos: number;
  totalAuditorias: number;
  ncsAbertas: number;
  taxaConformidade: number;
  clientes: number;
}): Promise<{ recomendacao: string; alertas: string[] }> {
  const texto = await gptComplete([
    {
      role: "system",
      content:
        "Você é um consultor sênior de sistemas de gestão ISO. Analise os indicadores e retorne um JSON com: recomendacao (string, 1 parágrafo de recomendação prioritária) e alertas (array de strings, até 3 alertas críticos). Responda SOMENTE com JSON válido.",
    },
    {
      role: "user",
      content: JSON.stringify(data),
    },
  ], "gpt-4o-mini", 300);

  try {
    const clean = texto.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      recomendacao: texto,
      alertas: [],
    };
  }
}
