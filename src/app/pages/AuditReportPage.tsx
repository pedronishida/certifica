import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { DSBadge } from "../components/ds/DSBadge";
import { DSButton } from "../components/ds/DSButton";
import { DSInput } from "../components/ds/DSInput";
import { DSSelect } from "../components/ds/DSSelect";
import { DSTextarea } from "../components/ds/DSTextarea";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  History,
  Lightbulb,
  Printer,
  Save,
  Search,
  Send,
  User,
  XCircle,
} from "lucide-react";

type EvidenceStatus = "conforme" | "nao-conformidade" | "observacao" | "oportunidade" | "pendente";
type Severity = "baixa" | "media" | "alta" | "critica";
type WorkflowStatus = "rascunho" | "revisao-tecnica" | "aprovado" | "enviado-cliente";
type NormCode = "iso9001" | "iso14001" | "iso45001" | "iso50001" | "iso22000" | "fsc";

interface Evidence {
  id: string;
  titulo: string;
  processo: string;
  status: EvidenceStatus;
  initialNorm: NormCode;
  initialClause: string;
  initialEvidence: string;
}

interface ClauseOption {
  clause: string;
  title: string;
  text: string;
}

interface Revision {
  version: string;
  date: string;
  author: string;
  action: string;
}

interface RaiContextPayload {
  auditId?: string;
  client?: string;
  standard?: string;
  auditor?: string;
  classificacao?: string;
  requisito?: string;
  evidencia?: string;
  recomendacao?: string;
}

const evidenceList: Evidence[] = [
  {
    id: "EV-001",
    titulo: "Calibracao vencida de paquimetro digital",
    processo: "Producao",
    status: "nao-conformidade",
    initialNorm: "iso9001",
    initialClause: "7.1.5",
    initialEvidence:
      "Foi constatado em 18/02/2026 que o paquimetro patrimonio #1247 estava com certificado vencido desde 15/01/2026, contrariando o procedimento PQ-MC-003.",
  },
  {
    id: "EV-002",
    titulo: "Matriz de riscos sem revisao no ultimo ciclo",
    processo: "Qualidade",
    status: "nao-conformidade",
    initialNorm: "iso9001",
    initialClause: "6.1.1",
    initialEvidence:
      "Na entrevista com o gestor e na analise do registro RSK-02, a ultima revisao formal da matriz foi em setembro/2025, sem evidencia de atualizacao em mudancas recentes.",
  },
  {
    id: "EV-003",
    titulo: "Checklist de manutencao preventiva atualizado",
    processo: "Manutencao",
    status: "conforme",
    initialNorm: "iso14001",
    initialClause: "8.1",
    initialEvidence:
      "Foram verificados os registros de manutencao PM-11 e PM-12 com periodicidade cumprida e assinatura do responsavel tecnico.",
  },
  {
    id: "EV-004",
    titulo: "Oportunidade de padronizar onboarding de terceiros",
    processo: "SSO",
    status: "oportunidade",
    initialNorm: "iso45001",
    initialClause: "7.3",
    initialEvidence:
      "",
  },
];

const normOptions: { value: NormCode; label: string }[] = [
  { value: "iso9001", label: "ISO 9001:2015 - Qualidade" },
  { value: "iso14001", label: "ISO 14001:2015 - Ambiental" },
  { value: "iso45001", label: "ISO 45001:2018 - SSO" },
  { value: "iso50001", label: "ISO 50001:2018 - Energia" },
  { value: "iso22000", label: "ISO 22000:2018 - Alimentos" },
  { value: "fsc", label: "FSC COC - Cadeia de Custodia" },
];

const clauseLibrary: Record<NormCode, ClauseOption[]> = {
  iso9001: [
    {
      clause: "6.1.1",
      title: "Riscos e oportunidades",
      text: "A organizacao deve determinar riscos e oportunidades que precisam ser abordados para assegurar que o sistema alcance os resultados pretendidos.",
    },
    {
      clause: "7.1.5",
      title: "Recursos de monitoramento e medicao",
      text: "A organizacao deve assegurar recursos adequados e calibrados quando monitoramento e medicao forem usados para verificar conformidade.",
    },
    {
      clause: "10.2",
      title: "Nao conformidade e acao corretiva",
      text: "Quando ocorrer uma nao conformidade, a organizacao deve reagir, controlar e corrigir, avaliar causa e implementar acao corretiva.",
    },
  ],
  iso14001: [
    {
      clause: "6.1.2",
      title: "Aspectos ambientais",
      text: "A organizacao deve determinar aspectos ambientais e impactos associados considerando perspectiva de ciclo de vida.",
    },
    {
      clause: "8.1",
      title: "Planejamento e controle operacional",
      text: "A organizacao deve estabelecer, implementar e manter processos necessarios para atender requisitos do SGA.",
    },
  ],
  iso45001: [
    {
      clause: "7.3",
      title: "Conscientizacao",
      text: "Trabalhadores devem estar conscientes da politica de SSO, riscos, perigos e consequencias de nao conformidade.",
    },
    {
      clause: "8.1.2",
      title: "Eliminacao de perigos",
      text: "A organizacao deve estabelecer processo para eliminacao de perigos e reducao de riscos de SSO.",
    },
  ],
  iso50001: [
    {
      clause: "6.3",
      title: "Indicadores de desempenho energetico",
      text: "A organizacao deve determinar EnPI apropriados para monitorar e demonstrar melhoria de desempenho energetico.",
    },
  ],
  iso22000: [
    {
      clause: "8.5.2",
      title: "Programa de pre-requisitos operacionais",
      text: "A organizacao deve estabelecer e manter programas para prevenir contaminacao e assegurar seguranca dos alimentos.",
    },
  ],
  fsc: [
    {
      clause: "COC 2.1",
      title: "Controle de material",
      text: "A organizacao deve implementar controles para rastreabilidade e segregacao de material certificado em toda a cadeia interna.",
    },
  ],
};

const workflowFlow: WorkflowStatus[] = ["rascunho", "revisao-tecnica", "aprovado", "enviado-cliente"];

const workflowLabel: Record<WorkflowStatus, string> = {
  rascunho: "Rascunho",
  "revisao-tecnica": "Revisao tecnica",
  aprovado: "Aprovado",
  "enviado-cliente": "Enviado ao cliente",
};

const qualityBannedTerms = /(talvez|acho|coisa|etc\.?|mais ou menos)/i;

function nowBr() {
  return new Date().toLocaleString("pt-BR");
}

function statusBadge(status: EvidenceStatus): { label: string; variant: "conformidade" | "nao-conformidade" | "observacao" | "oportunidade" | "outline" } {
  const map = {
    conforme: { label: "Conforme", variant: "conformidade" as const },
    "nao-conformidade": { label: "Nao conformidade", variant: "nao-conformidade" as const },
    observacao: { label: "Observacao", variant: "observacao" as const },
    oportunidade: { label: "Oportunidade", variant: "oportunidade" as const },
    pendente: { label: "Pendente", variant: "outline" as const },
  };
  return map[status];
}

function expectedSeverities(classification: EvidenceStatus): Severity[] {
  if (classification === "conforme") return ["baixa"];
  if (classification === "nao-conformidade") return ["alta", "critica"];
  if (classification === "observacao") return ["media"];
  if (classification === "oportunidade") return ["baixa", "media"];
  return ["media"];
}

function mapStandardToNormCode(standard?: string): NormCode {
  const normalized = (standard ?? "").toLowerCase();
  if (normalized.includes("14001")) return "iso14001";
  if (normalized.includes("45001")) return "iso45001";
  if (normalized.includes("50001")) return "iso50001";
  if (normalized.includes("22000")) return "iso22000";
  if (normalized.includes("fsc")) return "fsc";
  return "iso9001";
}

function mapIncomingClassification(value?: string): EvidenceStatus | null {
  if (!value) return null;
  if (value === "conformidade") return "conforme";
  if (value === "nao-conformidade") return "nao-conformidade";
  if (value === "observacao") return "observacao";
  if (value === "oportunidade") return "oportunidade";
  return null;
}

export default function AuditReportPage() {
  const [searchParams] = useSearchParams();
  const auditIdFromUrl = searchParams.get("auditId") ?? "";
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(evidenceList[0]?.id ?? "");
  const [workflow, setWorkflow] = useState<WorkflowStatus>("rascunho");
  const [revisionList, setRevisionList] = useState<Revision[]>([
    { version: "Rev. 02", date: "18/02/2026 14:30", author: "Carlos M. Silva", action: "Ajuste de classificacao para EV-002" },
    { version: "Rev. 01", date: "17/02/2026 09:05", author: "Ana R. Costa", action: "Criacao inicial do RAI" },
  ]);

  const selected = useMemo(
    () => evidenceList.find((item) => item.id === selectedId) ?? evidenceList[0],
    [selectedId]
  );

  const [norma, setNorma] = useState<NormCode>(selected?.initialNorm ?? "iso9001");
  const [clausula, setClausula] = useState(selected?.initialClause ?? "");
  const [descricao, setDescricao] = useState(selected?.titulo ?? "");
  const [evidencia, setEvidencia] = useState(selected?.initialEvidence ?? "");
  const [requisito, setRequisito] = useState("");
  const [classificacao, setClassificacao] = useState<EvidenceStatus>(selected?.status ?? "observacao");
  const [severidade, setSeveridade] = useState<Severity>("media");
  const [recomendacao, setRecomendacao] = useState("");
  const [responsavel, setResponsavel] = useState("Joao Ferreira");
  const [prazo, setPrazo] = useState("15/03/2026");
  const [lastExport, setLastExport] = useState("");
  const [contextApplied, setContextApplied] = useState(false);
  const [auditInfo, setAuditInfo] = useState({
    id: auditIdFromUrl || "AUD-2026-0051",
    client: "Metalurgica Acoforte",
    standard: "ISO 9001:2015",
    auditor: "Carlos M. Silva",
  });

  const clauses = clauseLibrary[norma] ?? [];

  React.useEffect(() => {
    if (!selected) return;
    setNorma(selected.initialNorm);
    setClausula(selected.initialClause);
    setDescricao(selected.titulo);
    setEvidencia(selected.initialEvidence);
    setClassificacao(selected.status);
    setSeveridade(selected.status === "nao-conformidade" ? "alta" : selected.status === "conforme" ? "baixa" : "media");
    setRecomendacao("");
    const initialClause = (clauseLibrary[selected.initialNorm] ?? []).find((it) => it.clause === selected.initialClause);
    setRequisito(initialClause?.text ?? "");
  }, [selectedId, selected]);

  React.useEffect(() => {
    if (contextApplied) return;
    let parsed: RaiContextPayload | null = null;
    try {
      const raw = localStorage.getItem("certifica:rai-context");
      parsed = raw ? (JSON.parse(raw) as RaiContextPayload) : null;
    } catch {
      parsed = null;
    }

    if (!parsed && auditIdFromUrl) {
      setAuditInfo((prev) => ({ ...prev, id: auditIdFromUrl }));
      setContextApplied(true);
      return;
    }

    if (!parsed) return;
    if (auditIdFromUrl && parsed.auditId && parsed.auditId !== auditIdFromUrl) return;

    if (parsed.auditId) setAuditInfo((prev) => ({ ...prev, id: parsed!.auditId ?? prev.id }));
    if (parsed.client) setAuditInfo((prev) => ({ ...prev, client: parsed!.client ?? prev.client }));
    if (parsed.standard) setAuditInfo((prev) => ({ ...prev, standard: parsed!.standard ?? prev.standard }));
    if (parsed.auditor) setAuditInfo((prev) => ({ ...prev, auditor: parsed!.auditor ?? prev.auditor }));
    if (parsed.requisito) setRequisito(parsed.requisito);
    if (parsed.evidencia) setEvidencia(parsed.evidencia);
    if (parsed.recomendacao) setRecomendacao(parsed.recomendacao);

    const incomingClass = mapIncomingClassification(parsed.classificacao);
    if (incomingClass) {
      setClassificacao(incomingClass);
      setSeveridade(incomingClass === "nao-conformidade" ? "alta" : incomingClass === "conforme" ? "baixa" : "media");
    }

    const mappedNorm = mapStandardToNormCode(parsed.standard);
    setNorma(mappedNorm);
    const firstClause = clauseLibrary[mappedNorm]?.[0];
    if (firstClause) {
      setClausula(firstClause.clause);
      if (!parsed.requisito) setRequisito(firstClause.text);
    }
    addRevision(`Contexto importado de Auditorias para ${parsed.auditId ?? "RAI"}`);
    setContextApplied(true);
  }, [auditIdFromUrl, contextApplied]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return evidenceList;
    return evidenceList.filter(
      (item) =>
        item.id.toLowerCase().includes(term) ||
        item.titulo.toLowerCase().includes(term) ||
        item.processo.toLowerCase().includes(term) ||
        item.initialClause.toLowerCase().includes(term)
    );
  }, [search]);

  const qualityChecks = useMemo(() => {
    const clarity = descricao.trim().length >= 40;
    const objective = !qualityBannedTerms.test(descricao) && !qualityBannedTerms.test(recomendacao);
    const criteria = requisito.trim().length >= 40 && /\d+(\.\d+)?/.test(clausula);
    const score = [clarity, objective, criteria].filter(Boolean).length;
    return { clarity, objective, criteria, score };
  }, [descricao, recomendacao, requisito, clausula]);

  const evidenceMissing = evidencia.trim().length < 40;
  const severityConsistency = expectedSeverities(classificacao).includes(severidade);
  const canMoveForward =
    !evidenceMissing &&
    qualityChecks.score === 3 &&
    severityConsistency &&
    descricao.trim().length > 0 &&
    recomendacao.trim().length > 0 &&
    requisito.trim().length > 0;

  const progress = Math.round((workflowFlow.indexOf(workflow) / (workflowFlow.length - 1)) * 100);

  const addRevision = (action: string) => {
    setRevisionList((prev) => [
      {
        version: `Rev. ${String(prev.length + 1).padStart(2, "0")}`,
        date: nowBr(),
        author: "Carlos M. Silva",
        action,
      },
      ...prev,
    ]);
  };

  const applyClause = (clauseValue: string) => {
    setClausula(clauseValue);
    const entry = clauses.find((item) => item.clause === clauseValue);
    if (entry) {
      setRequisito(entry.text);
      if (!descricao.trim()) setDescricao(entry.title);
    }
  };

  const suggestDescriptionByAi = () => {
    if (evidenceMissing) {
      window.alert("IA bloqueada por anti-vies: faltam dados objetivos de evidencia. Complete a evidencia antes da sugestao.");
      return;
    }
    const clauseMeta = clauses.find((item) => item.clause === clausula);
    const phrase = clauseMeta?.title ?? `clausula ${clausula}`;
    setDescricao(
      `Durante a verificacao do processo ${selected.processo}, foi constatado desvio relacionado a ${phrase}. A evidencia objetiva demonstra impacto direto no atendimento ao requisito, exigindo tratamento formal e rastreavel.`
    );
  };

  const suggestRecommendationByAi = () => {
    if (evidenceMissing) {
      window.alert("IA bloqueada por anti-vies: sem evidencia suficiente para recomendar acao. Informe fatos verificaveis.");
      return;
    }
    const base =
      classificacao === "nao-conformidade"
        ? "Abrir acao corretiva imediata com analise de causa, plano 5W2H e verificacao de eficacia."
        : classificacao === "observacao"
          ? "Registrar acao preventiva com responsavel e checkpoint no proximo ciclo de auditoria."
          : classificacao === "oportunidade"
            ? "Planejar melhoria gradual com piloto e medicao de resultado para padronizacao."
            : "Manter controle atual e reforcar evidencia em auditorias subsequentes.";
    setRecomendacao(`${base} Prazo sugerido: ${prazo}. Responsavel: ${responsavel || "a definir"}.`);
  };

  const saveDraft = () => {
    localStorage.setItem(
      "certifica:rai-context",
      JSON.stringify({
        auditId: auditInfo.id,
        client: auditInfo.client,
        standard: auditInfo.standard,
        auditor: auditInfo.auditor,
        classificacao,
        requisito,
        evidencia,
        recomendacao,
      })
    );
    addRevision(`Rascunho salvo para ${selected.id}`);
  };

  const nextWorkflow = () => {
    const idx = workflowFlow.indexOf(workflow);
    if (idx >= workflowFlow.length - 1) return;
    if (!canMoveForward) {
      window.alert("Nao foi possivel avancar: revise qualidade textual, consistencia severidade/classificacao e evidencia objetiva.");
      return;
    }
    const next = workflowFlow[idx + 1];
    setWorkflow(next);
    addRevision(`Workflow atualizado para ${workflowLabel[next]}`);
  };

  const exportPdf = () => {
    const content = [
      `RAI - ${auditInfo.id} / ${selected.id}`,
      `Cliente: ${auditInfo.client}`,
      `Norma: ${auditInfo.standard}`,
      `Auditor: ${auditInfo.auditor}`,
      `Status workflow: ${workflowLabel[workflow]}`,
      `1) Descricao da constatacao: ${descricao}`,
      `2) Evidencia objetiva: ${evidencia || "[DADO AUSENTE - COMPLEMENTAR]"}`,
      `3) Requisito tecnico: ${requisito}`,
      `4) Classificacao: ${classificacao} / Severidade: ${severidade}`,
      `5) Recomendacao: ${recomendacao}`,
      "",
      "Assinatura tecnica digital: Carlos M. Silva",
      "Rodape tecnico: Certifica Consultoria | Rastreabilidade RAI | Versao controlada",
    ].join("\n");
    navigator.clipboard.writeText(content).catch(() => null);
    setLastExport(nowBr());
    addRevision("Exportacao PDF tecnica gerada");
  };

  return (
    <div className="flex h-full">
      <aside className="w-[300px] border-r border-certifica-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-certifica-200">
          <div className="text-[11px] tracking-[0.06em] uppercase text-certifica-500 mb-2" style={{ fontWeight: 600 }}>
            Evidencias RAI
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-certifica-500/50" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar evidencia..."
              className="w-full h-8 pl-8 pr-3 bg-certifica-50 border border-certifica-200 rounded-[3px] text-[12px] focus:outline-none focus:ring-1 focus:ring-certifica-700/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((ev) => {
            const active = ev.id === selectedId;
            const badge = statusBadge(ev.status);
            return (
              <button
                key={ev.id}
                onClick={() => setSelectedId(ev.id)}
                className={`w-full text-left px-4 py-3 border-b border-certifica-200 transition-colors ${active ? "bg-certifica-50" : "hover:bg-certifica-50/60"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-certifica-700 font-mono" style={{ fontWeight: 600 }}>
                    {ev.id}
                  </span>
                  <DSBadge variant={badge.variant} className="text-[9px] px-1.5 py-0">
                    {badge.label}
                  </DSBadge>
                </div>
                <div className="text-[12px] text-certifica-dark" style={{ fontWeight: active ? 600 : 400 }}>
                  {ev.titulo}
                </div>
                <div className="text-[10.5px] text-certifica-500 mt-1">{ev.processo} · Clausula {ev.initialClause}</div>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-6 py-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px] text-certifica-700 font-mono" style={{ fontWeight: 600 }}>
                  {selected.id}
                </span>
                <ChevronRight className="w-3 h-3 text-certifica-500/60" strokeWidth={1.5} />
                <span className="text-[12px] text-certifica-500">Fluxo RAI rastreavel</span>
              </div>
              <h3 className="text-certifica-900">Formulario tecnico de RAI</h3>
              <p className="text-[12px] text-certifica-500 mt-0.5">
                {auditInfo.id} · {auditInfo.standard} · {auditInfo.auditor}
              </p>
            </div>
            <div className="flex gap-2">
              <DSButton variant="outline" size="sm" icon={<Printer className="w-3.5 h-3.5" strokeWidth={1.5} />}>
                Imprimir
              </DSButton>
              <DSButton variant="outline" size="sm" icon={<Save className="w-3.5 h-3.5" strokeWidth={1.5} />} onClick={saveDraft}>
                Salvar
              </DSButton>
              <DSButton variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" strokeWidth={1.5} />} onClick={nextWorkflow}>
                Avancar workflow
              </DSButton>
            </div>
          </div>

          <div className="bg-white border border-certifica-200 rounded-[4px] p-4 grid grid-cols-2 gap-4">
            <DSSelect
              label="Biblioteca de clausulas por norma"
              value={norma}
              onChange={(e) => {
                const nextNorm = e.target.value as NormCode;
                setNorma(nextNorm);
                const firstClause = (clauseLibrary[nextNorm] ?? [])[0];
                if (firstClause) applyClause(firstClause.clause);
              }}
              options={normOptions}
            />
            <DSSelect
              label="Clausula"
              value={clausula}
              onChange={(e) => applyClause(e.target.value)}
              options={clauses.map((it) => ({ value: it.clause, label: `${it.clause} - ${it.title}` }))}
            />
          </div>

          <div className="bg-white border border-certifica-200 rounded-[4px] p-4 space-y-4">
            <DSTextarea
              label="1) Descricao da constatacao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva de forma clara, objetiva e rastreavel o que foi constatado."
            />
            <div className="flex justify-end">
              <DSButton variant="outline" size="sm" icon={<Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} />} onClick={suggestDescriptionByAi}>
                IA sugerir descricao
              </DSButton>
            </div>

            <DSTextarea
              label="2) Evidencia objetiva"
              value={evidencia}
              onChange={(e) => setEvidencia(e.target.value)}
              placeholder="Descreva fatos verificaveis (documento, data, registro, entrevista, observacao in loco)."
            />
            {evidenceMissing && (
              <div className="text-[12px] text-nao-conformidade bg-nao-conformidade/5 border border-nao-conformidade/20 rounded-[4px] px-3 py-2">
                Regra anti-vies: IA nao pode inventar evidencia. Dados insuficientes, complemente com fato objetivo.
              </div>
            )}

            <DSTextarea
              label="3) Requisito tecnico"
              value={requisito}
              onChange={(e) => setRequisito(e.target.value)}
              placeholder="Trecho normativo ou criterio de auditoria aplicavel."
            />

            <div>
              <div className="text-[13px] text-certifica-dark mb-1.5" style={{ fontWeight: 500 }}>
                4) Classificacao
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: "conforme", label: "Conforme", icon: CheckCircle2, color: "text-conformidade" },
                  { id: "nao-conformidade", label: "Nao conf.", icon: XCircle, color: "text-nao-conformidade" },
                  { id: "observacao", label: "Observacao", icon: AlertTriangle, color: "text-observacao" },
                  { id: "oportunidade", label: "Oportunidade", icon: Lightbulb, color: "text-oportunidade" },
                  { id: "pendente", label: "Pendente", icon: Clock, color: "text-certifica-500" },
                ].map((opt) => {
                  const selectedClass = classificacao === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setClassificacao(opt.id as EvidenceStatus)}
                      className={`rounded-[4px] border px-2 py-2 flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.04em] ${
                        selectedClass ? "bg-certifica-50 border-certifica-400" : "border-certifica-200 hover:bg-certifica-50/60"
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      <opt.icon className={`w-4 h-4 ${selectedClass ? opt.color : "text-certifica-500"}`} strokeWidth={1.5} />
                      <span className={selectedClass ? opt.color : "text-certifica-500"}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DSSelect
                label="Severidade"
                value={severidade}
                onChange={(e) => setSeveridade(e.target.value as Severity)}
                options={[
                  { value: "baixa", label: "Baixa" },
                  { value: "media", label: "Media" },
                  { value: "alta", label: "Alta" },
                  { value: "critica", label: "Critica" },
                ]}
              />
              <DSInput label="Responsavel" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} icon={<User className="w-4 h-4" />} />
            </div>
            <DSInput label="Prazo da acao" value={prazo} onChange={(e) => setPrazo(e.target.value)} placeholder="DD/MM/AAAA" />

            <DSTextarea
              label="5) Recomendacao / acao sugerida"
              value={recomendacao}
              onChange={(e) => setRecomendacao(e.target.value)}
              placeholder="Descreva acao corretiva, preventiva ou melhoria com rastreabilidade."
            />
            <div className="flex justify-end">
              <DSButton variant="outline" size="sm" icon={<Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} />} onClick={suggestRecommendationByAi}>
                IA sugerir recomendacao
              </DSButton>
            </div>
          </div>
        </div>
      </main>

      <aside className="w-[290px] border-l border-certifica-200 bg-white overflow-y-auto">
        <div className="px-4 py-3 border-b border-certifica-200">
          <div className="text-[10px] tracking-[0.08em] uppercase text-certifica-500 mb-2" style={{ fontWeight: 600 }}>
            Workflow de aprovacao
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-3.5 h-3.5 text-certifica-700" strokeWidth={1.5} />
            <span className="text-[13px] text-certifica-900" style={{ fontWeight: 600 }}>
              {auditInfo.client}
            </span>
          </div>
          <DSBadge variant={workflow === "aprovado" || workflow === "enviado-cliente" ? "conformidade" : "observacao"}>
            {workflowLabel[workflow]}
          </DSBadge>
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-certifica-500 mb-1">
              <span>Progresso</span>
              <span className="font-mono text-certifica-700">{progress}%</span>
            </div>
            <div className="h-[4px] bg-certifica-200 rounded-full overflow-hidden">
              <div className="h-full bg-certifica-700 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-certifica-200 space-y-2">
          <div className="text-[10px] tracking-[0.08em] uppercase text-certifica-500" style={{ fontWeight: 600 }}>
            Validacoes tecnicas
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span>Clareza textual</span>
            <DSBadge variant={qualityChecks.clarity ? "conformidade" : "nao-conformidade"}>{qualityChecks.clarity ? "OK" : "Ajustar"}</DSBadge>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span>Objetividade</span>
            <DSBadge variant={qualityChecks.objective ? "conformidade" : "nao-conformidade"}>{qualityChecks.objective ? "OK" : "Ajustar"}</DSBadge>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span>Criterio de auditoria</span>
            <DSBadge variant={qualityChecks.criteria ? "conformidade" : "nao-conformidade"}>{qualityChecks.criteria ? "OK" : "Ajustar"}</DSBadge>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span>Consistencia classe x severidade</span>
            <DSBadge variant={severityConsistency ? "conformidade" : "nao-conformidade"}>{severityConsistency ? "Consistente" : "Inconsistente"}</DSBadge>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-certifica-200">
          <div className="flex items-center gap-1.5 mb-2">
            <History className="w-3 h-3 text-certifica-500" strokeWidth={1.5} />
            <span className="text-[10px] tracking-[0.08em] uppercase text-certifica-500" style={{ fontWeight: 600 }}>
              Versionamento por revisao
            </span>
          </div>
          <div className="space-y-2">
            {revisionList.map((rev) => (
              <div key={`${rev.version}-${rev.date}`} className="border border-certifica-200 rounded-[4px] px-2.5 py-2">
                <div className="flex justify-between text-[11px]">
                  <span className="font-mono text-certifica-700">{rev.version}</span>
                  <span className="text-certifica-500">{rev.date}</span>
                </div>
                <div className="text-[11px] text-certifica-dark mt-1">{rev.action}</div>
                <div className="text-[10px] text-certifica-500 mt-0.5">por {rev.author}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 space-y-2">
          <DSButton variant="outline" size="sm" className="w-full justify-start" icon={<Download className="w-3.5 h-3.5" />} onClick={exportPdf}>
            Exportar PDF com assinatura
          </DSButton>
          <DSButton variant="outline" size="sm" className="w-full justify-start" icon={<Send className="w-3.5 h-3.5" />} onClick={nextWorkflow}>
            Validar e avancar etapa
          </DSButton>
          {lastExport && (
            <div className="text-[11px] text-certifica-500">
              Ultima exportacao tecnica: {lastExport}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
