import React, { useState } from "react";
import { useNavigate } from "react-router";

import { DSCard } from "../components/ds/DSCard";
import { DSBadge } from "../components/ds/DSBadge";
import { DSButton } from "../components/ds/DSButton";
import {
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  Eye,
  X,
} from "lucide-react";

type AuditStatus = "planejada" | "em-andamento" | "concluida" | "cancelada";
type BadgeVariant = "conformidade" | "nao-conformidade" | "observacao" | "oportunidade" | "outline";
type RaiClassification = "conformidade" | "nao-conformidade" | "observacao" | "oportunidade";

interface Audit {
  id: string;
  client: string;
  standard: string;
  type: string;
  auditor: string;
  dateStart: string;
  dateEnd: string;
  status: AuditStatus;
  findings: { c: number; nc: number; obs: number; opm: number };
}

const audits: Audit[] = [
  {
    id: "AUD-2026-0051",
    client: "Metalurgica Acoforte",
    standard: "ISO 9001:2015",
    type: "Interna",
    auditor: "Carlos Silva",
    dateStart: "16/02/2026",
    dateEnd: "18/02/2026",
    status: "em-andamento",
    findings: { c: 2, nc: 2, obs: 2, opm: 1 },
  },
  {
    id: "AUD-2026-0052",
    client: "Plastiform Industrial",
    standard: "ISO 14001:2015",
    type: "Interna",
    auditor: "Roberto Lima",
    dateStart: "21/02/2026",
    dateEnd: "22/02/2026",
    status: "planejada",
    findings: { c: 0, nc: 0, obs: 0, opm: 0 },
  },
  {
    id: "AUD-2026-0050",
    client: "TransLog Operacoes",
    standard: "ISO 45001:2018",
    type: "Certificacao",
    auditor: "Maria Santos",
    dateStart: "28/02/2026",
    dateEnd: "01/03/2026",
    status: "planejada",
    findings: { c: 0, nc: 0, obs: 0, opm: 0 },
  },
  {
    id: "AUD-2026-0048",
    client: "Grupo Energis",
    standard: "ISO 50001:2018",
    type: "Interna",
    auditor: "Ana Costa",
    dateStart: "10/02/2026",
    dateEnd: "11/02/2026",
    status: "concluida",
    findings: { c: 5, nc: 1, obs: 3, opm: 2 },
  },
  {
    id: "AUD-2026-0047",
    client: "AgroVale Alimentos",
    standard: "ISO 22000:2018",
    type: "Interna",
    auditor: "Pedro Souza",
    dateStart: "05/02/2026",
    dateEnd: "06/02/2026",
    status: "concluida",
    findings: { c: 7, nc: 0, obs: 1, opm: 3 },
  },
  {
    id: "AUD-2026-0045",
    client: "Madeireira Floresta Viva",
    standard: "FSC COC",
    type: "Recertificacao",
    auditor: "Carlos Silva",
    dateStart: "28/01/2026",
    dateEnd: "29/01/2026",
    status: "concluida",
    findings: { c: 4, nc: 1, obs: 2, opm: 1 },
  },
];

const statusConfig: Record<AuditStatus, { label: string; variant: BadgeVariant }> = {
  planejada: { label: "Planejada", variant: "oportunidade" },
  "em-andamento": { label: "Em andamento", variant: "observacao" },
  concluida: { label: "Concluida", variant: "conformidade" },
  cancelada: { label: "Cancelada", variant: "outline" },
};

const raiClassificationConfig: Record<RaiClassification, { label: string; variant: BadgeVariant }> = {
  conformidade: { label: "Conformidade", variant: "conformidade" },
  "nao-conformidade": { label: "Nao conformidade", variant: "nao-conformidade" },
  observacao: { label: "Observacao", variant: "observacao" },
  oportunidade: { label: "Oportunidade de melhoria", variant: "oportunidade" },
};

/* ── NC tracking ── */
const openNCs = [
  { id: "NC-041", client: "Metalurgica Acoforte", clause: "7.1.6", desc: "Calibracao de paquimetro vencida", severity: "menor" as const, days: 2 },
  { id: "NC-040", client: "Metalurgica Acoforte", clause: "6.1.2", desc: "Analise de riscos incompleta — processo critico", severity: "maior" as const, days: 2 },
  { id: "NC-038", client: "Grupo Energis", clause: "4.4.3", desc: "Baseline energetico nao atualizado", severity: "menor" as const, days: 8 },
  { id: "NC-035", client: "Madeireira Floresta Viva", clause: "COC 2.1", desc: "Rastreabilidade de lote com falha", severity: "maior" as const, days: 21 },
];

type Tab = "painel" | "calendario";

export default function AuditoriasPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("painel");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [auditList, setAuditList] = useState<Audit[]>(audits);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRaiModalOpen, setIsRaiModalOpen] = useState(false);
  const [copiedRai, setCopiedRai] = useState(false);
  const [newAudit, setNewAudit] = useState({
    client: "",
    standard: "",
    type: "Interna",
    auditor: "",
    dateStart: "",
    dateEnd: "",
    status: "planejada" as AuditStatus,
  });
  const [raiDraft, setRaiDraft] = useState({
    auditId: audits[0]?.id ?? "",
    evidencia: "",
    requisito: "",
    classificacao: "observacao" as RaiClassification,
    recomendacao: "",
  });

  const filtered = statusFilter === "todos"
    ? auditList
    : auditList.filter((a) => a.status === statusFilter);

  const counts = {
    total: auditList.length,
    planejada: auditList.filter((a) => a.status === "planejada").length,
    andamento: auditList.filter((a) => a.status === "em-andamento").length,
    concluida: auditList.filter((a) => a.status === "concluida").length,
  };

  const totalFindings = auditList.reduce(
    (acc, a) => ({
      c: acc.c + a.findings.c,
      nc: acc.nc + a.findings.nc,
      obs: acc.obs + a.findings.obs,
      opm: acc.opm + a.findings.opm,
    }),
    { c: 0, nc: 0, obs: 0, opm: 0 }
  );

  const toBrDate = (isoDate: string) => {
    if (!isoDate.includes("-")) return isoDate;
    const [yyyy, mm, dd] = isoDate.split("-");
    return `${dd}/${mm}/${yyyy}`;
  };

  const getNextAuditId = () => {
    const maxSequence = auditList.reduce((max, item) => {
      const match = item.id.match(/(\d+)$/);
      if (!match) return max;
      const seq = Number(match[1]);
      return Number.isNaN(seq) ? max : Math.max(max, seq);
    }, 0);
    return `AUD-2026-${String(maxSequence + 1).padStart(4, "0")}`;
  };

  const selectedRaiAudit = auditList.find((a) => a.id === raiDraft.auditId) ?? null;

  const getSuggestedRecommendation = (classification: RaiClassification) => {
    switch (classification) {
      case "conformidade":
        return "Manter o controle implementado e registrar evidencia no historico da auditoria.";
      case "nao-conformidade":
        return "Abrir plano de acao corretiva com responsavel definido e prazo maximo de 15 dias.";
      case "observacao":
        return "Registrar observacao e acompanhar no proximo ciclo para evitar evolucao para NC.";
      case "oportunidade":
        return "Avaliar melhoria de processo e incluir acao de otimização no plano de auditoria.";
      default:
        return "";
    }
  };

  const buildRaiText = () => {
    if (!selectedRaiAudit) return "";
    const classificacaoLabel = raiClassificationConfig[raiDraft.classificacao].label;
    const descricao = `Durante a auditoria ${selectedRaiAudit.type.toLowerCase()} em ${selectedRaiAudit.client}, referente a ${selectedRaiAudit.standard}, foi analisado o requisito "${raiDraft.requisito || selectedRaiAudit.standard}".`;
    const evidencia = raiDraft.evidencia || "Evidencia ainda nao informada.";
    const recomendacao = raiDraft.recomendacao || getSuggestedRecommendation(raiDraft.classificacao);

    return [
      `RAI - ${selectedRaiAudit.id}`,
      `Cliente: ${selectedRaiAudit.client}`,
      `Norma: ${selectedRaiAudit.standard}`,
      `Auditor: ${selectedRaiAudit.auditor}`,
      `Periodo: ${selectedRaiAudit.dateStart} a ${selectedRaiAudit.dateEnd}`,
      "",
      "1. Descricao",
      descricao,
      "",
      "2. Evidencia objetiva",
      evidencia,
      "",
      "3. Requisito tecnico",
      raiDraft.requisito || selectedRaiAudit.standard,
      "",
      "4. Classificacao",
      classificacaoLabel,
      "",
      "5. Recomendacao / Acao sugerida",
      recomendacao,
    ].join("\n");
  };

  const handleCopyRai = async () => {
    const raiText = buildRaiText();
    if (!raiText) return;
    try {
      await navigator.clipboard.writeText(raiText);
      setCopiedRai(true);
      setTimeout(() => setCopiedRai(false), 1500);
    } catch {
      setCopiedRai(false);
    }
  };

  const handleCreateAudit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const createdAudit: Audit = {
      id: getNextAuditId(),
      client: newAudit.client.trim(),
      standard: newAudit.standard.trim(),
      type: newAudit.type,
      auditor: newAudit.auditor.trim(),
      dateStart: toBrDate(newAudit.dateStart),
      dateEnd: toBrDate(newAudit.dateEnd),
      status: newAudit.status,
      findings: { c: 0, nc: 0, obs: 0, opm: 0 },
    };

    setAuditList((prev) => [createdAudit, ...prev]);
    setIsCreateModalOpen(false);
    setNewAudit({
      client: "",
      standard: "",
      type: "Interna",
      auditor: "",
      dateStart: "",
      dateEnd: "",
      status: "planejada",
    });
    setStatusFilter("todos");
  };

  const openRaiEditor = () => {
    if (!selectedRaiAudit) return;
    const payload = {
      auditId: selectedRaiAudit.id,
      client: selectedRaiAudit.client,
      standard: selectedRaiAudit.standard,
      auditor: selectedRaiAudit.auditor,
      classificacao: raiDraft.classificacao,
      requisito: raiDraft.requisito,
      evidencia: raiDraft.evidencia,
      recomendacao: raiDraft.recomendacao || getSuggestedRecommendation(raiDraft.classificacao),
      source: "auditorias-modal",
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("certifica:rai-context", JSON.stringify(payload));
    setIsRaiModalOpen(false);
    navigate(`/auditorias/rai?auditId=${encodeURIComponent(selectedRaiAudit.id)}`);
  };

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-certifica-900">Auditorias</h2>
          <p className="text-[12px] text-certifica-500 mt-0.5" style={{ fontWeight: 400 }}>
            {counts.andamento} em andamento &middot; {counts.planejada} planejadas &middot; {counts.concluida} concluidas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DSButton
            variant="outline"
            size="sm"
            icon={<FileText className="w-3.5 h-3.5" strokeWidth={1.5} />}
            onClick={() => {
              const preferredAudit = auditList.find((a) => a.status === "em-andamento") ?? auditList[0];
              setRaiDraft({
                auditId: preferredAudit?.id ?? "",
                evidencia: "",
                requisito: preferredAudit?.standard ?? "",
                classificacao: "observacao",
                recomendacao: "",
              });
              setIsRaiModalOpen(true);
            }}
          >
            Gerar RAI
          </DSButton>
          <DSButton
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Nova auditoria
          </DSButton>
        </div>
      </div>

      {/* Summary counters */}
      <div className="flex items-center gap-6">
        {[
          { label: "Nao conformidades abertas", value: String(openNCs.length), color: "text-nao-conformidade" },
          { label: "Conformidades registradas", value: String(totalFindings.c), color: "text-conformidade" },
          { label: "Observacoes", value: String(totalFindings.obs), color: "text-observacao" },
          { label: "Oportunidades", value: String(totalFindings.opm), color: "text-oportunidade" },
        ].map((item) => (
          <div key={item.label} className="flex items-baseline gap-1.5">
            <span className={`text-[20px] ${item.color}`} style={{ fontWeight: 600, lineHeight: "1" }}>{item.value}</span>
            <span className="text-[11px] text-certifica-500" style={{ fontWeight: 400 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Left — audit list */}
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0 border border-certifica-200 rounded-[3px] overflow-hidden">
              {[
                { key: "todos", label: "Todas" },
                { key: "planejada", label: "Planejadas" },
                { key: "em-andamento", label: "Em andamento" },
                { key: "concluida", label: "Concluidas" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 text-[11px] cursor-pointer transition-colors border-r border-certifica-200 last:border-r-0 ${
                    statusFilter === f.key
                      ? "bg-certifica-900 text-white"
                      : "bg-white text-certifica-500 hover:bg-certifica-50"
                  }`}
                  style={{ fontWeight: statusFilter === f.key ? 500 : 400 }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audit cards */}
          <div className="space-y-2">
            {filtered.map((audit) => {
              const sc = statusConfig[audit.status];
              const hasFindings = audit.findings.c + audit.findings.nc + audit.findings.obs + audit.findings.opm > 0;
              return (
                <div key={audit.id} className="bg-white border border-certifica-200 rounded-[4px] px-4 py-3 hover:bg-certifica-50/30 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] text-certifica-700 font-mono" style={{ fontWeight: 600 }}>{audit.id}</span>
                        <DSBadge variant={sc.variant} className="text-[9px] px-1.5 py-0">{sc.label}</DSBadge>
                        {audit.type !== "Interna" && (
                          <span className="text-[9px] bg-certifica-900/8 text-certifica-900 rounded-[2px] px-1.5 py-px" style={{ fontWeight: 500 }}>
                            {audit.type}
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] text-certifica-dark" style={{ fontWeight: 500 }}>
                        {audit.client}
                      </div>
                    </div>
                    <button className="p-1 text-certifica-500/30 hover:text-certifica-700 transition-colors cursor-pointer">
                      <Eye className="w-[14px] h-[14px]" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-certifica-500" style={{ fontWeight: 400 }}>
                    <span className="font-mono">{audit.standard}</span>
                    <span>&middot;</span>
                    <span>{audit.dateStart} — {audit.dateEnd}</span>
                    <span>&middot;</span>
                    <span>{audit.auditor}</span>
                  </div>

                  {hasFindings && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-certifica-200/60">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-conformidade" strokeWidth={1.5} />
                        <span className="text-[10.5px] text-certifica-dark" style={{ fontWeight: 500 }}>{audit.findings.c}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-nao-conformidade" strokeWidth={1.5} />
                        <span className="text-[10.5px] text-certifica-dark" style={{ fontWeight: 500 }}>{audit.findings.nc}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-observacao" strokeWidth={1.5} />
                        <span className="text-[10.5px] text-certifica-dark" style={{ fontWeight: 500 }}>{audit.findings.obs}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-oportunidade" strokeWidth={1.5} />
                        <span className="text-[10.5px] text-certifica-dark" style={{ fontWeight: 500 }}>{audit.findings.opm}</span>
                      </div>
                    </div>
                  )}
                  <div className="mt-2 flex justify-end">
                    <DSButton
                      variant="outline"
                      size="sm"
                      icon={<FileText className="w-3 h-3" strokeWidth={1.5} />}
                      onClick={() => {
                        const mappedClassification: RaiClassification =
                          audit.findings.nc > 0
                            ? "nao-conformidade"
                            : audit.findings.obs > 0
                              ? "observacao"
                              : audit.findings.opm > 0
                                ? "oportunidade"
                                : "conformidade";
                        const payload = {
                          auditId: audit.id,
                          client: audit.client,
                          standard: audit.standard,
                          auditor: audit.auditor,
                          classificacao: mappedClassification,
                          requisito: audit.standard,
                          evidencia: "",
                          recomendacao: getSuggestedRecommendation(mappedClassification),
                          source: "auditorias-card",
                          createdAt: new Date().toISOString(),
                        };
                        localStorage.setItem("certifica:rai-context", JSON.stringify(payload));
                        navigate(`/auditorias/rai?auditId=${encodeURIComponent(audit.id)}`);
                      }}
                    >
                      Abrir RAI
                    </DSButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — NCs + Alerts */}
        <div className="space-y-4">
          {/* Open NCs */}
          <DSCard
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] text-certifica-900" style={{ fontWeight: 600 }}>NCs abertas</span>
                  <span className="text-[10px] bg-nao-conformidade/10 text-nao-conformidade rounded-[2px] px-1.5 py-px" style={{ fontWeight: 600 }}>
                    {openNCs.length}
                  </span>
                </div>
              </div>
            }
          >
            <div className="space-y-0">
              {openNCs.map((nc, idx) => (
                <div key={nc.id} className={`py-2.5 ${idx > 0 ? "border-t border-certifica-200" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-certifica-700 font-mono" style={{ fontWeight: 600 }}>{nc.id}</span>
                      <span className={`text-[9px] rounded-[2px] px-1 py-px ${
                        nc.severity === "maior"
                          ? "bg-nao-conformidade/10 text-nao-conformidade"
                          : "bg-observacao/10 text-observacao"
                      }`} style={{ fontWeight: 600 }}>
                        {nc.severity === "maior" ? "MAIOR" : "MENOR"}
                      </span>
                    </div>
                    <span className="text-[10px] text-certifica-500/60" style={{ fontWeight: 400 }}>
                      {nc.days}d
                    </span>
                  </div>
                  <p className="text-[12px] text-certifica-dark mb-0.5" style={{ fontWeight: 400, lineHeight: "1.4" }}>
                    {nc.desc}
                  </p>
                  <div className="text-[10.5px] text-certifica-500" style={{ fontWeight: 400 }}>
                    {nc.client} &middot; {nc.clause}
                  </div>
                </div>
              ))}
            </div>
          </DSCard>

          {/* Upcoming audits timeline */}
          <DSCard
            header={
              <span className="text-[13px] text-certifica-900" style={{ fontWeight: 600 }}>Proximas auditorias</span>
            }
          >
            <div className="space-y-0">
              {auditList
                .filter((a) => a.status === "planejada" || a.status === "em-andamento")
                .map((a, idx) => {
                  const sc = statusConfig[a.status];
                  return (
                    <div key={a.id} className={`flex gap-3 py-2.5 ${idx > 0 ? "border-t border-certifica-200" : ""}`}>
                      <div className="w-[50px] flex-shrink-0">
                        <div className="text-[11px] text-certifica-700 font-mono" style={{ fontWeight: 500 }}>
                          {a.dateStart.substring(0, 5)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-certifica-dark mb-0.5" style={{ fontWeight: 500 }}>
                          {a.client}
                        </div>
                        <div className="text-[10.5px] text-certifica-500" style={{ fontWeight: 400 }}>
                          {a.standard} &middot; {a.type} &middot; {a.auditor}
                        </div>
                      </div>
                      <DSBadge variant={sc.variant} className="text-[8px] px-1.5 py-0 flex-shrink-0">
                        {sc.label}
                      </DSBadge>
                    </div>
                  );
                })}
            </div>
          </DSCard>

          {/* Quick stats */}
          <div className="bg-white border border-certifica-200 rounded-[4px] px-4 py-3">
            <div className="text-[10px] tracking-[0.06em] uppercase text-certifica-500 mb-2" style={{ fontWeight: 600 }}>
              Resumo do ciclo
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Auditorias realizadas", value: String(counts.concluida) },
                { label: "Taxa de conformidade", value: "78%" },
                { label: "Tempo medio (dias)", value: "1.8" },
                { label: "NCs encerradas / total", value: "12/16" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[15px] text-certifica-900" style={{ fontWeight: 600, lineHeight: "1.3" }}>{s.value}</div>
                  <div className="text-[10px] text-certifica-500" style={{ fontWeight: 400 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-certifica-dark/45"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="relative w-full max-w-[560px] bg-white border border-certifica-200 rounded-[6px] shadow-[0_12px_40px_rgba(14,42,71,0.18)]">
            <div className="px-4 py-3 border-b border-certifica-200 flex items-center justify-between">
              <div>
                <h3 className="text-certifica-900 text-[15px]" style={{ fontWeight: 600 }}>
                  Nova auditoria
                </h3>
                <p className="text-[11px] text-certifica-500" style={{ fontWeight: 400 }}>
                  Cadastre uma nova auditoria para o painel.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-certifica-500/40 hover:text-certifica-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreateAudit} className="p-4 grid grid-cols-2 gap-3">
              <label className="col-span-2 text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                Cliente
                <input
                  required
                  value={newAudit.client}
                  onChange={(e) => setNewAudit((prev) => ({ ...prev, client: e.target.value }))}
                  className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                  placeholder="Ex.: Metalurgica Acoforte"
                />
              </label>

              <label className="col-span-2 text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                Norma
                <input
                  required
                  value={newAudit.standard}
                  onChange={(e) => setNewAudit((prev) => ({ ...prev, standard: e.target.value }))}
                  className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                  placeholder="Ex.: ISO 9001:2015"
                />
              </label>

              <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                Tipo
                <select
                  value={newAudit.type}
                  onChange={(e) => setNewAudit((prev) => ({ ...prev, type: e.target.value }))}
                  className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                >
                  <option>Interna</option>
                  <option>Certificacao</option>
                  <option>Recertificacao</option>
                </select>
              </label>

              <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                Status
                <select
                  value={newAudit.status}
                  onChange={(e) => setNewAudit((prev) => ({ ...prev, status: e.target.value as AuditStatus }))}
                  className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                >
                  <option value="planejada">Planejada</option>
                  <option value="em-andamento">Em andamento</option>
                  <option value="concluida">Concluida</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </label>

              <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                Inicio
                <input
                  required
                  type="date"
                  value={newAudit.dateStart}
                  onChange={(e) => setNewAudit((prev) => ({ ...prev, dateStart: e.target.value }))}
                  className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                />
              </label>

              <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                Fim
                <input
                  required
                  type="date"
                  value={newAudit.dateEnd}
                  onChange={(e) => setNewAudit((prev) => ({ ...prev, dateEnd: e.target.value }))}
                  className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                />
              </label>

              <label className="col-span-2 text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                Auditor responsavel
                <input
                  required
                  value={newAudit.auditor}
                  onChange={(e) => setNewAudit((prev) => ({ ...prev, auditor: e.target.value }))}
                  className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                  placeholder="Ex.: Carlos Silva"
                />
              </label>

              <div className="col-span-2 flex items-center justify-end gap-2 pt-1">
                <DSButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </DSButton>
                <DSButton type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}>
                  Criar auditoria
                </DSButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRaiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-certifica-dark/45"
            onClick={() => setIsRaiModalOpen(false)}
          />
          <div className="relative w-full max-w-[920px] bg-white border border-certifica-200 rounded-[6px] shadow-[0_12px_40px_rgba(14,42,71,0.18)]">
            <div className="px-4 py-3 border-b border-certifica-200 flex items-center justify-between">
              <div>
                <h3 className="text-certifica-900 text-[15px]" style={{ fontWeight: 600 }}>
                  Gerar RAI
                </h3>
                <p className="text-[11px] text-certifica-500" style={{ fontWeight: 400 }}>
                  Relatório estruturado conforme o briefing: descrição, evidência objetiva, requisito técnico, classificação e recomendação.
                </p>
              </div>
              <button
                onClick={() => setIsRaiModalOpen(false)}
                className="p-1 text-certifica-500/40 hover:text-certifica-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="grid grid-cols-[1fr_1fr] gap-0 max-h-[78vh]">
              <div className="p-4 border-r border-certifica-200 overflow-y-auto space-y-3">
                <label className="block text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Auditoria base
                  <select
                    value={raiDraft.auditId}
                    onChange={(e) => {
                      const selected = auditList.find((a) => a.id === e.target.value);
                      setRaiDraft((prev) => ({
                        ...prev,
                        auditId: e.target.value,
                        requisito: selected?.standard ?? prev.requisito,
                      }));
                    }}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                  >
                    {auditList.map((audit) => (
                      <option key={audit.id} value={audit.id}>
                        {audit.id} - {audit.client}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Evidencia objetiva
                  <textarea
                    rows={4}
                    value={raiDraft.evidencia}
                    onChange={(e) => setRaiDraft((prev) => ({ ...prev, evidencia: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30 resize-y"
                    placeholder="Ex.: Foram observados registros de calibracao vencidos no setor de metrologia."
                  />
                </label>
                {raiDraft.evidencia.trim().length < 20 && (
                  <div className="text-[11px] text-nao-conformidade bg-nao-conformidade/5 border border-nao-conformidade/20 rounded-[4px] px-2.5 py-2">
                    Regra anti-vies: faltam dados objetivos de evidencia para gerar recomendacao robusta.
                  </div>
                )}

                <label className="block text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Requisito tecnico
                  <input
                    value={raiDraft.requisito}
                    onChange={(e) => setRaiDraft((prev) => ({ ...prev, requisito: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                    placeholder="Ex.: ISO 9001:2015 - 7.1.5"
                  />
                </label>

                <label className="block text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Classificacao
                  <select
                    value={raiDraft.classificacao}
                    onChange={(e) =>
                      setRaiDraft((prev) => ({
                        ...prev,
                        classificacao: e.target.value as RaiClassification,
                        recomendacao: prev.recomendacao || getSuggestedRecommendation(e.target.value as RaiClassification),
                      }))
                    }
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                  >
                    <option value="conformidade">Conformidade</option>
                    <option value="nao-conformidade">Nao conformidade</option>
                    <option value="observacao">Observacao</option>
                    <option value="oportunidade">Oportunidade de melhoria</option>
                  </select>
                </label>

                <label className="block text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Recomendacao / acao sugerida
                  <textarea
                    rows={3}
                    value={raiDraft.recomendacao}
                    onChange={(e) => setRaiDraft((prev) => ({ ...prev, recomendacao: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30 resize-y"
                    placeholder={getSuggestedRecommendation(raiDraft.classificacao)}
                  />
                </label>
              </div>

              <div className="p-4 overflow-y-auto">
                <div className="bg-certifica-50 border border-certifica-200 rounded-[4px] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-certifica-900" style={{ fontWeight: 600 }}>
                      Preview do RAI
                    </span>
                    <DSBadge variant={raiClassificationConfig[raiDraft.classificacao].variant} className="text-[9px] px-1.5 py-0">
                      {raiClassificationConfig[raiDraft.classificacao].label}
                    </DSBadge>
                  </div>

                  <div className="space-y-2 text-[11.5px] text-certifica-dark" style={{ fontWeight: 400, lineHeight: "1.55" }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>Descricao: </span>
                      {selectedRaiAudit
                        ? `Durante a auditoria ${selectedRaiAudit.type.toLowerCase()} em ${selectedRaiAudit.client}, referente a ${selectedRaiAudit.standard}, foi analisado o requisito "${raiDraft.requisito || selectedRaiAudit.standard}".`
                        : "Selecione uma auditoria para iniciar."}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>Evidencia objetiva: </span>
                      {raiDraft.evidencia || "Nao informada."}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>Requisito tecnico: </span>
                      {raiDraft.requisito || (selectedRaiAudit?.standard ?? "Nao informado.")}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>Classificacao: </span>
                      {raiClassificationConfig[raiDraft.classificacao].label}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>Recomendacao: </span>
                      {raiDraft.recomendacao || getSuggestedRecommendation(raiDraft.classificacao)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <DSButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRaiModalOpen(false)}
                  >
                    Fechar
                  </DSButton>
                  <DSButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyRai}
                  >
                    {copiedRai ? "RAI copiado" : "Copiar RAI"}
                  </DSButton>
                  <DSButton
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={openRaiEditor}
                  >
                    Abrir editor RAI
                  </DSButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}