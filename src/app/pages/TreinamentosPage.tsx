import React, { useMemo, useState } from "react";
import { DSBadge } from "../components/ds/DSBadge";
import { DSButton } from "../components/ds/DSButton";
import {
  Search, GraduationCap, Plus, X, Users, Clock, Award, BookOpen,
  CheckCircle2, PlayCircle, Calendar, BarChart3, ChevronRight,
} from "lucide-react";

type TrainingStatus = "disponivel" | "em-andamento" | "concluido" | "expirado";
type TrainingCategory = "iso" | "auditoria" | "seguranca" | "ambiental" | "lideranca" | "tecnico";

interface Training {
  id: string;
  title: string;
  description: string;
  category: TrainingCategory;
  normRef?: string;
  duration: string;
  instructor: string;
  maxParticipants: number;
  enrolledCount: number;
  completedCount: number;
  nextDate?: string;
  format: "presencial" | "online" | "hibrido";
  mandatory: boolean;
}

interface Enrollment {
  id: string;
  trainingId: string;
  participant: string;
  company: string;
  status: TrainingStatus;
  enrollDate: string;
  completionDate?: string;
  score?: number;
  certificate?: boolean;
}

const categoryMeta: Record<TrainingCategory, { label: string; color: string }> = {
  iso: { label: "Normas ISO", color: "text-certifica-accent" },
  auditoria: { label: "Auditoria", color: "text-observacao" },
  seguranca: { label: "Segurança", color: "text-nao-conformidade" },
  ambiental: { label: "Ambiental", color: "text-conformidade" },
  lideranca: { label: "Liderança", color: "text-oportunidade" },
  tecnico: { label: "Técnico", color: "text-certifica-500" },
};

const statusMeta: Record<TrainingStatus, { label: string; variant: "outline" | "conformidade" | "observacao" | "oportunidade" | "nao-conformidade" }> = {
  disponivel: { label: "Disponível", variant: "oportunidade" },
  "em-andamento": { label: "Em andamento", variant: "observacao" },
  concluido: { label: "Concluído", variant: "conformidade" },
  expirado: { label: "Expirado", variant: "nao-conformidade" },
};

const trainings: Training[] = [
  { id: "t1", title: "Interpretação da ISO 9001:2015", description: "Entenda todos os requisitos da norma de qualidade e como aplicá-los na prática.", category: "iso", normRef: "ISO 9001", duration: "16h", instructor: "Carlos Silva", maxParticipants: 25, enrolledCount: 18, completedCount: 12, nextDate: "2026-03-15", format: "hibrido", mandatory: true },
  { id: "t2", title: "Auditor Interno ISO 9001", description: "Formação completa para conduzir auditorias internas eficazes.", category: "auditoria", normRef: "ISO 9001", duration: "24h", instructor: "Ana Costa", maxParticipants: 20, enrolledCount: 15, completedCount: 8, nextDate: "2026-04-01", format: "presencial", mandatory: true },
  { id: "t3", title: "Gestão Ambiental – ISO 14001", description: "Implementação e manutenção do sistema de gestão ambiental.", category: "ambiental", normRef: "ISO 14001", duration: "16h", instructor: "Roberto Lima", maxParticipants: 25, enrolledCount: 10, completedCount: 6, nextDate: "2026-03-20", format: "online", mandatory: false },
  { id: "t4", title: "Segurança do Trabalho – ISO 45001", description: "Identificação de perigos, avaliação de riscos e medidas de controle.", category: "seguranca", normRef: "ISO 45001", duration: "20h", instructor: "Juliana Mendes", maxParticipants: 30, enrolledCount: 22, completedCount: 14, nextDate: "2026-04-10", format: "presencial", mandatory: true },
  { id: "t5", title: "Segurança da Informação – ISO 27001", description: "Fundamentos do SGSI e controles do Anexo A.", category: "iso", normRef: "ISO 27001", duration: "12h", instructor: "Ana Costa", maxParticipants: 20, enrolledCount: 8, completedCount: 3, nextDate: "2026-05-01", format: "online", mandatory: false },
  { id: "t6", title: "Auditor Líder ISO 14001", description: "Formação avançada para liderar equipes de auditoria ambiental.", category: "auditoria", normRef: "ISO 14001", duration: "40h", instructor: "Roberto Lima", maxParticipants: 15, enrolledCount: 7, completedCount: 5, format: "presencial", mandatory: false },
  { id: "t7", title: "Liderança em Sistemas de Gestão", description: "Desenvolva habilidades de liderança para gestão de equipes em consultoria.", category: "lideranca", duration: "8h", instructor: "Carlos Silva", maxParticipants: 30, enrolledCount: 20, completedCount: 16, nextDate: "2026-03-25", format: "online", mandatory: false },
  { id: "t8", title: "FMEA e Ferramentas da Qualidade", description: "Análise de falhas, diagrama de Ishikawa, 5 Porquês e PDCA.", category: "tecnico", normRef: "ISO 9001", duration: "12h", instructor: "Juliana Mendes", maxParticipants: 25, enrolledCount: 14, completedCount: 9, format: "hibrido", mandatory: false },
  { id: "t9", title: "Gestão de Energia – ISO 50001", description: "Fundamentos de eficiência energética e sistema de gestão de energia.", category: "ambiental", normRef: "ISO 50001", duration: "12h", instructor: "Ana Costa", maxParticipants: 20, enrolledCount: 5, completedCount: 2, format: "online", mandatory: false },
];

const initialEnrollments: Enrollment[] = [
  { id: "e1", trainingId: "t1", participant: "João Pereira", company: "Metalúrgica AçoForte", status: "concluido", enrollDate: "2025-12-01", completionDate: "2026-01-15", score: 92, certificate: true },
  { id: "e2", trainingId: "t1", participant: "Maria Santos", company: "Grupo Energis", status: "em-andamento", enrollDate: "2026-02-01" },
  { id: "e3", trainingId: "t2", participant: "Pedro Almeida", company: "Plastiform Industrial", status: "concluido", enrollDate: "2025-11-10", completionDate: "2026-01-20", score: 88, certificate: true },
  { id: "e4", trainingId: "t4", participant: "Ana Souza", company: "Metalúrgica AçoForte", status: "em-andamento", enrollDate: "2026-01-15" },
  { id: "e5", trainingId: "t3", participant: "Carlos Mendes", company: "EcoVerde Sustentável", status: "disponivel", enrollDate: "2026-02-10" },
  { id: "e6", trainingId: "t7", participant: "Roberto Costa", company: "Grupo Energis", status: "concluido", enrollDate: "2025-10-01", completionDate: "2025-10-20", score: 95, certificate: true },
  { id: "e7", trainingId: "t5", participant: "Fernanda Lima", company: "TechSoft Sistemas", status: "em-andamento", enrollDate: "2026-01-20" },
];

const companies = ["Metalúrgica AçoForte", "Grupo Energis", "Plastiform Industrial", "TechSoft Sistemas", "EcoVerde Sustentável", "BioFarma Ltda"];

export default function TreinamentosPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<TrainingCategory | "todas">("todas");
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ participant: "", company: "", trainingId: "" });

  const filtered = useMemo(() => {
    return trainings.filter((t) => {
      if (catFilter !== "todas" && t.category !== catFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.normRef ?? "").toLowerCase().includes(q);
    });
  }, [search, catFilter]);

  const trainingEnrollments = useMemo(() => {
    if (!selectedTraining) return [];
    return enrollments.filter((e) => e.trainingId === selectedTraining.id);
  }, [selectedTraining, enrollments]);

  const stats = useMemo(() => {
    const totalEnrolled = enrollments.length;
    const completed = enrollments.filter((e) => e.status === "concluido").length;
    const certs = enrollments.filter((e) => e.certificate).length;
    const avgScore = enrollments.filter((e) => e.score).reduce((a, e) => a + (e.score ?? 0), 0) / (enrollments.filter((e) => e.score).length || 1);
    return { totalEnrolled, completed, certs, avgScore: Math.round(avgScore) };
  }, [enrollments]);

  const handleEnroll = () => {
    if (!enrollForm.participant || !enrollForm.company || !enrollForm.trainingId) return;
    setEnrollments((prev) => [...prev, {
      id: `e-${Date.now()}`, trainingId: enrollForm.trainingId, participant: enrollForm.participant,
      company: enrollForm.company, status: "disponivel", enrollDate: new Date().toISOString().slice(0, 10),
    }]);
    setEnrollForm({ participant: "", company: "", trainingId: "" });
    setShowEnrollModal(false);
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-certifica-900 text-lg" style={{ fontWeight: 700 }}>Treinamentos</h2>
          <p className="text-[11px] text-certifica-500">Catálogo de treinamentos, matrículas e certificados — vinculado às normas e projetos.</p>
        </div>
        <DSButton size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setShowEnrollModal(true); setEnrollForm({ participant: "", company: "", trainingId: selectedTraining?.id ?? "" }); }}>
          Matricular participante
        </DSButton>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Treinamentos", value: trainings.length, icon: <BookOpen className="w-4 h-4" />, color: "text-certifica-accent" },
          { label: "Matrículas ativas", value: stats.totalEnrolled, icon: <Users className="w-4 h-4" />, color: "text-observacao" },
          { label: "Concluídos", value: stats.completed, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-conformidade" },
          { label: "Nota média", value: `${stats.avgScore}%`, icon: <Award className="w-4 h-4" />, color: "text-oportunidade" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-certifica-200 rounded-[4px] p-3 flex items-center gap-3">
            <div className={`${k.color}`}>{k.icon}</div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-certifica-500" style={{ fontWeight: 600 }}>{k.label}</div>
              <div className={`text-xl ${k.color}`} style={{ fontWeight: 700 }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-certifica-500/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar treinamento..." className="w-full h-8 pl-8 pr-3 rounded-[4px] bg-white border border-certifica-200 text-[12px] focus:outline-none focus:ring-1 focus:ring-certifica-accent/40" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value as TrainingCategory | "todas")} className="h-8 px-2 rounded-[4px] border border-certifica-200 text-[11px] bg-white">
          <option value="todas">Todas categorias</option>
          {Object.entries(categoryMeta).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-4">
        <div className="space-y-2">
          {filtered.map((t) => {
            const cat = categoryMeta[t.category];
            const isActive = selectedTraining?.id === t.id;
            const occupancy = Math.round((t.enrolledCount / t.maxParticipants) * 100);
            return (
              <button key={t.id} onClick={() => setSelectedTraining(t)} className={`w-full text-left bg-white border rounded-[4px] p-3 transition-all ${isActive ? "border-certifica-accent shadow-sm" : "border-certifica-200 hover:border-certifica-accent/40"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12.5px] text-certifica-dark" style={{ fontWeight: 600 }}>{t.title}</span>
                      {t.mandatory && <DSBadge variant="nao-conformidade">Obrigatório</DSBadge>}
                    </div>
                    <p className="text-[10.5px] text-certifica-500 mb-1.5">{t.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-certifica-500">
                      <span className={cat.color} style={{ fontWeight: 500 }}>{cat.label}</span>
                      {t.normRef && <span>Ref: {t.normRef}</span>}
                      <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {t.duration}</span>
                      <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {t.enrolledCount}/{t.maxParticipants}</span>
                      <span className="capitalize">{t.format}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {t.nextDate && (
                      <span className="text-[9px] text-certifica-500 flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" /> {new Date(t.nextDate).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    <div className="w-16 bg-certifica-100 rounded-full h-1.5 mt-1">
                      <div className={`rounded-full h-1.5 ${occupancy > 90 ? "bg-nao-conformidade" : occupancy > 70 ? "bg-observacao" : "bg-conformidade"}`} style={{ width: `${occupancy}%` }} />
                    </div>
                    <span className="text-[9px] text-certifica-500">{occupancy}% ocupado</span>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && <div className="text-center py-10 text-certifica-500 text-[12px]">Nenhum treinamento encontrado.</div>}
        </div>

        <div className="bg-white border border-certifica-200 rounded-[4px] overflow-hidden">
          {!selectedTraining ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-certifica-500 text-center">
              <GraduationCap className="w-10 h-10 mb-3 text-certifica-200" />
              <p className="text-[13px]" style={{ fontWeight: 500 }}>Selecione um treinamento</p>
              <p className="text-[11px] mt-1">Clique em qualquer treinamento para ver detalhes e participantes.</p>
            </div>
          ) : (
            <div className="flex flex-col max-h-[calc(100vh-260px)]">
              <div className="px-4 py-3 border-b border-certifica-200 flex-shrink-0">
                <div className="text-[14px] text-certifica-dark" style={{ fontWeight: 700 }}>{selectedTraining.title}</div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-certifica-500">
                  <span>Instrutor: {selectedTraining.instructor}</span>
                  <span>·</span>
                  <span>{selectedTraining.duration}</span>
                  <span>·</span>
                  <span className="capitalize">{selectedTraining.format}</span>
                  {selectedTraining.normRef && <><span>·</span><span>Ref: {selectedTraining.normRef}</span></>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                <p className="text-[11.5px] text-certifica-dark">{selectedTraining.description}</p>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-certifica-500 mb-1.5" style={{ fontWeight: 600 }}>
                    Participantes ({trainingEnrollments.length})
                  </div>
                  {trainingEnrollments.length === 0 ? (
                    <p className="text-[11px] text-certifica-500 italic">Nenhum participante matriculado.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {trainingEnrollments.map((e) => {
                        const st = statusMeta[e.status];
                        return (
                          <div key={e.id} className="border border-certifica-200 rounded-[4px] p-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] text-certifica-dark" style={{ fontWeight: 600 }}>{e.participant}</span>
                              <DSBadge variant={st.variant}>{st.label}</DSBadge>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-certifica-500">
                              <span>{e.company}</span>
                              <span>Matrícula: {new Date(e.enrollDate).toLocaleDateString("pt-BR")}</span>
                              {e.score != null && <span>Nota: <strong>{e.score}%</strong></span>}
                              {e.certificate && <span className="text-conformidade flex items-center gap-0.5"><Award className="w-3 h-3" /> Certificado</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showEnrollModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" onClick={() => setShowEnrollModal(false)}>
          <div className="bg-white rounded-[6px] border border-certifica-200 w-[420px] shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-certifica-200 flex items-center justify-between">
              <span className="text-[13px] text-certifica-dark" style={{ fontWeight: 600 }}>Matricular participante</span>
              <button onClick={() => setShowEnrollModal(false)} className="text-certifica-500 hover:text-certifica-dark cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] text-certifica-500 mb-1" style={{ fontWeight: 600 }}>Nome do participante *</label>
                <input value={enrollForm.participant} onChange={(e) => setEnrollForm((p) => ({ ...p, participant: e.target.value }))} placeholder="Nome completo" className="w-full h-8 px-2 rounded-[4px] border border-certifica-200 text-[12px]" />
              </div>
              <div>
                <label className="block text-[10px] text-certifica-500 mb-1" style={{ fontWeight: 600 }}>Empresa *</label>
                <select value={enrollForm.company} onChange={(e) => setEnrollForm((p) => ({ ...p, company: e.target.value }))} className="w-full h-8 px-2 rounded-[4px] border border-certifica-200 text-[12px]">
                  <option value="">Selecione</option>
                  {companies.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-certifica-500 mb-1" style={{ fontWeight: 600 }}>Treinamento *</label>
                <select value={enrollForm.trainingId} onChange={(e) => setEnrollForm((p) => ({ ...p, trainingId: e.target.value }))} className="w-full h-8 px-2 rounded-[4px] border border-certifica-200 text-[12px]">
                  <option value="">Selecione</option>
                  {trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-certifica-200 flex justify-end gap-2">
              <DSButton variant="outline" size="sm" onClick={() => setShowEnrollModal(false)}>Cancelar</DSButton>
              <DSButton size="sm" onClick={handleEnroll}>Matricular</DSButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
