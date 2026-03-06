import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DSBadge } from "../components/ds/DSBadge";
import { DSButton } from "../components/ds/DSButton";
import { DSInput } from "../components/ds/DSInput";
import { DSTable } from "../components/ds/DSTable";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  AlertTriangle, Bot, CalendarClock, FileSpreadsheet, FileText,
  Plus, Send, TrendingUp, TrendingDown, BarChart3, PieChartIcon, Activity,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useDashboard } from "../lib/useDashboard";
import { useProjetos } from "../lib/useProjetos";
import { useClientes } from "../lib/useClientes";
import { useAudits } from "../lib/useAudits";
import { useTrainings } from "../lib/useTrainings";

// ── Types ─────────────────────────────────────────────────────────────────────

type TemplateId = "auditoria" | "nc" | "projeto" | "reunioes" | "documentos";

interface ScheduleItem {
  id: string;
  reportName: string;
  recurrence: string;
  nextRun: string;
  destination: string;
}

interface AuditLogRow {
  id: string;
  tabela: string;
  acao: string;
  created_at: string;
  [key: string]: unknown;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COLORS = ["#0E9AA7", "#3DC1D3", "#F6D55C", "#ED553B", "#20639B", "#173F5F", "#F07D00"];

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const templates = [
  { id: "auditoria" as TemplateId, name: "Auditorias", desc: "Consolidado de auditorias por ciclo e status." },
  { id: "nc" as TemplateId, name: "Não conformidades", desc: "NCs abertas, tratadas e reincidentes." },
  { id: "projeto" as TemplateId, name: "Status de projeto", desc: "Progresso, prazos e risco de projetos." },
  { id: "reunioes" as TemplateId, name: "Reuniões", desc: "Cadência de reuniões e execução de ações." },
  { id: "documentos" as TemplateId, name: "Documentos", desc: "Versionamento, revisão e conformidade." },
];

// Default filters for useDashboard — fetch all data with no period restriction
const DASHBOARD_FILTERS = {
  periodo: "all" as const,
  consultor: "todos",
  cliente: "todos",
  norma: "todas",
};

// ── Helper: get the last 6 calendar months as { label, monthNum, year } ───────

function getLast6Months(): { label: string; monthNum: number; year: number }[] {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      label: `${MONTH_LABELS[d.getMonth()]}/${d.getFullYear()}`,
      monthNum: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }
  return result;
}

export default function RelatoriosPage() {
  // ── Real data hooks ──────────────────────────────────────────────────────────
  const { kpis: dashKpis, loading: dashLoading } = useDashboard(DASHBOARD_FILTERS);
  const { projetos } = useProjetos();
  const { clientes } = useClientes();
  const { audits } = useAudits();
  const { trainings } = useTrainings();

  // ── Audit log trail (direct Supabase fetch) ──────────────────────────────────
  const [trail, setTrail] = useState<AuditLogRow[]>([]);

  useEffect(() => {
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setTrail(data ?? []));
  }, []);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("auditoria");
  const [filterYear, setFilterYear] = useState("todos");
  const [filterMonth, setFilterMonth] = useState("todos");
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    // Seed first schedule name from real project data when available;
    // fall back to a sensible default. Re-seeded in an effect below.
    return [
      { id: "S-1", reportName: "Relatório Executivo - Auditoria", recurrence: "Semanal · Seg 08:00", nextRun: "24/02/2026 08:00", destination: "diretoria@certifica.com" },
      { id: "S-2", reportName: "Painel Auditorias - Consolidado", recurrence: "Mensal · Dia 01", nextRun: "01/03/2026 09:00", destination: "diretoria@certifica.com" },
    ];
  });
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ recurrence: "Semanal · Seg 08:00", nextRun: "", destination: "" });
  const [chartView, setChartView] = useState<"bar" | "line" | "pie">("bar");

  // Update the first schedule's report name once real projects are loaded
  useEffect(() => {
    if (projetos.length === 0) return;
    const firstName = projetos[0].titulo ?? "Projeto";
    setSchedules((prev) =>
      prev.map((s, idx) =>
        idx === 0 ? { ...s, reportName: `Relatório Executivo - ${firstName}` } : s
      )
    );
  }, [projetos]);

  // ── Last 6 months buckets ────────────────────────────────────────────────────
  const last6Months = useMemo(() => getLast6Months(), []);

  // Projects per month (last 6 months)
  const projetosPerMonth = useMemo(() => {
    return last6Months.map(({ label, monthNum, year }) => {
      const count = projetos.filter((p) => {
        if (!p.created_at) return false;
        const d = new Date(p.created_at);
        return d.getMonth() + 1 === monthNum && d.getFullYear() === year;
      }).length;
      return { label, projetos: count };
    });
  }, [last6Months, projetos]);

  // Audits per month (last 6 months) using data_inicio
  const auditsPerMonth = useMemo(() => {
    return last6Months.map(({ label, monthNum, year }) => {
      const count = audits.filter((a) => {
        const dateStr = a.data_inicio;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getMonth() + 1 === monthNum && d.getFullYear() === year;
      }).length;
      return { label, auditorias: count };
    });
  }, [last6Months, audits]);

  // Trainings per month (last 6 months) using data_inicio
  const trainingsPerMonth = useMemo(() => {
    return last6Months.map(({ label, monthNum, year }) => {
      const count = trainings.filter((t) => {
        if (!t.data_inicio) return false;
        const d = new Date(t.data_inicio);
        return d.getMonth() + 1 === monthNum && d.getFullYear() === year;
      }).length;
      return { label, treinamentos: count };
    });
  }, [last6Months, trainings]);

  // Conformidade rate per month: (non-NC findings) / total findings * 100
  const conformidadePerMonth = useMemo(() => {
    return last6Months.map(({ label, monthNum, year }) => {
      const monthAudits = audits.filter((a) => {
        const dateStr = a.data_inicio;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getMonth() + 1 === monthNum && d.getFullYear() === year;
      });
      const totalFindings = monthAudits.reduce((s, a) => s + (a.findings?.length ?? 0), 0);
      const ncFindings = monthAudits.reduce(
        (s, a) =>
          s +
          (a.findings?.filter(
            (f: { tipo?: string }) => f.tipo === "nc-maior" || f.tipo === "nc-menor"
          ).length ?? 0),
        0
      );
      const rate = totalFindings > 0 ? Math.round(((totalFindings - ncFindings) / totalFindings) * 100) : 100;
      return { label, conformidade: rate };
    });
  }, [last6Months, audits]);

  // ── KPIs from real data ──────────────────────────────────────────────────────
  const totalProjetos = projetos.length;
  const projetosAtivos = projetos.filter((p) => p.status === "em-andamento").length;
  const totalClientes = clientes.length;
  const totalAuditorias = audits.length;

  // ── Chart data based on selected template ────────────────────────────────────
  // Each template maps to one of the real monthly arrays for the main chart
  const mainChartData = useMemo(() => {
    switch (selectedTemplate) {
      case "auditoria":
        return auditsPerMonth.map((d) => ({ label: d.label, Auditorias: d.auditorias }));
      case "nc":
        return conformidadePerMonth.map((d) => ({ label: d.label, "Conf. %": d.conformidade }));
      case "projeto":
        return projetosPerMonth.map((d) => ({ label: d.label, Projetos: d.projetos }));
      case "reunioes":
        // Use audits as a proxy for meeting cadence (activity per month)
        return auditsPerMonth.map((d) => ({ label: d.label, Atividades: d.auditorias }));
      case "documentos":
        return projetosPerMonth.map((d) => ({ label: d.label, Documentos: d.projetos }));
      default:
        return projetosPerMonth.map((d) => ({ label: d.label, Projetos: d.projetos }));
    }
  }, [selectedTemplate, auditsPerMonth, conformidadePerMonth, projetosPerMonth]);

  const mainChartKey = useMemo(() => {
    const keys = Object.keys(mainChartData[0] ?? {}).filter((k) => k !== "label");
    return keys[0] ?? "value";
  }, [mainChartData]);

  // Trend line: same data as main chart, field renamed to "media"
  const trendChartData = useMemo(
    () => mainChartData.map((d) => ({ label: d.label, media: d[mainChartKey] as number })),
    [mainChartData, mainChartKey]
  );

  // Pie: distribution of audits by status
  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    audits.forEach((a) => {
      const key = a.status ?? "indefinido";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [audits]);

  // ── Filter mainChartData by filterYear / filterMonth ────────────────────────
  const filteredChartData = useMemo(() => {
    return mainChartData.filter((d) => {
      const [monthLabel, yearStr] = d.label.split("/");
      if (filterYear !== "todos" && yearStr !== filterYear) return false;
      if (filterMonth !== "todos") {
        const monthIdx = MONTH_LABELS.indexOf(monthLabel);
        if (String(monthIdx + 1) !== filterMonth) return false;
      }
      return true;
    });
  }, [mainChartData, filterYear, filterMonth]);

  const filteredTrendData = useMemo(() => {
    return trendChartData.filter((d) => {
      const [monthLabel, yearStr] = d.label.split("/");
      if (filterYear !== "todos" && yearStr !== filterYear) return false;
      if (filterMonth !== "todos") {
        const monthIdx = MONTH_LABELS.indexOf(monthLabel);
        if (String(monthIdx + 1) !== filterMonth) return false;
      }
      return true;
    });
  }, [trendChartData, filterYear, filterMonth]);

  // ── Company table: derive from projetos grouped by cliente ──────────────────
  const companyTableData = useMemo(() => {
    const map = new Map<
      string,
      { empresa: string; projetos: number; ativos: number; auditorias: number; ncs: number }
    >();
    projetos.forEach((p) => {
      const key = p.cliente_nome ?? p.cliente_id ?? "—";
      const prev = map.get(key) ?? { empresa: key, projetos: 0, ativos: 0, auditorias: 0, ncs: 0 };
      prev.projetos++;
      if (p.status === "em-andamento") prev.ativos++;
      map.set(key, prev);
    });
    audits.forEach((a) => {
      const key = a.cliente_nome ?? "—";
      if (!map.has(key)) map.set(key, { empresa: key, projetos: 0, ativos: 0, auditorias: 0, ncs: 0 });
      const row = map.get(key)!;
      row.auditorias++;
      row.ncs += a.findings?.filter(
        (f: { tipo?: string }) => f.tipo === "nc-maior" || f.tipo === "nc-menor"
      ).length ?? 0;
    });
    return Array.from(map.values());
  }, [projetos, audits]);

  // ── Executive summary ────────────────────────────────────────────────────────
  const executiveSummary = useMemo(() => {
    const tplName = templates.find((t) => t.id === selectedTemplate)?.name ?? "Relatório";
    const conformidade = dashKpis.conformidade;
    const ncs = dashKpis.ncs;
    return `${tplName}: ${totalProjetos} projeto(s) cadastrado(s), ${projetosAtivos} em andamento. Taxa de conformidade atual: ${conformidade}%. Total de ${ncs} não conformidade(s) registrada(s) em ${totalAuditorias} auditoria(s). ${totalClientes} cliente(s) ativos na base.`;
  }, [selectedTemplate, totalProjetos, projetosAtivos, totalClientes, totalAuditorias, dashKpis]);

  // ── Alerts: projects with high NC count ──────────────────────────────────────
  const alertCompanies = useMemo(
    () => companyTableData.filter((c) => c.ncs >= 3),
    [companyTableData]
  );

  // ── Schedule modal actions ───────────────────────────────────────────────────
  const createSchedule = () => {
    if (!scheduleForm.nextRun.trim() || !scheduleForm.destination.trim()) return;
    const reportName = templates.find((t) => t.id === selectedTemplate)?.name ?? "Relatório";
    setSchedules((prev) => [
      {
        id: `S-${Date.now()}`,
        reportName: `Relatório ${reportName}`,
        recurrence: scheduleForm.recurrence,
        nextRun: scheduleForm.nextRun,
        destination: scheduleForm.destination,
      },
      ...prev,
    ]);
    setShowSchedule(false);
    setScheduleForm({ recurrence: "Semanal · Seg 08:00", nextRun: "", destination: "" });
    toast.success("Agendamento criado!");
  };

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (dashLoading) {
    return (
      <div className="p-5 flex items-center justify-center h-64">
        <div className="text-certifica-500 text-sm">Carregando dados...</div>
      </div>
    );
  }

  // ── Derive available years from projetos for filter dropdowns ─────────────────
  const availableYears = Array.from(
    new Set(projetos.map((p) => p.created_at ? new Date(p.created_at).getFullYear() : null).filter(Boolean))
  ).sort((a, b) => (b as number) - (a as number)) as number[];

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-certifica-900 text-lg" style={{ fontWeight: 700 }}>Relatórios</h2>
          <p className="text-[11px] text-certifica-500">Visualização completa com gráficos, filtros por período e empresa, análise e exportação.</p>
        </div>
        <div className="flex items-center gap-2">
          <DSButton variant="outline" size="sm" icon={<CalendarClock className="w-3.5 h-3.5" />} onClick={() => setShowSchedule(true)}>Agendar envio</DSButton>
          <DSButton variant="outline" size="sm" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => toast.success("Exportando PDF...")}>PDF</DSButton>
          <DSButton size="sm" icon={<FileSpreadsheet className="w-3.5 h-3.5" />} onClick={() => toast.success("Exportando Excel...")}>Excel</DSButton>
        </div>
      </div>

      {/* Templates */}
      <div className="grid grid-cols-6 gap-2">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setSelectedTemplate(tpl.id)}
            className={`text-left border rounded-[4px] p-2.5 transition-colors ${selectedTemplate === tpl.id ? "bg-certifica-accent-light border-certifica-accent/40" : "bg-white border-certifica-200 hover:bg-certifica-50"}`}
          >
            <div className="text-[11px] text-certifica-900" style={{ fontWeight: 600 }}>{tpl.name}</div>
            <div className="text-[9.5px] text-certifica-500 mt-0.5">{tpl.desc}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-certifica-200 rounded-[4px] p-3 flex items-end gap-3">
        <div className="flex-1 grid grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] text-certifica-500 mb-1" style={{ fontWeight: 600 }}>Ano</label>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full h-8 px-2 rounded-[4px] border border-certifica-200 text-[11px]">
              <option value="todos">Todos</option>
              {availableYears.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-certifica-500 mb-1" style={{ fontWeight: 600 }}>Mês</label>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full h-8 px-2 rounded-[4px] border border-certifica-200 text-[11px]">
              <option value="todos">Todos</option>
              {MONTH_LABELS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-certifica-500 mb-1" style={{ fontWeight: 600 }}>Tipo de gráfico</label>
            <div className="flex gap-1">
              {([["bar", <BarChart3 className="w-3.5 h-3.5" />], ["line", <Activity className="w-3.5 h-3.5" />], ["pie", <PieChartIcon className="w-3.5 h-3.5" />]] as [string, React.ReactNode][]).map(([type, icon]) => (
                <button
                  key={type}
                  onClick={() => setChartView(type as "bar" | "line" | "pie")}
                  className={`h-8 w-10 rounded-[4px] border flex items-center justify-center ${chartView === type ? "border-certifica-accent bg-certifica-accent-light text-certifica-accent" : "border-certifica-200 text-certifica-500 hover:text-certifica-dark"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs — real data */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total projetos", value: totalProjetos, color: "text-certifica-accent" },
          { label: "Projetos ativos", value: projetosAtivos, color: "text-certifica-accent" },
          { label: "Clientes", value: totalClientes, color: "text-oportunidade" },
          { label: "Auditorias", value: totalAuditorias, color: "text-certifica-dark" },
          {
            label: "Conformidade",
            value: `${dashKpis.conformidade}%`,
            color: dashKpis.conformidade >= 70 ? "text-conformidade" : "text-nao-conformidade",
            icon: dashKpis.conformidade >= 70 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
          },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-certifica-200 rounded-[4px] p-3">
            <div className="text-[10px] uppercase tracking-wider text-certifica-500 mb-1" style={{ fontWeight: 600 }}>{k.label}</div>
            <div className={`text-xl ${k.color} flex items-center gap-1.5`} style={{ fontWeight: 700 }}>
              {"icon" in k && k.icon}{k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="bg-white border border-certifica-200 rounded-[4px] p-4">
          <div className="text-[12px] text-certifica-900 mb-3" style={{ fontWeight: 600 }}>
            {templates.find((t) => t.id === selectedTemplate)?.name} — últimos 6 meses
          </div>

          {chartView === "bar" && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={filteredChartData.length > 0 ? filteredChartData : mainChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey={mainChartKey} fill={COLORS[0]} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartView === "line" && (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={filteredTrendData.length > 0 ? filteredTrendData : trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                <Line type="monotone" dataKey="media" stroke="#0E9AA7" strokeWidth={2} dot={{ r: 3 }} name="Total" />
              </LineChart>
            </ResponsiveContainer>
          )}

          {chartView === "pie" && (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${String(name).split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-white border border-certifica-200 rounded-[4px] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Bot className="w-3.5 h-3.5 text-certifica-accent" />
              <span className="text-[11px] text-certifica-900" style={{ fontWeight: 600 }}>Resumo Analítico</span>
            </div>
            <p className="text-[10.5px] text-certifica-dark leading-relaxed">{executiveSummary}</p>
          </div>

          <div className="bg-white border border-certifica-200 rounded-[4px] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-nao-conformidade" />
              <span className="text-[11px] text-certifica-900" style={{ fontWeight: 600 }}>Alertas</span>
            </div>
            <div className="space-y-1">
              {alertCompanies.length === 0 ? (
                <p className="text-[10px] text-certifica-500">Nenhuma anomalia relevante.</p>
              ) : (
                alertCompanies.map((c) => (
                  <div key={c.empresa} className="text-[10px] text-nao-conformidade border border-nao-conformidade/20 rounded-[3px] px-2 py-1">
                    {c.empresa}: {c.ncs} NC(s) registrada(s)
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Company table */}
      <div className="bg-white border border-certifica-200 rounded-[4px] p-4">
        <div className="text-[12px] text-certifica-900 mb-3" style={{ fontWeight: 600 }}>Consolidado por empresa</div>
        <DSTable
          columns={[
            { key: "empresa", header: "Empresa" },
            {
              key: "projetos",
              header: "Projetos",
              render: (row) => <span>{row.projetos}</span>,
            },
            {
              key: "ativos",
              header: "Ativos",
              render: (row) => {
                const total = Number(row.projetos);
                const ativos = Number(row.ativos);
                const pct = total > 0 ? Math.round((ativos / total) * 100) : 0;
                return <DSBadge variant={pct >= 50 ? "conformidade" : "observacao"}>{ativos}</DSBadge>;
              },
            },
            { key: "auditorias", header: "Auditorias" },
            {
              key: "ncs",
              header: "NCs",
              render: (row) => {
                const v = Number(row.ncs);
                return <DSBadge variant={v === 0 ? "conformidade" : v < 3 ? "observacao" : "nao-conformidade"}>{v}</DSBadge>;
              },
            },
          ]}
          data={companyTableData}
        />
      </div>

      {/* Schedule + Trail */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-certifica-200 rounded-[4px] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-certifica-900" style={{ fontWeight: 600 }}>Agendamentos</span>
            <button onClick={() => setShowSchedule(true)} className="text-[10px] text-certifica-accent hover:underline flex items-center gap-0.5 cursor-pointer">
              <Plus className="w-3 h-3" /> Novo
            </button>
          </div>
          <div className="space-y-1.5">
            {schedules.map((s) => (
              <div key={s.id} className="border border-certifica-200 rounded-[3px] px-2.5 py-1.5">
                <div className="text-[11px] text-certifica-dark" style={{ fontWeight: 500 }}>{s.reportName}</div>
                <div className="text-[9.5px] text-certifica-500">{s.recurrence} · Próxima: {s.nextRun} · {s.destination}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-certifica-200 rounded-[4px] p-3">
          <span className="text-[11px] text-certifica-900 block mb-2" style={{ fontWeight: 600 }}>Trilha de emissão</span>
          <div className="space-y-1">
            {trail.length === 0 && (
              <p className="text-[10px] text-certifica-500">Nenhum registro encontrado.</p>
            )}
            {trail.slice(0, 8).map((t) => {
              const dateStr = t.created_at
                ? new Date(t.created_at).toLocaleString("pt-BR")
                : "—";
              return (
                <div key={t.id} className="text-[10px] text-certifica-500 border border-certifica-200 rounded-[3px] px-2 py-1">
                  {dateStr} · {t.acao ?? "—"} · {t.tabela ?? "—"}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Schedule modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-certifica-dark/45" onClick={() => setShowSchedule(false)} />
          <div className="relative w-full max-w-[480px] bg-white border border-certifica-200 rounded-[6px] shadow-lg">
            <div className="px-4 py-3 border-b border-certifica-200">
              <h3 className="text-[14px] text-certifica-900" style={{ fontWeight: 600 }}>Agendar envio de relatório</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <DSInput label="Recorrência" value={scheduleForm.recurrence} onChange={(e) => setScheduleForm((p) => ({ ...p, recurrence: e.target.value }))} />
              <DSInput label="Próxima execução" value={scheduleForm.nextRun} onChange={(e) => setScheduleForm((p) => ({ ...p, nextRun: e.target.value }))} placeholder="DD/MM/AAAA HH:MM" />
              <DSInput label="Destino (email)" className="col-span-2" value={scheduleForm.destination} onChange={(e) => setScheduleForm((p) => ({ ...p, destination: e.target.value }))} placeholder="diretoria@certifica.com" />
              <div className="col-span-2 flex justify-end gap-2">
                <DSButton variant="outline" size="sm" onClick={() => setShowSchedule(false)}>Cancelar</DSButton>
                <DSButton size="sm" icon={<Send className="w-3 h-3" />} onClick={createSchedule}>Salvar</DSButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
