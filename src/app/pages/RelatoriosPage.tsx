import React, { useMemo, useState } from "react";
import { DSBadge } from "../components/ds/DSBadge";
import { DSButton } from "../components/ds/DSButton";
import { DSCard } from "../components/ds/DSCard";
import { DSInput } from "../components/ds/DSInput";
import { DSSelect } from "../components/ds/DSSelect";
import { DSTable } from "../components/ds/DSTable";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  AlertTriangle, Bot, CalendarClock, Download, FileSpreadsheet, FileText,
  Plus, Send, TrendingUp, TrendingDown, BarChart3, PieChartIcon, Activity,
} from "lucide-react";

type TemplateId = "auditoria" | "nc" | "projeto" | "reunioes" | "documentos";

interface MonthlyData {
  month: string;
  monthNum: number;
  year: number;
  company: string;
  auditorias: number;
  ncs: number;
  projetos: number;
  score: number;
  documentos: number;
  treinamentos: number;
}

interface ScheduleItem {
  id: string;
  reportName: string;
  recurrence: string;
  nextRun: string;
  destination: string;
}

interface EmissionTrail {
  id: string;
  date: string;
  action: "emitido" | "exportado-pdf" | "exportado-excel" | "compartilhado";
  report: string;
  actor: string;
  destination?: string;
}

const COLORS = ["#0E9AA7", "#3DC1D3", "#F6D55C", "#ED553B", "#20639B", "#173F5F", "#F07D00"];

const companies = ["Metalúrgica AçoForte", "Grupo Energis", "Plastiform Industrial", "TechSoft Sistemas", "BioFarma Ltda"];
const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function generateMonthlyData(): MonthlyData[] {
  const data: MonthlyData[] = [];
  const baseScores: Record<string, number> = {
    "Metalúrgica AçoForte": 82, "Grupo Energis": 68, "Plastiform Industrial": 76,
    "TechSoft Sistemas": 55, "BioFarma Ltda": 71,
  };
  for (const company of companies) {
    const base = baseScores[company] ?? 70;
    for (let m = 0; m < 12; m++) {
      const variation = Math.round((Math.sin(m * 0.8 + companies.indexOf(company)) * 8) + (Math.random() * 6 - 3));
      data.push({
        month: months[m], monthNum: m + 1, year: 2025, company,
        auditorias: Math.max(0, Math.round(2 + Math.random() * 4)),
        ncs: Math.max(0, Math.round(1 + Math.random() * 5)),
        projetos: Math.max(1, Math.round(1 + Math.random() * 3)),
        score: Math.min(100, Math.max(30, base + variation)),
        documentos: Math.max(1, Math.round(3 + Math.random() * 8)),
        treinamentos: Math.max(0, Math.round(Math.random() * 3)),
      });
    }
    for (let m = 0; m < 2; m++) {
      const variation = Math.round((Math.sin((m + 12) * 0.8 + companies.indexOf(company)) * 8) + (Math.random() * 6 - 3));
      data.push({
        month: months[m], monthNum: m + 1, year: 2026, company,
        auditorias: Math.max(0, Math.round(2 + Math.random() * 4)),
        ncs: Math.max(0, Math.round(1 + Math.random() * 5)),
        projetos: Math.max(1, Math.round(1 + Math.random() * 3)),
        score: Math.min(100, Math.max(30, base + variation + 3)),
        documentos: Math.max(1, Math.round(3 + Math.random() * 8)),
        treinamentos: Math.max(0, Math.round(Math.random() * 3)),
      });
    }
  }
  return data;
}

const allData = generateMonthlyData();

const templates = [
  { id: "auditoria" as TemplateId, name: "Auditorias", desc: "Consolidado de auditorias por ciclo e status." },
  { id: "nc" as TemplateId, name: "Não conformidades", desc: "NCs abertas, tratadas e reincidentes." },
  { id: "projeto" as TemplateId, name: "Status de projeto", desc: "Progresso, prazos e risco de projetos." },
  { id: "reunioes" as TemplateId, name: "Reuniões", desc: "Cadência de reuniões e execução de ações." },
  { id: "documentos" as TemplateId, name: "Documentos", desc: "Versionamento, revisão e conformidade." },
];

const metricKey: Record<TemplateId, keyof MonthlyData> = {
  auditoria: "auditorias", nc: "ncs", projeto: "projetos",
  reunioes: "score", documentos: "documentos",
};

const initialSchedules: ScheduleItem[] = [
  { id: "S-1", reportName: "Relatório Executivo - Auditoria", recurrence: "Semanal · Seg 08:00", nextRun: "24/02/2026 08:00", destination: "diretoria@certifica.com" },
  { id: "S-2", reportName: "Painel Auditorias - Consolidado", recurrence: "Mensal · Dia 01", nextRun: "01/03/2026 09:00", destination: "diretoria@certifica.com" },
];

const initialTrail: EmissionTrail[] = [
  { id: "T-1", date: "19/02/2026 09:12", action: "emitido", report: "Status de projeto", actor: "Carlos Silva" },
  { id: "T-2", date: "19/02/2026 09:13", action: "exportado-pdf", report: "Status de projeto", actor: "Carlos Silva" },
  { id: "T-3", date: "18/02/2026 18:02", action: "compartilhado", report: "Auditorias", actor: "Ana Costa", destination: "diretoria@certifica.com" },
];

const actionLabel: Record<EmissionTrail["action"], string> = {
  emitido: "Emitido", "exportado-pdf": "PDF", "exportado-excel": "Excel", compartilhado: "Compartilhado",
};

export default function RelatoriosPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("auditoria");
  const [filterCompany, setFilterCompany] = useState("todas");
  const [filterYear, setFilterYear] = useState("2026");
  const [filterMonth, setFilterMonth] = useState("todos");
  const [trail, setTrail] = useState<EmissionTrail[]>(initialTrail);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ recurrence: "Semanal · Seg 08:00", nextRun: "", destination: "" });
  const [chartView, setChartView] = useState<"bar" | "line" | "pie">("bar");

  const filteredData = useMemo(() => {
    return allData.filter((d) => {
      if (filterCompany !== "todas" && d.company !== filterCompany) return false;
      if (filterYear !== "todos" && String(d.year) !== filterYear) return false;
      if (filterMonth !== "todos" && String(d.monthNum) !== filterMonth) return false;
      return true;
    });
  }, [filterCompany, filterYear, filterMonth]);

  const key = metricKey[selectedTemplate];

  const chartDataByMonth = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    filteredData.forEach((d) => {
      const label = `${d.month}/${d.year}`;
      if (!map.has(label)) map.set(label, {});
      const bucket = map.get(label)!;
      bucket[d.company] = (bucket[d.company] ?? 0) + (d[key] as number);
    });
    return Array.from(map.entries()).map(([label, values]) => ({ label, ...values }));
  }, [filteredData, key]);

  const chartDataTrend = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    filteredData.forEach((d) => {
      const label = `${d.month}/${d.year}`;
      const prev = map.get(label) ?? { total: 0, count: 0 };
      prev.total += d[key] as number;
      prev.count += 1;
      map.set(label, prev);
    });
    return Array.from(map.entries()).map(([label, { total, count }]) => ({ label, media: Math.round(total / count) }));
  }, [filteredData, key]);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach((d) => {
      map.set(d.company, (map.get(d.company) ?? 0) + (d[key] as number));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredData, key]);

  const kpis = useMemo(() => {
    if (filteredData.length === 0) return { total: 0, avgScore: 0, totalNCs: 0, totalDocs: 0, trend: 0 };
    const total = filteredData.reduce((a, d) => a + (d[key] as number), 0);
    const avgScore = Math.round(filteredData.reduce((a, d) => a + d.score, 0) / filteredData.length);
    const totalNCs = filteredData.reduce((a, d) => a + d.ncs, 0);
    const totalDocs = filteredData.reduce((a, d) => a + d.documentos, 0);
    const half = Math.floor(filteredData.length / 2);
    const firstHalf = filteredData.slice(0, half);
    const secondHalf = filteredData.slice(half);
    const avgFirst = firstHalf.length > 0 ? firstHalf.reduce((a, d) => a + d.score, 0) / firstHalf.length : 0;
    const avgSecond = secondHalf.length > 0 ? secondHalf.reduce((a, d) => a + d.score, 0) / secondHalf.length : 0;
    return { total, avgScore, totalNCs, totalDocs, trend: Math.round(avgSecond - avgFirst) };
  }, [filteredData, key]);

  const executiveSummary = useMemo(() => {
    if (filteredData.length === 0) return "Sem dados no recorte selecionado.";
    const tplName = templates.find((t) => t.id === selectedTemplate)?.name ?? "Relatório";
    const yearLabel = filterYear !== "todos" ? filterYear : "todos os anos";
    const companyLabel = filterCompany !== "todas" ? filterCompany : "todas as empresas";
    const trendText = kpis.trend >= 0 ? `evolução positiva de +${kpis.trend} pontos` : `queda de ${kpis.trend} pontos`;
    return `${tplName} (${yearLabel}, ${companyLabel}): Score médio ${kpis.avgScore}, com ${trendText} no período. Total de ${kpis.totalNCs} NCs registradas e ${kpis.totalDocs} documentos processados. Empresas com score abaixo de 60 devem receber atenção prioritária.`;
  }, [filteredData, selectedTemplate, filterYear, filterCompany, kpis]);

  const registerTrail = (action: EmissionTrail["action"], destination?: string) => {
    const now = new Date().toLocaleString("pt-BR");
    const reportName = templates.find((t) => t.id === selectedTemplate)?.name ?? "Relatório";
    setTrail((prev) => [{ id: `T-${Date.now()}`, date: now, action, report: reportName, actor: "Carlos Silva", destination }, ...prev]);
  };

  const createSchedule = () => {
    if (!scheduleForm.nextRun.trim() || !scheduleForm.destination.trim()) return;
    const reportName = templates.find((t) => t.id === selectedTemplate)?.name ?? "Relatório";
    setSchedules((prev) => [{ id: `S-${Date.now()}`, reportName: `Relatório ${reportName}`, recurrence: scheduleForm.recurrence, nextRun: scheduleForm.nextRun, destination: scheduleForm.destination }, ...prev]);
    setShowSchedule(false);
    setScheduleForm({ recurrence: "Semanal · Seg 08:00", nextRun: "", destination: "" });
    registerTrail("compartilhado", scheduleForm.destination);
  };

  const companyTableData = useMemo(() => {
    const map = new Map<string, { score: number; auditorias: number; ncs: number; documentos: number; projetos: number; count: number }>();
    filteredData.forEach((d) => {
      const prev = map.get(d.company) ?? { score: 0, auditorias: 0, ncs: 0, documentos: 0, projetos: 0, count: 0 };
      prev.score += d.score; prev.auditorias += d.auditorias; prev.ncs += d.ncs;
      prev.documentos += d.documentos; prev.projetos += d.projetos; prev.count += 1;
      map.set(d.company, prev);
    });
    return Array.from(map.entries()).map(([empresa, v]) => ({
      empresa, scoreMedia: Math.round(v.score / v.count), auditorias: v.auditorias,
      ncs: v.ncs, documentos: v.documentos, projetos: v.projetos,
    }));
  }, [filteredData]);

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-certifica-900 text-lg" style={{ fontWeight: 700 }}>Relatórios</h2>
          <p className="text-[11px] text-certifica-500">Visualização completa com gráficos, filtros por período e empresa, IA e exportação.</p>
        </div>
        <div className="flex items-center gap-2">
          <DSButton variant="outline" size="sm" icon={<CalendarClock className="w-3.5 h-3.5" />} onClick={() => setShowSchedule(true)}>Agendar envio</DSButton>
          <DSButton variant="outline" size="sm" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => registerTrail("exportado-pdf")}>PDF</DSButton>
          <DSButton size="sm" icon={<FileSpreadsheet className="w-3.5 h-3.5" />} onClick={() => registerTrail("exportado-excel")}>Excel</DSButton>
        </div>
      </div>

      {/* Templates */}
      <div className="grid grid-cols-6 gap-2">
        {templates.map((tpl) => (
          <button key={tpl.id} onClick={() => { setSelectedTemplate(tpl.id); registerTrail("emitido"); }} className={`text-left border rounded-[4px] p-2.5 transition-colors ${selectedTemplate === tpl.id ? "bg-certifica-accent-light border-certifica-accent/40" : "bg-white border-certifica-200 hover:bg-certifica-50"}`}>
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
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-certifica-500 mb-1" style={{ fontWeight: 600 }}>Mês</label>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full h-8 px-2 rounded-[4px] border border-certifica-200 text-[11px]">
              <option value="todos">Todos</option>
              {months.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-certifica-500 mb-1" style={{ fontWeight: 600 }}>Empresa</label>
            <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} className="w-full h-8 px-2 rounded-[4px] border border-certifica-200 text-[11px]">
              <option value="todas">Todas empresas</option>
              {companies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-certifica-500 mb-1" style={{ fontWeight: 600 }}>Tipo de gráfico</label>
            <div className="flex gap-1">
              {([["bar", <BarChart3 className="w-3.5 h-3.5" />], ["line", <Activity className="w-3.5 h-3.5" />], ["pie", <PieChartIcon className="w-3.5 h-3.5" />]] as [string, React.ReactNode][]).map(([type, icon]) => (
                <button key={type} onClick={() => setChartView(type as "bar" | "line" | "pie")} className={`h-8 w-10 rounded-[4px] border flex items-center justify-center ${chartView === type ? "border-certifica-accent bg-certifica-accent-light text-certifica-accent" : "border-certifica-200 text-certifica-500 hover:text-certifica-dark"}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total no período", value: kpis.total, color: "text-certifica-accent" },
          { label: "Score médio", value: `${kpis.avgScore}%`, color: "text-certifica-accent" },
          { label: "NCs registradas", value: kpis.totalNCs, color: "text-nao-conformidade" },
          { label: "Documentos", value: kpis.totalDocs, color: "text-oportunidade" },
          { label: "Tendência", value: `${kpis.trend >= 0 ? "+" : ""}${kpis.trend}`, color: kpis.trend >= 0 ? "text-conformidade" : "text-nao-conformidade", icon: kpis.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" /> },
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
      <div className="grid grid-cols-[1fr_320px] gap-4">
        <div className="bg-white border border-certifica-200 rounded-[4px] p-4">
          <div className="text-[12px] text-certifica-900 mb-3" style={{ fontWeight: 600 }}>
            {templates.find((t) => t.id === selectedTemplate)?.name} — por {filterCompany === "todas" ? "empresa/mês" : `${filterCompany}/mês`}
          </div>

          {chartView === "bar" && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartDataByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {(filterCompany === "todas" ? companies : [filterCompany]).map((c, i) => (
                  <Bar key={c} dataKey={c} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartView === "line" && (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartDataTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
                <Line type="monotone" dataKey="media" stroke="#0E9AA7" strokeWidth={2} dot={{ r: 3 }} name="Média" />
              </LineChart>
            </ResponsiveContainer>
          )}

          {chartView === "pie" && (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
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
              <span className="text-[11px] text-certifica-900" style={{ fontWeight: 600 }}>Resumo IA</span>
            </div>
            <p className="text-[10.5px] text-certifica-dark leading-relaxed">{executiveSummary}</p>
          </div>

          <div className="bg-white border border-certifica-200 rounded-[4px] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-nao-conformidade" />
              <span className="text-[11px] text-certifica-900" style={{ fontWeight: 600 }}>Alertas</span>
            </div>
            <div className="space-y-1">
              {companyTableData.filter((c) => c.scoreMedia < 65).length === 0 ? (
                <p className="text-[10px] text-certifica-500">Nenhuma anomalia relevante.</p>
              ) : (
                companyTableData.filter((c) => c.scoreMedia < 65).map((c) => (
                  <div key={c.empresa} className="text-[10px] text-nao-conformidade border border-nao-conformidade/20 rounded-[3px] px-2 py-1">
                    {c.empresa}: score {c.scoreMedia} (abaixo do limiar)
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
            { key: "scoreMedia", header: "Score médio", render: (row) => {
              const v = Number(row.scoreMedia);
              return <DSBadge variant={v >= 75 ? "conformidade" : v >= 60 ? "observacao" : "nao-conformidade"}>{v}%</DSBadge>;
            }},
            { key: "auditorias", header: "Auditorias" },
            { key: "ncs", header: "NCs" },
            { key: "documentos", header: "Documentos" },
            { key: "projetos", header: "Projetos" },
          ]}
          data={companyTableData}
        />
      </div>

      {/* Schedule + Trail */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-certifica-200 rounded-[4px] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-certifica-900" style={{ fontWeight: 600 }}>Agendamentos</span>
            <button onClick={() => setShowSchedule(true)} className="text-[10px] text-certifica-accent hover:underline flex items-center gap-0.5 cursor-pointer"><Plus className="w-3 h-3" /> Novo</button>
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
            {trail.slice(0, 8).map((t) => (
              <div key={t.id} className="text-[10px] text-certifica-500 border border-certifica-200 rounded-[3px] px-2 py-1">
                {t.date} · {actionLabel[t.action]} · {t.report} · {t.actor}{t.destination ? ` → ${t.destination}` : ""}
              </div>
            ))}
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
