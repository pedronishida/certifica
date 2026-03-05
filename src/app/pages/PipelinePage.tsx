import React, { useState, useCallback, useRef, useMemo } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DSButton } from "../components/ds/DSButton";
import {
  Search,
  Filter,
  X,
  GripVertical,
  Building2,
  Users,
  Calendar,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Target,
  ClipboardCheck,
  Phone,
  Mail,
  MapPin,
  FileText,
  Plus,
  Paperclip,
  MoreVertical,
  Hash,
  MessageSquare,
  Tag,
  Trash2,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════ */

interface Entregavel {
  id: string;
  texto: string;
  concluido: boolean;
}

interface Contato {
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
}

interface PipelineCard {
  id: string;
  codigo: string;
  titulo: string;
  clienteNome: string;
  clienteCnpj: string;
  clienteSegmento: string;
  clienteEndereco: string;
  contato: Contato;
  norma: string;
  fase: number;
  prioridade: "alta" | "media" | "baixa";
  consultor: string;
  equipe: string[];
  inicio: string;
  previsao: string;
  valor: string;
  condicoesPagamento: string;
  escopo: string;
  entregaveis: Entregavel[];
  totalDocumentos: number;
  totalAuditorias: number;
  observacoes: string;
  diasRestantes: number;
  criadoEm: string;
}

interface ColumnConfig {
  id: number;
  label: string;
  sublabel: string;
  color: string;
  wipLimit: number;
  slaDays: number;
  probability: number;
  collapsed: boolean;
}

interface AttachmentItem {
  id: string;
  name: string;
  type: string;
  url?: string;
}

interface ActivityItem {
  id: string;
  at: string;
  text: string;
}

interface CardMeta {
  comments: string[];
  attachments: AttachmentItem[];
  tags: string[];
  activities: ActivityItem[];
}

const DND_TYPE = "KANBAN_CARD";

/* ══════════════════════════════════════════════════════════
   Column definitions
   ══════════════════════════════════════════════════════════ */

const FASE_LABELS: Record<number, string> = {
  0: "Proposta",
  1: "Planejamento",
  2: "Solucao",
  3: "Verificacao",
  4: "Acompanhamento",
};

const FASE_COLORS: Record<number, string> = {
  0: "#6B7280",
  1: "#274C77",
  2: "#2B8EAD",
  3: "#1F5E3B",
  4: "#0E2A47",
};

/* ══════════════════════════════════════════════════════════
   Mock data
   ══════════════════════════════════════════════════════════ */

const initialCards: PipelineCard[] = [
  {
    id: "PRJ-009", codigo: "PRJ-009", titulo: "Proposta — ISO 9001 + 14001 Integrado",
    clienteNome: "Construtora Horizonte", clienteCnpj: "89.012.345/0001-67",
    clienteSegmento: "Construcao Civil", clienteEndereco: "Rua das Palmeiras, 450 — Curitiba/PR",
    contato: { nome: "Ricardo Mendes", cargo: "Diretor de Operacoes", email: "ricardo@horizonte.com.br", telefone: "(41) 99876-5432" },
    norma: "ISO 9001 + 14001", fase: 0, prioridade: "media",
    consultor: "Carlos Silva", equipe: ["Carlos Silva", "Roberto Lima"],
    inicio: "—", previsao: "—", valor: "R$ 72.000,00", condicoesPagamento: "A definir",
    escopo: "Sistema integrado de Qualidade e Meio Ambiente para construtora — foco em obras civis e gestao de residuos de construcao.",
    entregaveis: [
      { id: "e41", texto: "Diagnostico integrado Q+MA", concluido: false },
      { id: "e42", texto: "Mapeamento de processos construtivos", concluido: false },
      { id: "e43", texto: "Manual integrado (SGI)", concluido: false },
      { id: "e44", texto: "PGRS para obras", concluido: false },
      { id: "e45", texto: "Treinamentos Q+MA (24h)", concluido: false },
      { id: "e46", texto: "Auditoria interna integrada", concluido: false },
      { id: "e47", texto: "Acompanhamento na certificacao", concluido: false },
    ],
    totalDocumentos: 0, totalAuditorias: 0,
    observacoes: "Proposta enviada em 14/02/2026. Aguardando retorno da diretoria.",
    diasRestantes: -1, criadoEm: "10/02/2026",
  },
  {
    id: "PRJ-002", codigo: "PRJ-002", titulo: "Implementacao ISO 14001:2015",
    clienteNome: "Metalurgica Acoforte", clienteCnpj: "12.345.678/0001-90",
    clienteSegmento: "Metalurgia", clienteEndereco: "Av. Industrial, 1200 — Pinhais/PR",
    contato: { nome: "Fernando Alves", cargo: "Gerente Industrial", email: "fernando@acoforte.com.br", telefone: "(41) 3344-5566" },
    norma: "ISO 14001:2015", fase: 1, prioridade: "media",
    consultor: "Roberto Lima", equipe: ["Roberto Lima"],
    inicio: "15/01/2026", previsao: "30/09/2026", valor: "R$ 38.000,00", condicoesPagamento: "4x de R$ 9.500,00",
    escopo: "Sistema de Gestao Ambiental — levantamento de aspectos e impactos, definicao de programas ambientais.",
    entregaveis: [
      { id: "e8", texto: "Levantamento de aspectos e impactos ambientais", concluido: false },
      { id: "e9", texto: "Matriz de requisitos legais", concluido: false },
      { id: "e10", texto: "Programas de gestao ambiental", concluido: false },
      { id: "e11", texto: "Manual do SGA", concluido: false },
      { id: "e12", texto: "Auditoria interna", concluido: false },
    ],
    totalDocumentos: 8, totalAuditorias: 0,
    observacoes: "Projeto complementar ao SGQ ja implementado.",
    diasRestantes: 223, criadoEm: "10/01/2026",
  },
  {
    id: "PRJ-004", codigo: "PRJ-004", titulo: "Seguranca Alimentar ISO 22000",
    clienteNome: "AgroVale Alimentos", clienteCnpj: "34.567.890/0001-12",
    clienteSegmento: "Alimentos", clienteEndereco: "Rod. BR-376, Km 42 — Campo Largo/PR",
    contato: { nome: "Claudia Ribeiro", cargo: "Coord. de Qualidade", email: "claudia@agrovale.com.br", telefone: "(41) 3221-4455" },
    norma: "ISO 22000:2018", fase: 1, prioridade: "media",
    consultor: "Pedro Souza", equipe: ["Pedro Souza"],
    inicio: "01/12/2025", previsao: "31/07/2026", valor: "R$ 45.000,00", condicoesPagamento: "5x de R$ 9.000,00",
    escopo: "SGSA completo — APPCC, pre-requisitos, rastreabilidade e preparacao para certificacao.",
    entregaveis: [
      { id: "e18", texto: "Analise de perigos e pontos criticos (APPCC)", concluido: false },
      { id: "e19", texto: "Programas de pre-requisitos (PPR)", concluido: false },
      { id: "e20", texto: "Sistema de rastreabilidade", concluido: false },
      { id: "e21", texto: "Manual SGSA", concluido: false },
    ],
    totalDocumentos: 22, totalAuditorias: 4, observacoes: "",
    diasRestantes: 162, criadoEm: "20/11/2025",
  },
  {
    id: "PRJ-003", codigo: "PRJ-003", titulo: "Gestao Energetica ISO 50001",
    clienteNome: "Grupo Energis", clienteCnpj: "23.456.789/0001-01",
    clienteSegmento: "Energia", clienteEndereco: "Rua Engenheiro Ostoja Roguski, 700 — Curitiba/PR",
    contato: { nome: "Marcos Oliveira", cargo: "Diretor de Sustentabilidade", email: "marcos@energis.com.br", telefone: "(41) 3030-7788" },
    norma: "ISO 50001:2018", fase: 2, prioridade: "alta",
    consultor: "Ana Costa", equipe: ["Ana Costa", "Pedro Souza"],
    inicio: "01/10/2025", previsao: "30/04/2026", valor: "R$ 62.000,00", condicoesPagamento: "Entrada 20% + 4x mensais",
    escopo: "Implementacao do SGEn para reducao de consumo energetico e atendimento a meta de carbono neutro ate 2030.",
    entregaveis: [
      { id: "e13", texto: "Revisao energetica — baseline e EnPIs", concluido: true },
      { id: "e14", texto: "Plano de acao energetico", concluido: true },
      { id: "e15", texto: "Procedimentos do SGEn", concluido: false },
      { id: "e16", texto: "Treinamento de equipe interna", concluido: false },
      { id: "e17", texto: "Auditoria interna pre-certificacao", concluido: false },
    ],
    totalDocumentos: 18, totalAuditorias: 2,
    observacoes: "Foco em reducao de 15% no consumo energetico em 12 meses.",
    diasRestantes: 70, criadoEm: "15/09/2025",
  },
  {
    id: "PRJ-007", codigo: "PRJ-007", titulo: "FSC Cadeia de Custodia",
    clienteNome: "Madeireira Floresta Viva", clienteCnpj: "67.890.123/0001-45",
    clienteSegmento: "Madeireiro", clienteEndereco: "Estrada Rural, Km 8 — Guarapuava/PR",
    contato: { nome: "Jorge Pereira", cargo: "Gerente Florestal", email: "jorge@florestaviva.com.br", telefone: "(42) 3622-1133" },
    norma: "FSC COC", fase: 2, prioridade: "baixa",
    consultor: "Carlos Silva", equipe: ["Carlos Silva"],
    inicio: "15/11/2025", previsao: "30/05/2026", valor: "R$ 22.000,00", condicoesPagamento: "2x de R$ 11.000,00",
    escopo: "Certificacao FSC Chain of Custody para rastreabilidade de produtos madeireiros.",
    entregaveis: [
      { id: "e32", texto: "Diagnostico FSC COC", concluido: true },
      { id: "e33", texto: "Procedimentos de cadeia de custodia", concluido: false },
      { id: "e34", texto: "Treinamento da equipe", concluido: false },
      { id: "e35", texto: "Auditoria pre-certificacao", concluido: false },
    ],
    totalDocumentos: 28, totalAuditorias: 5, observacoes: "",
    diasRestantes: 100, criadoEm: "01/11/2025",
  },
  {
    id: "PRJ-008", codigo: "PRJ-008", titulo: "Certificacao ISO 9001:2015",
    clienteNome: "Siderurgica Parana", clienteCnpj: "78.901.234/0001-56",
    clienteSegmento: "Siderurgia", clienteEndereco: "Rod. dos Minerios, 3200 — Araucaria/PR",
    contato: { nome: "Patricia Lopes", cargo: "Gerente da Qualidade", email: "patricia@sidpr.com.br", telefone: "(41) 3614-8899" },
    norma: "ISO 9001:2015", fase: 2, prioridade: "media",
    consultor: "Ana Costa", equipe: ["Ana Costa"],
    inicio: "01/09/2025", previsao: "30/04/2026", valor: "R$ 55.000,00", condicoesPagamento: "Entrada 30% + 5x mensais",
    escopo: "SGQ completo — processos siderurgicos, controle de qualidade de aco, rastreabilidade de corridas.",
    entregaveis: [
      { id: "e36", texto: "Diagnostico e gap analysis", concluido: true },
      { id: "e37", texto: "Mapeamento de processos", concluido: true },
      { id: "e38", texto: "Documentacao do SGQ", concluido: false },
      { id: "e39", texto: "Treinamentos", concluido: false },
      { id: "e40", texto: "Auditoria interna", concluido: false },
    ],
    totalDocumentos: 8, totalAuditorias: 1,
    observacoes: "Kick-off realizado em 20/02/2026.",
    diasRestantes: 70, criadoEm: "20/08/2025",
  },
  {
    id: "PRJ-001", codigo: "PRJ-001", titulo: "Certificacao ISO 9001:2015",
    clienteNome: "Metalurgica Acoforte", clienteCnpj: "12.345.678/0001-90",
    clienteSegmento: "Metalurgia", clienteEndereco: "Av. Industrial, 1200 — Pinhais/PR",
    contato: { nome: "Fernando Alves", cargo: "Gerente Industrial", email: "fernando@acoforte.com.br", telefone: "(41) 3344-5566" },
    norma: "ISO 9001:2015", fase: 3, prioridade: "alta",
    consultor: "Carlos Silva", equipe: ["Carlos Silva", "Ana Costa"],
    inicio: "01/06/2025", previsao: "15/03/2026", valor: "R$ 48.000,00", condicoesPagamento: "6x de R$ 8.000,00",
    escopo: "Implementacao completa do SGQ conforme ISO 9001:2015, incluindo mapeamento de processos, documentacao do sistema, treinamentos e preparacao para auditoria de certificacao.",
    entregaveis: [
      { id: "e1", texto: "Diagnostico inicial e gap analysis", concluido: true },
      { id: "e2", texto: "Mapeamento de processos (SIPOC + Fluxogramas)", concluido: true },
      { id: "e3", texto: "Manual da Qualidade — MQ-001", concluido: true },
      { id: "e4", texto: "Procedimentos operacionais (15 POs)", concluido: true },
      { id: "e5", texto: "Treinamento de auditores internos (16h)", concluido: false },
      { id: "e6", texto: "Auditoria interna pre-certificacao", concluido: false },
      { id: "e7", texto: "Acompanhamento na auditoria certificadora", concluido: false },
    ],
    totalDocumentos: 34, totalAuditorias: 6,
    observacoes: "Cliente altamente engajado. Previsao de auditoria certificadora com a BVQI em marco/2026.",
    diasRestantes: 24, criadoEm: "15/05/2025",
  },
  {
    id: "PRJ-006", codigo: "PRJ-006", titulo: "SGA — ISO 14001:2015",
    clienteNome: "Plastiform Industrial", clienteCnpj: "56.789.012/0001-34",
    clienteSegmento: "Plasticos", clienteEndereco: "Rua dos Polimeros, 88 — Sao Jose dos Pinhais/PR",
    contato: { nome: "Luciana Barros", cargo: "Coord. Ambiental", email: "luciana@plastiform.com.br", telefone: "(41) 3283-4400" },
    norma: "ISO 14001:2015", fase: 3, prioridade: "media",
    consultor: "Roberto Lima", equipe: ["Roberto Lima", "Carlos Silva"],
    inicio: "01/08/2025", previsao: "15/03/2026", valor: "R$ 32.000,00", condicoesPagamento: "3x de R$ 10.666,67",
    escopo: "Implementacao completa do SGA para industria de transformacao plastica — gestao de residuos, efluentes e emissoes.",
    entregaveis: [
      { id: "e27", texto: "Levantamento ambiental", concluido: true },
      { id: "e28", texto: "PGRS — Plano de Gestao de Residuos", concluido: true },
      { id: "e29", texto: "Procedimentos do SGA", concluido: true },
      { id: "e30", texto: "Auditoria interna", concluido: false },
      { id: "e31", texto: "Acompanhamento na certificacao", concluido: false },
    ],
    totalDocumentos: 11, totalAuditorias: 2, observacoes: "",
    diasRestantes: 24, criadoEm: "20/07/2025",
  },
  {
    id: "PRJ-005", codigo: "PRJ-005", titulo: "SSO — ISO 45001:2018",
    clienteNome: "TransLog Operacoes", clienteCnpj: "45.678.901/0001-23",
    clienteSegmento: "Logistica", clienteEndereco: "Rod. Contorno Leste, Km 12 — Colombo/PR",
    contato: { nome: "Anderson Moura", cargo: "Coord. de SSO", email: "anderson@translog.com.br", telefone: "(41) 3666-7788" },
    norma: "ISO 45001:2018", fase: 4, prioridade: "alta",
    consultor: "Maria Santos", equipe: ["Maria Santos"],
    inicio: "01/05/2025", previsao: "28/02/2026", valor: "R$ 35.000,00", condicoesPagamento: "Quitado",
    escopo: "Sistema de gestao de SSO com foco em operacoes logisticas — motoristas, armazenagem e operacao de empilhadeiras.",
    entregaveis: [
      { id: "e22", texto: "Identificacao de perigos e riscos", concluido: true },
      { id: "e23", texto: "Procedimentos de SSO", concluido: true },
      { id: "e24", texto: "Treinamentos obrigatorios", concluido: true },
      { id: "e25", texto: "Auditoria interna", concluido: true },
      { id: "e26", texto: "Acompanhamento pos-certificacao", concluido: false },
    ],
    totalDocumentos: 15, totalAuditorias: 3,
    observacoes: "Prazo apertado — auditoria certificadora agendada para 28/02. NC menor identificada em EPIs.",
    diasRestantes: 9, criadoEm: "15/04/2025",
  },
];

const consultores = ["Carlos Silva", "Ana Costa", "Pedro Souza", "Maria Santos", "Roberto Lima"];

/* ══════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════ */

const prioridadeConfig: Record<string, { label: string; color: string; dot: string }> = {
  alta: { label: "Alta", color: "#7A1E1E", dot: "bg-nao-conformidade" },
  media: { label: "Media", color: "#8C6A1F", dot: "bg-observacao" },
  baixa: { label: "Baixa", color: "#6B7280", dot: "bg-certifica-500" },
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function parseCurrency(v: string): number {
  return parseFloat(v.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
}

function formatCurrency(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseBrDate(value: string): Date | null {
  if (!value || value === "—") return null;
  const [dd, mm, yyyy] = value.split("/");
  if (!dd || !mm || !yyyy) return null;
  const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDefaultCardMeta(card: PipelineCard): CardMeta {
  return {
    comments: [
      `Registro inicial da oportunidade ${card.codigo}.`,
    ],
    attachments: [],
    tags: [],
    activities: [
      { id: `${card.id}-a1`, at: "agora", text: "Card criado no pipeline" },
    ],
  };
}

/* ══════════════════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════════════════ */

export default function PipelinePage() {
  const [cards, setCards] = useState<PipelineCard[]>(initialCards);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterConsultor, setFilterConsultor] = useState("todos");
  const [filterPrioridade, setFilterPrioridade] = useState("todos");
  const [selectedCard, setSelectedCard] = useState<PipelineCard | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "gantt">("kanban");
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
  const [isCreateOpportunityOpen, setIsCreateOpportunityOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<number | null>(null);
  const boardScrollRef = useRef<HTMLDivElement>(null);
  const isBoardDraggingRef = useRef(false);
  const boardDragStartXRef = useRef(0);
  const boardDragStartScrollRef = useRef(0);

  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 0, label: "Prospeccao", sublabel: "Leads iniciais", color: "#6B7280", wipLimit: 5, slaDays: 14, probability: 20, collapsed: false },
    { id: 1, label: "Apresentacao", sublabel: "Diagnostico comercial", color: "#274C77", wipLimit: 4, slaDays: 10, probability: 35, collapsed: false },
    { id: 2, label: "Proposta", sublabel: "Escopo e investimento", color: "#2B8EAD", wipLimit: 5, slaDays: 7, probability: 55, collapsed: false },
    { id: 3, label: "Negociacao", sublabel: "Ajustes finais", color: "#1F5E3B", wipLimit: 3, slaDays: 5, probability: 75, collapsed: false },
    { id: 4, label: "Follow up", sublabel: "Acompanhamento", color: "#0E2A47", wipLimit: 3, slaDays: 7, probability: 90, collapsed: false },
  ]);
  const columnPalette = ["#6B7280", "#274C77", "#2B8EAD", "#1F5E3B", "#0E2A47", "#7A1E1E", "#8C6A1F"];
  const probabilityPalette = [20, 35, 55, 75, 90, 95, 100];
  const slaPalette = [14, 10, 7, 5, 7, 7, 7];
  const [newColumnForm, setNewColumnForm] = useState({
    label: "",
    sublabel: "",
    color: columnPalette[0],
    wipLimit: "5",
    slaDays: "7",
    probability: "50",
  });
  const [newOpportunityForm, setNewOpportunityForm] = useState({
    clienteNome: "",
    titulo: "",
    norma: "ISO 9001:2015",
    consultor: consultores[0],
    prioridade: "media" as PipelineCard["prioridade"],
    valor: "R$ 0,00",
    contatoNome: "",
    contatoEmail: "",
    contatoTelefone: "",
    previsao: "",
  });
  const [cardMetaMap, setCardMetaMap] = useState<Record<string, CardMeta>>(() => {
    const entries = initialCards.map((card) => [card.id, getDefaultCardMeta(card)] as const);
    return Object.fromEntries(entries);
  });

  const moveCard = useCallback((cardId: string, toFase: number, targetIndex?: number) => {
    setCards((prev) => {
      const current = prev.find((c) => c.id === cardId);
      if (!current) return prev;
      if (current.fase === toFase && targetIndex === undefined) return prev;

      const fromLabel = columns.find((c) => c.id === current.fase)?.label ?? `Fase ${current.fase}`;
      const toLabel = columns.find((c) => c.id === toFase)?.label ?? `Fase ${toFase}`;

      if (current.fase !== toFase) {
        const at = new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
        setCardMetaMap((metaPrev) => {
          const base = metaPrev[cardId] ?? getDefaultCardMeta(current);
          return {
            ...metaPrev,
            [cardId]: {
              ...base,
              activities: [
                { id: `mv-${Date.now()}`, at, text: `Card movido de ${fromLabel} para ${toLabel}` },
                ...base.activities,
              ],
            },
          };
        });
      }

      const without = prev.filter((c) => c.id !== cardId);
      const updated = { ...current, fase: toFase };

      if (targetIndex !== undefined) {
        const colCards = without.filter((c) => c.fase === toFase);
        const otherCards = without.filter((c) => c.fase !== toFase);
        const idx = Math.min(targetIndex, colCards.length);
        colCards.splice(idx, 0, updated);
        return [...otherCards, ...colCards];
      }

      return [...without, updated];
    });
    setSelectedCard((prev) => (prev?.id === cardId ? { ...prev, fase: toFase } : prev));
  }, [columns]);

  const updateCard = useCallback((cardId: string, patch: Partial<PipelineCard>) => {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...patch } : c)));
    setSelectedCard((prev) => (prev?.id === cardId ? { ...prev, ...patch } : prev));
  }, []);

  const updateCardMeta = useCallback((cardId: string, updater: (meta: CardMeta) => CardMeta) => {
    setCardMetaMap((prev) => {
      const current = prev[cardId] ?? getDefaultCardMeta(cards.find((c) => c.id === cardId) ?? initialCards[0]);
      return {
        ...prev,
        [cardId]: updater(current),
      };
    });
  }, [cards]);

  const toggleCollapse = (colId: number) => {
    setColumns((prev) => prev.map((c) => (c.id === colId ? { ...c, collapsed: !c.collapsed } : c)));
  };

  const moveColumnOrder = (colId: number, direction: "left" | "right") => {
    setColumns((prev) => {
      const idx = prev.findIndex((c) => c.id === colId);
      if (idx < 0) return prev;
      const target = direction === "left" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const createColumn = () => {
    const defaultColor = columnPalette[columns.length % columnPalette.length];
    const defaultProbability = probabilityPalette[columns.length % probabilityPalette.length];
    const defaultSla = slaPalette[columns.length % slaPalette.length];
    setEditingColumnId(null);
    setNewColumnForm({
      label: "",
      sublabel: "",
      color: defaultColor,
      wipLimit: "5",
      slaDays: String(defaultSla),
      probability: String(defaultProbability),
    });
    setIsCreateColumnOpen(true);
  };

  const editColumn = (column: ColumnConfig) => {
    setEditingColumnId(column.id);
    setNewColumnForm({
      label: column.label,
      sublabel: column.sublabel,
      color: column.color,
      wipLimit: String(column.wipLimit),
      slaDays: String(column.slaDays),
      probability: String(column.probability),
    });
    setIsCreateColumnOpen(true);
  };

  const openCreateOpportunity = (columnId: number) => {
    setTargetColumnId(columnId);
    setNewOpportunityForm({
      clienteNome: "",
      titulo: "",
      norma: "ISO 9001:2015",
      consultor: consultores[0],
      prioridade: "media",
      valor: "R$ 0,00",
      contatoNome: "",
      contatoEmail: "",
      contatoTelefone: "",
      previsao: "",
    });
    setIsCreateOpportunityOpen(true);
  };

  const submitCreateColumn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const label = newColumnForm.label.trim();
    if (!label) return;
    const wip = Number.parseInt(newColumnForm.wipLimit, 10);
    const wipLimit = Number.isFinite(wip) ? Math.max(0, Math.min(99, wip)) : 5;
    const slaRaw = Number.parseInt(newColumnForm.slaDays, 10);
    const slaDays = Number.isFinite(slaRaw) ? Math.max(1, Math.min(180, slaRaw)) : 7;
    const probRaw = Number.parseInt(newColumnForm.probability, 10);
    const probability = Number.isFinite(probRaw) ? Math.max(0, Math.min(100, probRaw)) : 50;

    setColumns((prev) => {
      if (editingColumnId !== null) {
        return prev.map((col) =>
          col.id === editingColumnId
            ? {
                ...col,
                label,
                sublabel: newColumnForm.sublabel.trim() || "Nova etapa",
                color: newColumnForm.color,
                wipLimit,
                slaDays,
                probability,
              }
            : col,
        );
      }
      const nextId = prev.reduce((max, c) => Math.max(max, c.id), 0) + 1;
      return [
        ...prev,
        {
          id: nextId,
          label,
          sublabel: newColumnForm.sublabel.trim() || "Nova etapa",
          color: newColumnForm.color,
          wipLimit,
          slaDays,
          probability,
          collapsed: false,
        },
      ];
    });
    setEditingColumnId(null);
    setIsCreateColumnOpen(false);
  };

  const submitCreateOpportunity = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (targetColumnId === null) return;

    const clienteNome = newOpportunityForm.clienteNome.trim();
    const titulo = newOpportunityForm.titulo.trim();
    if (!clienteNome || !titulo) return;

    const createdAt = new Date();
    const createdAtText = createdAt.toLocaleDateString("pt-BR");

    let previsao = "—";
    let diasRestantes = -1;
    if (newOpportunityForm.previsao) {
      const dueDate = new Date(`${newOpportunityForm.previsao}T00:00:00`);
      previsao = dueDate.toLocaleDateString("pt-BR");
      diasRestantes = Math.ceil((dueDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    }

    const rawValor = parseCurrency(newOpportunityForm.valor);
    const valor = formatCurrency(rawValor);

    const nextCodeNumber = cards.reduce((max, card) => {
      const match = card.codigo.match(/^PRJ-(\d+)$/);
      if (!match) return max;
      return Math.max(max, Number.parseInt(match[1], 10));
    }, 0) + 1;

    const codigo = `PRJ-${String(nextCodeNumber).padStart(3, "0")}`;
    const newCard: PipelineCard = {
      id: codigo,
      codigo,
      titulo,
      clienteNome,
      clienteCnpj: "—",
      clienteSegmento: "A definir",
      clienteEndereco: "A definir",
      contato: {
        nome: newOpportunityForm.contatoNome.trim() || "Contato principal",
        cargo: "A definir",
        email: newOpportunityForm.contatoEmail.trim() || "contato@empresa.com",
        telefone: newOpportunityForm.contatoTelefone.trim() || "(00) 00000-0000",
      },
      norma: newOpportunityForm.norma.trim() || "ISO 9001:2015",
      fase: targetColumnId,
      prioridade: newOpportunityForm.prioridade,
      consultor: newOpportunityForm.consultor,
      equipe: [newOpportunityForm.consultor],
      inicio: createdAtText,
      previsao,
      valor,
      condicoesPagamento: "A definir",
      escopo: titulo,
      entregaveis: [],
      totalDocumentos: 0,
      totalAuditorias: 0,
      observacoes: "",
      diasRestantes,
      criadoEm: createdAtText,
    };
    setCards((prev) => [...prev, newCard]);
    setCardMetaMap((prev) => ({ ...prev, [newCard.id]: getDefaultCardMeta(newCard) }));

    setIsCreateOpportunityOpen(false);
    setTargetColumnId(null);
  };

  const deleteColumn = (colId: number) => {
    setColumns((prev) => {
      if (prev.length <= 1) return prev;
      const idx = prev.findIndex((c) => c.id === colId);
      if (idx < 0) return prev;
      const targetCol = prev[idx + 1] ?? prev[idx - 1];
      if (!targetCol) return prev;

      setCards((cardsPrev) => {
        const movedCards = cardsPrev.filter((card) => card.fase === colId);
        if (movedCards.length > 0) {
          const fromLabel = prev[idx].label;
          const toLabel = targetCol.label;
          const at = new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
          setCardMetaMap((metaPrev) => {
            const nextMeta = { ...metaPrev };
            movedCards.forEach((card) => {
              const base = nextMeta[card.id] ?? getDefaultCardMeta(card);
              nextMeta[card.id] = {
                ...base,
                activities: [
                  { id: `mv-del-${Date.now()}-${card.id}`, at, text: `Card realocado automaticamente de ${fromLabel} para ${toLabel}` },
                  ...base.activities,
                ],
              };
            });
            return nextMeta;
          });
        }
        return cardsPrev.map((card) => (card.fase === colId ? { ...card, fase: targetCol.id } : card));
      });
      setSelectedCard((cardPrev) => (cardPrev?.fase === colId ? { ...cardPrev, fase: targetCol.id } : cardPrev));
      return prev.filter((c) => c.id !== colId);
    });
  };

  const filtered = cards.filter((c) => {
    if (filterConsultor !== "todos" && c.consultor !== filterConsultor) return false;
    if (filterPrioridade !== "todos" && c.prioridade !== filterPrioridade) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.titulo.toLowerCase().includes(q) || c.clienteNome.toLowerCase().includes(q) || c.norma.toLowerCase().includes(q) || c.codigo.toLowerCase().includes(q);
    }
    return true;
  });

  const totalValor = filtered.reduce((s, c) => s + parseCurrency(c.valor), 0);
  const urgentes = filtered.filter((c) => c.diasRestantes > 0 && c.diasRestantes <= 30).length;
  const phaseForecast = useMemo(() => {
    const now = new Date();
    return columns.map((col) => {
      const colCards = filtered.filter((c) => c.fase === col.id);
      const prob = col.probability / 100;
      const sla = col.slaDays;
      const expectedRevenue = colCards.reduce((sum, c) => sum + parseCurrency(c.valor) * prob, 0);
      const slaBreaches = colCards.filter((c) => {
        const created = parseBrDate(c.criadoEm);
        if (!created) return false;
        const elapsed = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return elapsed > sla;
      }).length;
      return { colId: col.id, label: col.label, probability: prob, expectedRevenue, slaDays: sla, slaBreaches };
    });
  }, [columns, filtered]);
  const totalExpectedRevenue = phaseForecast.reduce((sum, item) => sum + item.expectedRevenue, 0);
  const totalSlaBreaches = phaseForecast.reduce((sum, item) => sum + item.slaBreaches, 0);

  const handleBoardMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [data-kanban-card], [data-dnd-handle]")) return;

    const scroller = boardScrollRef.current;
    if (!scroller) return;

    e.preventDefault();
    isBoardDraggingRef.current = true;
    boardDragStartXRef.current = e.clientX;
    boardDragStartScrollRef.current = scroller.scrollLeft;
  };

  const handleBoardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isBoardDraggingRef.current) return;
    const scroller = boardScrollRef.current;
    if (!scroller) return;

    e.preventDefault();
    const deltaX = e.clientX - boardDragStartXRef.current;
    scroller.scrollLeft = boardDragStartScrollRef.current - deltaX;
  };

  const handleBoardMouseUp = () => {
    isBoardDraggingRef.current = false;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full overflow-hidden bg-certifica-50/40">
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-certifica-900">Kanban</h2>
              <p className="text-[12px] text-certifica-500 mt-0.5" style={{ fontWeight: 400 }}>
                Gerencie seus projetos no processo "Pipeline de Consultoria" &middot; {filtered.length} cards
                {urgentes > 0 && (
                  <span className="text-nao-conformidade ml-1" style={{ fontWeight: 500 }}>
                    &middot; {urgentes} urgente{urgentes > 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DSButton
                variant={showFilters ? "secondary" : "ghost"}
                size="sm"
                icon={<Filter className="w-3.5 h-3.5" strokeWidth={1.5} />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtros
              </DSButton>
            </div>
          </div>

          {/* ── View tabs + summary ── */}
          <div className="flex items-center gap-5 pb-3 border-b border-certifica-200">
            {/* View tabs */}
            <div className="flex items-center bg-certifica-100 rounded-[3px] p-0.5">
              {(["kanban", "gantt"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`px-3 py-1 rounded-[2px] text-[11px] transition-all cursor-pointer ${
                    viewMode === v ? "bg-white text-certifica-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "text-certifica-500 hover:text-certifica-dark"
                  }`}
                  style={{ fontWeight: viewMode === v ? 600 : 400 }}
                >
                  {v === "kanban" ? "Kanban" : "Gantt"}
                </button>
              ))}
            </div>

            <div className="w-px h-3 bg-certifica-200" />

            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-certifica-500/40" strokeWidth={1.5} />
              <span className="text-[11px] text-certifica-500" style={{ fontWeight: 400 }}>Total</span>
              <span className="text-[12px] text-certifica-900 font-mono" style={{ fontWeight: 600 }}>{formatCurrency(totalValor)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-certifica-500/40" strokeWidth={1.5} />
              <span className="text-[11px] text-certifica-500" style={{ fontWeight: 400 }}>Receita esperada</span>
              <span className="text-[12px] text-certifica-900 font-mono" style={{ fontWeight: 600 }}>{formatCurrency(totalExpectedRevenue)}</span>
            </div>

            {urgentes > 0 && (
              <div className="flex items-center gap-1 contents-none">
                <div className="w-px h-3 bg-certifica-200" />
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-nao-conformidade/60" strokeWidth={1.5} />
                  <span className="text-[11px] text-nao-conformidade" style={{ fontWeight: 500 }}>{urgentes} prazo &lt;30d</span>
                </div>
              </div>
            )}
            {totalSlaBreaches > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-px h-3 bg-certifica-200" />
                <Clock className="w-3.5 h-3.5 text-observacao/70" strokeWidth={1.5} />
                <span className="text-[11px] text-observacao" style={{ fontWeight: 500 }}>
                  {totalSlaBreaches} em SLA estourado
                </span>
              </div>
            )}

            <div className="ml-auto relative max-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-certifica-500/40" strokeWidth={1.5} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-7 pl-8 pr-3 bg-certifica-50 border border-certifica-200 rounded-[3px] text-[11.5px] placeholder:text-certifica-500/40 focus:outline-none focus:ring-1 focus:ring-certifica-700/30"
                placeholder="Buscar projeto..."
                style={{ fontWeight: 400 }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 py-2 border-b border-certifica-200">
            {phaseForecast.map((phase) => (
              <div key={phase.colId} className="px-2 py-1 rounded-[3px] bg-white border border-certifica-200">
                <div className="text-[10px] text-certifica-500" style={{ fontWeight: 500 }}>{phase.label}</div>
                <div className="text-[10px] text-certifica-700 font-mono" style={{ fontWeight: 600 }}>
                  {(phase.probability * 100).toFixed(0)}% · {formatCurrency(phase.expectedRevenue)}
                </div>
              </div>
            ))}
          </div>

          {/* ── Filter row ── */}
          {showFilters && (
            <div className="flex items-center gap-3 py-2.5 border-b border-certifica-200">
              <select value={filterConsultor} onChange={(e) => setFilterConsultor(e.target.value)}
                className="h-7 px-2 bg-white border border-certifica-200 rounded-[3px] text-[11.5px] text-certifica-dark appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-certifica-700/30 pr-6" style={{ fontWeight: 400 }}>
                <option value="todos">Todos consultores</option>
                {consultores.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterPrioridade} onChange={(e) => setFilterPrioridade(e.target.value)}
                className="h-7 px-2 bg-white border border-certifica-200 rounded-[3px] text-[11.5px] text-certifica-dark appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-certifica-700/30 pr-6" style={{ fontWeight: 400 }}>
                <option value="todos">Todas prioridades</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baixa">Baixa</option>
              </select>
              {(filterConsultor !== "todos" || filterPrioridade !== "todos") && (
                <button onClick={() => { setFilterConsultor("todos"); setFilterPrioridade("todos"); }}
                  className="text-[11px] text-certifica-accent cursor-pointer hover:underline" style={{ fontWeight: 500 }}>
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {viewMode === "kanban" ? (
          <div
            ref={boardScrollRef}
            className="flex-1 overflow-x-auto overflow-y-hidden px-5 py-4 cursor-grab active:cursor-grabbing"
            onMouseDown={handleBoardMouseDown}
            onMouseMove={handleBoardMouseMove}
            onMouseUp={handleBoardMouseUp}
            onMouseLeave={handleBoardMouseUp}
            style={{ userSelect: "none" }}
          >
            <div className="flex gap-3 h-full min-w-min">
              {columns.map((col, index) => {
                const colCards = filtered.filter((c) => c.fase === col.id);
                const colValor = colCards.reduce((s, c) => s + parseCurrency(c.valor), 0);
                const overWip = col.wipLimit > 0 && colCards.length > col.wipLimit;
                return (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    cards={colCards}
                    colValor={colValor}
                    overWip={overWip}
                    slaDays={col.slaDays}
                    slaBreaches={phaseForecast.find((p) => p.colId === col.id)?.slaBreaches ?? 0}
                    moveCard={moveCard}
                    onToggleCollapse={() => toggleCollapse(col.id)}
                    onSelectCard={setSelectedCard}
                    onMoveLeft={() => moveColumnOrder(col.id, "left")}
                    onMoveRight={() => moveColumnOrder(col.id, "right")}
                    onDelete={() => deleteColumn(col.id)}
                    onEdit={() => editColumn(col)}
                    onCreateOpportunity={() => openCreateOpportunity(col.id)}
                    isFirst={index === 0}
                    isLast={index === columns.length - 1}
                  />
                );
              })}
              <div className="w-[220px] flex-shrink-0">
                <button
                  onClick={createColumn}
                  className="w-full h-full min-h-[160px] border border-dashed border-certifica-300 rounded-[6px] bg-white/60 text-certifica-500 hover:text-certifica-dark hover:border-certifica-accent/40 transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  <span className="text-[12px]" style={{ fontWeight: 500 }}>Nova coluna</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <GanttView cards={filtered} onSelectCard={setSelectedCard} />
        )}

        {/* ── Detail overlay ── */}
        {selectedCard && (
          <CardDetailOverlay
            card={selectedCard}
            columns={columns}
            cardMeta={cardMetaMap[selectedCard.id] ?? getDefaultCardMeta(selectedCard)}
            onClose={() => setSelectedCard(null)}
            moveCard={moveCard}
            onUpdateCard={updateCard}
            onUpdateCardMeta={updateCardMeta}
          />
        )}

        {isCreateColumnOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-certifica-dark/45" onClick={() => { setEditingColumnId(null); setIsCreateColumnOpen(false); }} />
            <div className="relative w-full max-w-[520px] bg-white border border-certifica-200 rounded-[6px] shadow-[0_12px_40px_rgba(14,42,71,0.18)]">
              <div className="px-4 py-3 border-b border-certifica-200 flex items-center justify-between">
                <div>
                  <h3 className="text-certifica-900 text-[15px]" style={{ fontWeight: 600 }}>
                    {editingColumnId !== null ? "Editar coluna" : "Nova coluna"}
                  </h3>
                  <p className="text-[11px] text-certifica-500" style={{ fontWeight: 400 }}>
                    Defina título, subtítulo, cor, WIP, SLA e probabilidade comercial.
                  </p>
                </div>
                <button onClick={() => { setEditingColumnId(null); setIsCreateColumnOpen(false); }} className="p-1 text-certifica-500/40 hover:text-certifica-700 transition-colors cursor-pointer">
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <form onSubmit={submitCreateColumn} className="p-4 grid grid-cols-2 gap-3">
                <label className="col-span-2 text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Título
                  <input
                    required
                    value={newColumnForm.label}
                    onChange={(e) => setNewColumnForm((prev) => ({ ...prev, label: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                    placeholder="Ex.: Auditoria documental"
                  />
                </label>

                <label className="col-span-2 text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Subtítulo
                  <input
                    value={newColumnForm.sublabel}
                    onChange={(e) => setNewColumnForm((prev) => ({ ...prev, sublabel: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                    placeholder="Ex.: Revisão e validação"
                  />
                </label>

                <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Cor
                  <input
                    type="color"
                    value={newColumnForm.color}
                    onChange={(e) => setNewColumnForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="mt-1 w-full h-9 p-1 border border-certifica-200 rounded-[4px] bg-white cursor-pointer"
                  />
                </label>

                <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  WIP limit
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={newColumnForm.wipLimit}
                    onChange={(e) => setNewColumnForm((prev) => ({ ...prev, wipLimit: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                  />
                </label>
                <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  SLA (dias)
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={newColumnForm.slaDays}
                    onChange={(e) => setNewColumnForm((prev) => ({ ...prev, slaDays: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                  />
                </label>
                <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Probabilidade (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newColumnForm.probability}
                    onChange={(e) => setNewColumnForm((prev) => ({ ...prev, probability: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                  />
                </label>

                <div className="col-span-2">
                  <div className="text-[10px] text-certifica-500 mb-1">Sugestões de cor</div>
                  <div className="flex items-center gap-1.5">
                    {columnPalette.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColumnForm((prev) => ({ ...prev, color }))}
                        className={`w-6 h-6 rounded-full border-2 ${newColumnForm.color === color ? "border-certifica-dark" : "border-white"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2 pt-1">
                  <DSButton type="button" variant="outline" size="sm" onClick={() => { setEditingColumnId(null); setIsCreateColumnOpen(false); }}>
                    Cancelar
                  </DSButton>
                  <DSButton type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}>
                    {editingColumnId !== null ? "Salvar coluna" : "Criar coluna"}
                  </DSButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {isCreateOpportunityOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-certifica-dark/45" onClick={() => setIsCreateOpportunityOpen(false)} />
            <div className="relative w-full max-w-[620px] bg-white border border-certifica-200 rounded-[6px] shadow-[0_12px_40px_rgba(14,42,71,0.18)]">
              <div className="px-4 py-3 border-b border-certifica-200 flex items-center justify-between">
                <div>
                  <h3 className="text-certifica-900 text-[15px]" style={{ fontWeight: 600 }}>Nova oportunidade</h3>
                  <p className="text-[11px] text-certifica-500" style={{ fontWeight: 400 }}>Cadastre cliente, escopo comercial e prioridade inicial.</p>
                </div>
                <button onClick={() => setIsCreateOpportunityOpen(false)} className="p-1 text-certifica-500/40 hover:text-certifica-700 transition-colors cursor-pointer">
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <form onSubmit={submitCreateOpportunity} className="p-4 grid grid-cols-2 gap-3">
                <label className="col-span-2 text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Cliente
                  <input
                    required
                    value={newOpportunityForm.clienteNome}
                    onChange={(e) => setNewOpportunityForm((prev) => ({ ...prev, clienteNome: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                    placeholder="Ex.: Industria Aurora"
                  />
                </label>

                <label className="col-span-2 text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Título da oportunidade
                  <input
                    required
                    value={newOpportunityForm.titulo}
                    onChange={(e) => setNewOpportunityForm((prev) => ({ ...prev, titulo: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                    placeholder="Ex.: Implementação ISO 9001"
                  />
                </label>

                <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Norma
                  <input
                    value={newOpportunityForm.norma}
                    onChange={(e) => setNewOpportunityForm((prev) => ({ ...prev, norma: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                    placeholder="Ex.: ISO 14001:2015"
                  />
                </label>

                <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Consultor responsável
                  <select
                    value={newOpportunityForm.consultor}
                    onChange={(e) => setNewOpportunityForm((prev) => ({ ...prev, consultor: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                  >
                    {consultores.map((consultor) => (
                      <option key={consultor} value={consultor}>{consultor}</option>
                    ))}
                  </select>
                </label>

                <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Prioridade
                  <select
                    value={newOpportunityForm.prioridade}
                    onChange={(e) => setNewOpportunityForm((prev) => ({ ...prev, prioridade: e.target.value as PipelineCard["prioridade"] }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </label>

                <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Valor estimado
                  <input
                    value={newOpportunityForm.valor}
                    onChange={(e) => setNewOpportunityForm((prev) => ({ ...prev, valor: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                    placeholder="R$ 0,00"
                  />
                </label>

                <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Previsão
                  <input
                    type="date"
                    value={newOpportunityForm.previsao}
                    onChange={(e) => setNewOpportunityForm((prev) => ({ ...prev, previsao: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                  />
                </label>

                <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Contato
                  <input
                    value={newOpportunityForm.contatoNome}
                    onChange={(e) => setNewOpportunityForm((prev) => ({ ...prev, contatoNome: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                    placeholder="Nome do contato"
                  />
                </label>

                <label className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  E-mail do contato
                  <input
                    type="email"
                    value={newOpportunityForm.contatoEmail}
                    onChange={(e) => setNewOpportunityForm((prev) => ({ ...prev, contatoEmail: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                    placeholder="contato@empresa.com"
                  />
                </label>

                <label className="col-span-2 text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>
                  Telefone do contato
                  <input
                    value={newOpportunityForm.contatoTelefone}
                    onChange={(e) => setNewOpportunityForm((prev) => ({ ...prev, contatoTelefone: e.target.value }))}
                    className="mt-1 w-full h-9 px-3 border border-certifica-200 rounded-[4px] bg-white text-[12px] text-certifica-dark focus:outline-none focus:ring-1 focus:ring-certifica-accent/30"
                    placeholder="(00) 00000-0000"
                  />
                </label>

                <div className="col-span-2 flex items-center justify-end gap-2 pt-1">
                  <DSButton type="button" variant="outline" size="sm" onClick={() => setIsCreateOpportunityOpen(false)}>
                    Cancelar
                  </DSButton>
                  <DSButton type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}>
                    Criar oportunidade
                  </DSButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

/* ══════════════════════════════════════════════════════════
   Kanban Column
   ══════════════════════════════════════════════════════════ */

function DropIndicator() {
  return (
    <div className="relative h-1 -my-0.5 z-10 pointer-events-none">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-certifica-accent rounded-full" />
      <div className="absolute -left-1 -top-[3px] w-[9px] h-[9px] rounded-full bg-certifica-accent" />
      <div className="absolute -right-1 -top-[3px] w-[9px] h-[9px] rounded-full bg-certifica-accent" />
    </div>
  );
}

function EmptyDropZone() {
  return (
    <div className="py-6 text-center border-2 border-dashed border-certifica-accent/40 bg-certifica-accent/5 rounded-[4px]">
      <span className="text-[11px] text-certifica-accent/60" style={{ fontWeight: 500 }}>Soltar aqui</span>
    </div>
  );
}

function KanbanColumn({ column, cards, colValor, overWip, slaDays, slaBreaches, moveCard, onToggleCollapse, onSelectCard, onMoveLeft, onMoveRight, onDelete, onEdit, onCreateOpportunity, isFirst, isLast }: {
  column: ColumnConfig; cards: PipelineCard[]; colValor: number; overWip: boolean; slaDays: number; slaBreaches: number;
  moveCard: (id: string, fase: number, idx?: number) => void; onToggleCollapse: () => void; onSelectCard: (c: PipelineCard) => void;
  onMoveLeft: () => void; onMoveRight: () => void; onDelete: () => void; onEdit: () => void; onCreateOpportunity: () => void; isFirst: boolean; isLast: boolean;
}) {
  const ghostRef = useRef<number | null>(null);
  const [ghostIndex, setGhostIndex] = useState<number | null>(null);
  const updateGhost = useCallback((idx: number | null) => {
    if (ghostRef.current === idx) return;
    ghostRef.current = idx;
    setGhostIndex(idx);
  }, []);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: DND_TYPE,
    hover: (_item: { id: string }, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      updateGhost(cards.length);
    },
    drop: (item: { id: string }, monitor) => {
      if (monitor.didDrop()) return;
      moveCard(item.id, column.id, ghostRef.current ?? cards.length);
      updateGhost(null);
    },
    collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
  }), [column.id, moveCard, cards.length, updateGhost]);

  const handleCardHover = useCallback((index: number, position: "top" | "bottom") => {
    updateGhost(position === "top" ? index : index + 1);
  }, [updateGhost]);

  const handleCardDrop = useCallback((item: { id: string }) => {
    moveCard(item.id, column.id, ghostRef.current ?? cards.length);
    updateGhost(null);
  }, [moveCard, column.id, cards.length, updateGhost]);

  React.useEffect(() => {
    if (!isOver) updateGhost(null);
  }, [isOver, updateGhost]);

  const ref = useRef<HTMLDivElement>(null);
  drop(ref);

  if (column.collapsed) {
    return (
      <div ref={ref} onClick={onToggleCollapse}
        className={`w-10 flex-shrink-0 rounded-[4px] border cursor-pointer flex flex-col items-center py-3 gap-2 transition-colors hover:border-certifica-accent/40 ${
          isOver ? "border-certifica-accent bg-certifica-accent/5" : "border-certifica-200 bg-white"
        }`}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] text-certifica-500" style={{ fontWeight: 500, writingMode: "vertical-rl", textOrientation: "mixed" }}>
            {column.label} ({cards.length})
          </span>
        </div>
        <ChevronRight className="w-3 h-3 text-certifica-500/40" strokeWidth={1.5} />
      </div>
    );
  }

  const renderCards = () => {
    const elements: React.ReactNode[] = [];
    if (ghostIndex === 0 && isOver) elements.push(<DropIndicator key="drop-top" />);

    cards.forEach((card, i) => {
      elements.push(
        <DraggableDropCard
          key={card.id}
          card={card}
          index={i}
          onSelect={onSelectCard}
          onHover={handleCardHover}
          onDrop={handleCardDrop}
        />
      );
      if (ghostIndex === i + 1 && isOver) elements.push(<DropIndicator key={`drop-${i}`} />);
    });

    return elements;
  };

  return (
    <div ref={ref} className={`w-[292px] flex-shrink-0 rounded-[6px] border flex flex-col transition-colors ${
      isOver && canDrop ? "border-certifica-accent/50 bg-certifica-accent/5" : "border-certifica-200 bg-certifica-50/70"
    }`}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-certifica-200 flex-shrink-0 bg-white rounded-t-[6px]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
            <span className="text-[12px] text-certifica-900" style={{ fontWeight: 600 }}>{column.label}</span>
            <span className={`inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 rounded-full text-[9px] ${
              overWip ? "bg-nao-conformidade/10 text-nao-conformidade" : "bg-certifica-100 text-certifica-700"
            }`} style={{ fontWeight: 600 }}>{cards.length}</span>
            {column.wipLimit > 0 && (
              <span className={`text-[9px] ${overWip ? "text-nao-conformidade" : "text-certifica-500/40"}`} style={{ fontWeight: 400 }}>/{column.wipLimit}</span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={onMoveLeft}
              disabled={isFirst}
              className="p-0.5 text-certifica-500/40 enabled:hover:text-certifica-dark disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" strokeWidth={1.5} />
            </button>
            <button
              onClick={onMoveRight}
              disabled={isLast}
              className="p-0.5 text-certifica-500/40 enabled:hover:text-certifica-dark disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
            </button>
            <button onClick={onDelete} className="p-0.5 text-certifica-500/40 hover:text-nao-conformidade transition-colors cursor-pointer">
              <Trash2 className="w-3 h-3" strokeWidth={1.5} />
            </button>
            <button onClick={onEdit} className="p-0.5 text-certifica-500/40 hover:text-certifica-dark transition-colors cursor-pointer">
              <MoreVertical className="w-3 h-3" strokeWidth={1.5} />
            </button>
            <button onClick={onToggleCollapse} className="p-0.5 text-certifica-500/30 hover:text-certifica-dark transition-colors cursor-pointer">
              <ChevronDown className="w-3 h-3" strokeWidth={1.5} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-certifica-500" style={{ fontWeight: 400 }}>{column.sublabel}</span>
          <span className="text-[10px] text-certifica-500 font-mono" style={{ fontWeight: 500 }}>{formatCurrency(colValor)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[9px] text-certifica-500/60" style={{ fontWeight: 400 }}>SLA fase: {slaDays}d</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-certifica-500/60" style={{ fontWeight: 500 }}>Prob: {column.probability}%</span>
            {slaBreaches > 0 && (
              <span className="text-[9px] text-observacao" style={{ fontWeight: 500 }}>
                {slaBreaches} estourado{slaBreaches > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        {overWip && (
          <div className="mt-1.5 flex items-center gap-1 px-2 py-1 bg-nao-conformidade/5 border border-nao-conformidade/15 rounded-[2px]">
            <AlertTriangle className="w-3 h-3 text-nao-conformidade/60" strokeWidth={1.5} />
            <span className="text-[9px] text-nao-conformidade" style={{ fontWeight: 500 }}>WIP excedido ({cards.length}/{column.wipLimit})</span>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {cards.length === 0 && !isOver && (
          <div className="py-8 text-center border border-dashed rounded-[3px] border-certifica-200">
            <p className="text-[11px] text-certifica-500/50" style={{ fontWeight: 400 }}>Arraste um projeto aqui</p>
          </div>
        )}
        {cards.length === 0 && isOver && <EmptyDropZone />}
        {cards.length > 0 && renderCards()}
      </div>

      <div className="px-2.5 pb-2.5">
        <button
          onClick={onCreateOpportunity}
          className="w-full h-8 border border-dashed border-certifica-200 rounded-[4px] text-[11px] text-certifica-500 hover:text-certifica-dark hover:border-certifica-300 transition-colors cursor-pointer"
        >
          Nova oportunidade
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Kanban Card (with drag + drop target for positioning)
   ══════════════════════════════════════════════════════════ */

function DraggableDropCard({ card, index, onSelect, onHover, onDrop }: {
  card: PipelineCard; index: number;
  onSelect: (c: PipelineCard) => void;
  onHover: (index: number, position: "top" | "bottom") => void;
  onDrop: (item: { id: string }) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: DND_TYPE, item: { id: card.id },
    collect: (m) => ({ isDragging: m.isDragging() }),
  }), [card.id]);

  const lastPos = useRef<"top" | "bottom">("bottom");

  const [, dropRef] = useDrop(() => ({
    accept: DND_TYPE,
    hover: (item: { id: string }, monitor) => {
      if (item.id === card.id || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const y = monitor.getClientOffset()?.y ?? 0;
      const relY = (y - rect.top) / rect.height;
      if (relY < 0.35) {
        lastPos.current = "top";
      } else if (relY > 0.65) {
        lastPos.current = "bottom";
      }
      onHover(index, lastPos.current);
    },
    drop: (item: { id: string }, monitor) => {
      if (monitor.didDrop()) return;
      onDrop(item);
    },
  }), [card.id, index, onHover, onDrop]);

  drag(dropRef(cardRef));
  preview(cardRef);

  return <KanbanCardContent ref={cardRef} card={card} isDragging={isDragging} onSelect={onSelect} />;
}

const KanbanCardContent = React.forwardRef<HTMLDivElement, { card: PipelineCard; isDragging: boolean; onSelect: (c: PipelineCard) => void }>(
  ({ card, isDragging, onSelect }, ref) => {
  const temperatura: Record<PipelineCard["prioridade"], { label: string; className: string }> = {
    alta: { label: "Quente", className: "bg-nao-conformidade/10 text-nao-conformidade" },
    media: { label: "Morno", className: "bg-observacao/12 text-observacao" },
    baixa: { label: "Frio", className: "bg-certifica-100 text-certifica-500" },
  };
  const entC = card.entregaveis.filter((e) => e.concluido).length;
  const entT = card.entregaveis.length;
  const pct = entT > 0 ? Math.round((entC / entT) * 100) : 0;
  const isUrgent = card.diasRestantes > 0 && card.diasRestantes <= 30;
  const isCritical = card.diasRestantes > 0 && card.diasRestantes <= 14;

  return (
    <div ref={ref} data-kanban-card onClick={() => onSelect(card)}
      className={`bg-white border border-certifica-200 rounded-[6px] transition-all cursor-pointer hover:border-certifica-accent/30 hover:shadow-[0_2px_8px_rgba(14,42,71,0.08)] group ${isDragging ? "opacity-30 scale-[0.97] ring-2 ring-certifica-accent/30" : ""}`}>
      <div className="h-1 rounded-t-[6px]" style={{ backgroundColor: FASE_COLORS[card.fase] }} />

      <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-1">
        <div data-dnd-handle className="p-0.5 text-certifica-200 hover:text-certifica-500 cursor-grab active:cursor-grabbing flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3 h-3" strokeWidth={1.5} />
        </div>
        <span className="text-[10px] text-certifica-700 font-mono flex-1" style={{ fontWeight: 600 }}>{card.codigo}</span>
        <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${temperatura[card.prioridade].className}`} style={{ fontWeight: 600 }}>
          {temperatura[card.prioridade].label}
        </span>
      </div>
      <div className="px-2.5 pb-1.5">
        <span className="text-[12px] text-certifica-dark block" style={{ fontWeight: 600, lineHeight: "1.4" }}>{card.clienteNome}</span>
        <span className="text-[10.5px] text-certifica-500 block mt-0.5" style={{ fontWeight: 400 }}>{card.titulo}</span>
      </div>
      <div className="px-2.5 pb-2 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-certifica-500/30" strokeWidth={1.5} />
          <span className="text-[10px] text-certifica-500" style={{ fontWeight: 400 }}>{card.contato.nome}</span>
        </div>
        <span className="text-[9px] text-certifica-500/30">&middot;</span>
        <span className="text-[10px] text-certifica-500" style={{ fontWeight: 400 }}>{card.norma}</span>
      </div>
      <div className="px-2.5 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-[3px] bg-certifica-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#1F5E3B" : "#2B8EAD" }} />
          </div>
          <span className="text-[9px] text-certifica-500 font-mono flex-shrink-0" style={{ fontWeight: 500 }}>{entC}/{entT}</span>
        </div>
      </div>
      <div className="px-2.5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3 h-3 text-certifica-500/30" strokeWidth={1.5} />
          <span className="text-[10px] text-certifica-500" style={{ fontWeight: 400 }}>{card.consultor}</span>
        </div>
        {card.diasRestantes > 0 && (
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] ${
            isCritical ? "bg-nao-conformidade/8 text-nao-conformidade" : isUrgent ? "bg-observacao/8 text-observacao" : "bg-certifica-50 text-certifica-500"
          }`}>
            <Clock className="w-3 h-3" strokeWidth={1.5} />
            <span className="text-[9px] font-mono" style={{ fontWeight: 500 }}>{card.diasRestantes}d</span>
          </div>
        )}
      </div>
      <div className="px-2.5 pb-2 border-t border-certifica-200/60 pt-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-certifica-500">Valor do negocio</span>
          <span className="text-[10px] text-certifica-500 font-mono" style={{ fontWeight: 600 }}>{card.valor}</span>
        </div>
      </div>
    </div>
  );
});

/* ══════════════════════════════════════════════════════════
   Card Detail Overlay (Pipefy style)
   ══════════════════════════════════════════════════════════ */

function CardDetailOverlay({
  card,
  columns,
  cardMeta,
  onClose,
  moveCard,
  onUpdateCard,
  onUpdateCardMeta,
}: {
  card: PipelineCard;
  columns: ColumnConfig[];
  cardMeta: CardMeta;
  onClose: () => void;
  moveCard: (id: string, fase: number, idx?: number) => void;
  onUpdateCard: (cardId: string, patch: Partial<PipelineCard>) => void;
  onUpdateCardMeta: (cardId: string, updater: (meta: CardMeta) => CardMeta) => void;
}) {
  const pr = prioridadeConfig[card.prioridade];
  const entC = card.entregaveis.filter((e) => e.concluido).length;
  const entT = card.entregaveis.length;
  const pct = entT > 0 ? Math.round((entC / entT) * 100) : 0;
  const [activeTab, setActiveTab] = useState<"atividades" | "anexos" | "checklists" | "comentarios">("atividades");
  const [commentInput, setCommentInput] = useState("");
  const [checklistInput, setChecklistInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [activityInput, setActivityInput] = useState("");
  const [attachmentDraft, setAttachmentDraft] = useState({ name: "", type: "Arquivo", url: "" });

  const allFases = columns.map((c) => c.id);
  const currentIndex = columns.findIndex((c) => c.id === card.fase);
  const nextFases = currentIndex >= 0 ? columns.slice(currentIndex + 1).map((c) => c.id) : [];
  const prevFase = currentIndex > 0 ? columns[currentIndex - 1].id : null;
  const getFaseLabel = (faseId: number) => columns.find((c) => c.id === faseId)?.label ?? FASE_LABELS[faseId] ?? `Fase ${faseId}`;
  const getFaseColor = (faseId: number) => columns.find((c) => c.id === faseId)?.color ?? FASE_COLORS[faseId] ?? "#6B7280";
  const getPrioridadeTemperatura = (p: PipelineCard["prioridade"]) => (p === "alta" ? "Quente" : p === "media" ? "Morno" : "Frio");
  const fixedTags = [card.norma, getPrioridadeTemperatura(card.prioridade), getFaseLabel(card.fase)];

  const toIsoDate = (br: string) => {
    if (!br || br === "—") return "";
    const [dd, mm, yyyy] = br.split("/");
    if (!dd || !mm || !yyyy) return "";
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  };
  const toBrDate = (iso: string) => {
    if (!iso) return "—";
    const [yyyy, mm, dd] = iso.split("-");
    if (!dd || !mm || !yyyy) return "—";
    return `${dd}/${mm}/${yyyy}`;
  };

  const updateContato = (patch: Partial<Contato>) => {
    onUpdateCard(card.id, { contato: { ...card.contato, ...patch } });
  };

  const updatePrevisao = (iso: string) => {
    if (!iso) {
      onUpdateCard(card.id, { previsao: "—", diasRestantes: -1 });
      return;
    }
    const dueDate = new Date(`${iso}T00:00:00`);
    const now = new Date();
    const diasRestantes = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    onUpdateCard(card.id, { previsao: toBrDate(iso), diasRestantes });
  };

  const addComment = () => {
    const value = commentInput.trim();
    if (!value) return;
    onUpdateCardMeta(card.id, (meta) => ({ ...meta, comments: [value, ...meta.comments] }));
    setCommentInput("");
  };

  const addChecklist = () => {
    const value = checklistInput.trim();
    if (!value) return;
    const next = [...card.entregaveis, { id: `e${Date.now()}`, texto: value, concluido: false }];
    onUpdateCard(card.id, { entregaveis: next });
    setChecklistInput("");
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    onUpdateCardMeta(card.id, (meta) => {
      if (meta.tags.includes(value)) return meta;
      return { ...meta, tags: [...meta.tags, value] };
    });
    setTagInput("");
  };

  const addAttachment = () => {
    const name = attachmentDraft.name.trim();
    if (!name) return;
    let nextCount = card.totalDocumentos;
    onUpdateCardMeta(card.id, (meta) => {
      const nextAttachments = [
        ...meta.attachments,
        { id: `att-${Date.now()}`, name, type: attachmentDraft.type.trim() || "Arquivo", url: attachmentDraft.url.trim() || undefined },
      ];
      nextCount = nextAttachments.length;
      return { ...meta, attachments: nextAttachments };
    });
    onUpdateCard(card.id, { totalDocumentos: nextCount });
    setAttachmentDraft({ name: "", type: "Arquivo", url: "" });
  };

  const addActivity = () => {
    const text = activityInput.trim();
    if (!text) return;
    onUpdateCardMeta(card.id, (meta) => ({
      ...meta,
      activities: [{ id: `act-${Date.now()}`, at: "agora", text }, ...meta.activities],
    }));
    setActivityInput("");
  };

  return (
    <div className="fixed inset-0 z-50 flex" style={{ animation: "overlayFadeIn .25s ease-out" }}>
      <div className="absolute inset-0 bg-certifica-dark/50" onClick={onClose} style={{ animation: "overlayBackdrop .3s ease-out" }} />
      <div className="relative ml-auto bg-white w-full max-w-[1080px] h-full flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.08)]" style={{ animation: "overlaySlideIn .3s cubic-bezier(.22,1,.36,1)" }}>
        <div className="px-5 py-3 border-b border-certifica-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-certifica-accent font-mono px-1.5 py-0.5 bg-certifica-accent-light rounded-[2px]" style={{ fontWeight: 600 }}>{card.codigo}</span>
            <span className="text-[15px] text-certifica-900" style={{ fontWeight: 600 }}>{card.clienteNome}</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-certifica-500/40 hover:text-certifica-dark transition-colors cursor-pointer">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-[350px] flex-shrink-0 border-r border-certifica-200 overflow-y-auto">
            <div className="px-4 py-3 border-b border-certifica-200 space-y-2">
              <label className="text-[10px] text-certifica-500 uppercase tracking-[0.06em]" style={{ fontWeight: 600 }}>Título</label>
              <input value={card.titulo} onChange={(e) => onUpdateCard(card.id, { titulo: e.target.value })}
                className="w-full h-9 px-3 border border-certifica-200 rounded-[4px] text-[12px] bg-white" />
              <div className="grid grid-cols-2 gap-2">
                <select value={card.consultor} onChange={(e) => onUpdateCard(card.id, { consultor: e.target.value, equipe: [e.target.value] })}
                  className="h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white">
                  {consultores.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={card.prioridade} onChange={(e) => onUpdateCard(card.id, { prioridade: e.target.value as PipelineCard["prioridade"] })}
                  className="h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white">
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
              <div className="text-[10px] text-certifica-500">Prioridade atual: {pr.label}</div>
            </div>

            <div className="px-4 py-3 border-b border-certifica-200 space-y-2">
              <div className="text-[10px] tracking-[0.06em] uppercase text-certifica-500" style={{ fontWeight: 600 }}>Contato</div>
              <input value={card.contato.nome} onChange={(e) => updateContato({ nome: e.target.value })} placeholder="Nome"
                className="w-full h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white" />
              <input value={card.contato.cargo} onChange={(e) => updateContato({ cargo: e.target.value })} placeholder="Cargo"
                className="w-full h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white" />
              <input value={card.contato.email} onChange={(e) => updateContato({ email: e.target.value })} placeholder="E-mail"
                className="w-full h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white" />
              <input value={card.contato.telefone} onChange={(e) => updateContato({ telefone: e.target.value })} placeholder="Telefone"
                className="w-full h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white" />
            </div>

            <div className="px-4 py-3 border-b border-certifica-200 space-y-2">
              <div className="text-[10px] tracking-[0.06em] uppercase text-certifica-500" style={{ fontWeight: 600 }}>Empresa</div>
              <input value={card.clienteNome} onChange={(e) => onUpdateCard(card.id, { clienteNome: e.target.value })}
                className="w-full h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white" placeholder="Empresa" />
              <input value={card.clienteCnpj} onChange={(e) => onUpdateCard(card.id, { clienteCnpj: e.target.value })}
                className="w-full h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white" placeholder="CNPJ" />
              <input value={card.clienteSegmento} onChange={(e) => onUpdateCard(card.id, { clienteSegmento: e.target.value })}
                className="w-full h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white" placeholder="Segmento" />
              <input value={card.clienteEndereco} onChange={(e) => onUpdateCard(card.id, { clienteEndereco: e.target.value })}
                className="w-full h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white" placeholder="Endereço" />
            </div>

            <div className="px-4 py-3 border-b border-certifica-200 space-y-2">
              <div className="text-[10px] tracking-[0.06em] uppercase text-certifica-500" style={{ fontWeight: 600 }}>Comercial</div>
              <input value={card.norma} onChange={(e) => onUpdateCard(card.id, { norma: e.target.value })}
                className="w-full h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white" placeholder="Norma" />
              <input value={card.valor} onChange={(e) => onUpdateCard(card.id, { valor: e.target.value })}
                className="w-full h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white font-mono" placeholder="Valor" />
              <input value={card.condicoesPagamento} onChange={(e) => onUpdateCard(card.id, { condicoesPagamento: e.target.value })}
                className="w-full h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white" placeholder="Condições de pagamento" />
            </div>

            <div className="px-4 py-3 border-b border-certifica-200 space-y-2">
              <div className="text-[10px] tracking-[0.06em] uppercase text-certifica-500" style={{ fontWeight: 600 }}>Cronograma</div>
              <label className="text-[10px] text-certifica-500">Início</label>
              <input type="date" value={toIsoDate(card.inicio)} onChange={(e) => onUpdateCard(card.id, { inicio: toBrDate(e.target.value) })}
                className="w-full h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white" />
              <label className="text-[10px] text-certifica-500">Previsão</label>
              <input type="date" value={toIsoDate(card.previsao)} onChange={(e) => updatePrevisao(e.target.value)}
                className="w-full h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] bg-white" />
              <div className="text-[10px] text-certifica-500">Restante: {card.diasRestantes > 0 ? `${card.diasRestantes} dias` : "sem prazo"}</div>
            </div>

            <div className="px-4 py-3 space-y-2">
              <div className="text-[10px] tracking-[0.06em] uppercase text-certifica-500" style={{ fontWeight: 600 }}>Escopo e observações</div>
              <textarea value={card.escopo} onChange={(e) => onUpdateCard(card.id, { escopo: e.target.value })} rows={3}
                className="w-full px-2 py-1.5 border border-certifica-200 rounded-[4px] text-[11px] bg-white resize-y" />
              <textarea value={card.observacoes} onChange={(e) => onUpdateCard(card.id, { observacoes: e.target.value })} rows={3}
                className="w-full px-2 py-1.5 border border-certifica-200 rounded-[4px] text-[11px] bg-white resize-y" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-3 border-b border-certifica-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] text-certifica-dark" style={{ fontWeight: 600 }}>Fase atual</span>
                <span className="px-2.5 py-0.5 rounded-[2px] text-white text-[11px]" style={{ backgroundColor: getFaseColor(card.fase), fontWeight: 600 }}>
                  {getFaseLabel(card.fase)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {fixedTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-certifica-50 border border-certifica-200 rounded-full text-[10px] text-certifica-700">
                    <Tag className="w-3 h-3" strokeWidth={1.5} />
                    {tag}
                  </span>
                ))}
                {cardMeta.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-certifica-accent-light border border-certifica-accent/20 rounded-full text-[10px] text-certifica-accent">
                    <Tag className="w-3 h-3" strokeWidth={1.5} />
                    {tag}
                    <button onClick={() => onUpdateCardMeta(card.id, (meta) => ({ ...meta, tags: meta.tags.filter((t) => t !== tag) }))}>
                      <X className="w-3 h-3" strokeWidth={1.5} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px] w-[220px]"
                  placeholder="Nova tag personalizada"
                />
                <button onClick={addTag} className="h-8 px-2.5 text-[11px] rounded-[4px] bg-certifica-accent text-white">Adicionar tag</button>
              </div>
            </div>

            <div className="px-5 py-2 border-b border-certifica-200 bg-certifica-50/50 flex items-center gap-1.5">
              {[
                { id: "atividades", label: "Atividades", icon: FileText },
                { id: "anexos", label: "Anexos", icon: Paperclip },
                { id: "checklists", label: "Checklists", icon: CheckCircle2 },
                { id: "comentarios", label: "Comentários", icon: MessageSquare },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "atividades" | "anexos" | "checklists" | "comentarios")}
                  className={`h-7 px-2.5 rounded-[3px] text-[11px] flex items-center gap-1.5 transition-colors ${
                    activeTab === tab.id ? "bg-white border border-certifica-200 text-certifica-dark" : "text-certifica-500 hover:text-certifica-dark"
                  }`}
                  style={{ fontWeight: activeTab === tab.id ? 600 : 400 }}
                >
                  <tab.icon className="w-3 h-3" strokeWidth={1.5} />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "atividades" && (
              <div className="px-5 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input value={activityInput} onChange={(e) => setActivityInput(e.target.value)} placeholder="Nova atividade"
                    className="flex-1 h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px]" />
                  <button onClick={addActivity} className="h-8 px-2.5 text-[11px] rounded-[4px] bg-certifica-accent text-white">Registrar</button>
                </div>
                {cardMeta.activities.map((activity) => (
                  <div key={activity.id} className="border border-certifica-200 rounded-[4px] px-3 py-2 bg-white">
                    <div className="text-[10px] text-certifica-500 mb-1">{activity.at}</div>
                    <div className="text-[12px] text-certifica-dark">{activity.text}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "anexos" && (
              <div className="px-5 py-3">
                <div className="space-y-1.5 mb-3">
                  {cardMeta.attachments.map((file) => (
                    <div key={file.id} className="flex items-center gap-2 border border-certifica-200 bg-white rounded-[4px] px-3 py-2">
                      <div className="flex-1">
                        <div className="text-[12px] text-certifica-dark">{file.name}</div>
                        {file.url && <div className="text-[10px] text-certifica-500">{file.url}</div>}
                      </div>
                      <span className="text-[10px] px-1.5 py-px bg-certifica-50 border border-certifica-200 rounded-[2px]">{file.type}</span>
                      <button onClick={() => {
                        let nextCount = card.totalDocumentos;
                        onUpdateCardMeta(card.id, (meta) => {
                          const nextAttachments = meta.attachments.filter((a) => a.id !== file.id);
                          nextCount = nextAttachments.length;
                          return { ...meta, attachments: nextAttachments };
                        });
                        onUpdateCard(card.id, { totalDocumentos: nextCount });
                      }} className="text-certifica-500/50 hover:text-nao-conformidade">
                        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input value={attachmentDraft.name} onChange={(e) => setAttachmentDraft((p) => ({ ...p, name: e.target.value }))} placeholder="Nome"
                    className="h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px]" />
                  <input value={attachmentDraft.type} onChange={(e) => setAttachmentDraft((p) => ({ ...p, type: e.target.value }))} placeholder="Tipo"
                    className="h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px]" />
                  <input value={attachmentDraft.url} onChange={(e) => setAttachmentDraft((p) => ({ ...p, url: e.target.value }))} placeholder="URL (opcional)"
                    className="h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px]" />
                </div>
                <button onClick={addAttachment} className="mt-2 h-8 px-3 text-[11px] rounded-[4px] bg-certifica-accent text-white">Adicionar anexo</button>
              </div>
            )}

            {activeTab === "checklists" && (
              <div className="px-5 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] tracking-[0.06em] uppercase text-certifica-500" style={{ fontWeight: 600 }}>
                    Checklists ({entC}/{entT})
                  </div>
                  <span className="text-[12px] text-certifica-900 font-mono" style={{ fontWeight: 600 }}>{pct}%</span>
                </div>
                <div className="h-[5px] bg-certifica-200 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#1F5E3B" : "#2B8EAD" }} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input value={checklistInput} onChange={(e) => setChecklistInput(e.target.value)} placeholder="Novo item de checklist"
                    className="flex-1 h-8 px-2 border border-certifica-200 rounded-[4px] text-[11px]" />
                  <button onClick={addChecklist} className="h-8 px-2.5 text-[11px] rounded-[4px] bg-certifica-accent text-white">Adicionar</button>
                </div>
                <div className="space-y-0.5">
                  {card.entregaveis.map((ent, idx) => (
                    <div key={ent.id} className="flex items-start gap-2 py-2 border-b border-certifica-200/50 last:border-0">
                      <button onClick={() => onUpdateCard(card.id, {
                        entregaveis: card.entregaveis.map((item) => item.id === ent.id ? { ...item, concluido: !item.concluido } : item),
                      })} className="mt-px flex-shrink-0">
                        {ent.concluido ? <CheckCircle2 className="w-4 h-4 text-conformidade" strokeWidth={1.5} /> : <Circle className="w-4 h-4 text-certifica-200" strokeWidth={1.5} />}
                      </button>
                      <input
                        value={ent.texto}
                        onChange={(e) => onUpdateCard(card.id, {
                          entregaveis: card.entregaveis.map((item) => item.id === ent.id ? { ...item, texto: e.target.value } : item),
                        })}
                        className={`text-[12px] flex-1 bg-transparent border-0 p-0 focus:outline-none ${ent.concluido ? "text-certifica-500 line-through" : "text-certifica-dark"}`}
                      />
                      <button onClick={() => onUpdateCard(card.id, { entregaveis: card.entregaveis.filter((item) => item.id !== ent.id) })}
                        className="text-certifica-500/40 hover:text-nao-conformidade">
                        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <span className="text-[9px] text-certifica-500/30 font-mono">{String(idx + 1).padStart(2, "0")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "comentarios" && (
              <div className="px-5 py-3">
                <div className="space-y-2 mb-3">
                  {cardMeta.comments.map((comment, idx) => (
                    <div key={`${idx}-${comment}`} className="border border-certifica-200 rounded-[4px] bg-white px-3 py-2 flex items-start gap-2">
                      <div className="text-[12px] text-certifica-dark flex-1" style={{ lineHeight: "1.5" }}>{comment}</div>
                      <button onClick={() => onUpdateCardMeta(card.id, (meta) => ({ ...meta, comments: meta.comments.filter((_, i) => i !== idx) }))}>
                        <X className="w-3.5 h-3.5 text-certifica-500/40 hover:text-nao-conformidade" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  rows={3}
                  placeholder="Digite aqui..."
                  className="w-full px-3 py-2 rounded-[4px] border border-certifica-200 bg-white text-[12px] resize-y"
                />
                <div className="mt-2 flex justify-end">
                  <button onClick={addComment} className="h-8 px-3 rounded-[4px] bg-certifica-accent text-white text-[11px]" style={{ fontWeight: 600 }}>
                    Adicionar nota
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-[220px] flex-shrink-0 border-l border-certifica-200 overflow-y-auto bg-certifica-50/50">
            <div className="px-3.5 py-3 border-b border-certifica-200">
              <span className="text-[11px] text-certifica-900" style={{ fontWeight: 600 }}>Mover card para fase</span>
            </div>
            <div className="px-3.5 py-3 space-y-2">
              {nextFases.map((f) => (
                <button key={f} onClick={() => moveCard(card.id, f)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-[3px] border transition-colors cursor-pointer hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  style={{ borderColor: `${getFaseColor(f)}40`, backgroundColor: `${getFaseColor(f)}08` }}>
                  <span className="text-[11px]" style={{ fontWeight: 500, color: getFaseColor(f) }}>{getFaseLabel(f)}</span>
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: getFaseColor(f) }} />
                </button>
              ))}
              {nextFases.length === 0 && (
                <div className="py-3 text-center">
                  <CheckCircle2 className="w-5 h-5 text-conformidade mx-auto mb-1.5" strokeWidth={1.5} />
                  <span className="text-[11px] text-certifica-500">Última fase</span>
                </div>
              )}
              {prevFase !== null && (
                <div className="pt-2 border-t border-certifica-200 mt-3">
                  <button onClick={() => moveCard(card.id, prevFase)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-[3px] border border-certifica-200 bg-white transition-colors cursor-pointer hover:border-certifica-accent/30">
                    <ChevronLeft className="w-3.5 h-3.5 text-certifica-500" strokeWidth={1.5} />
                    <span className="text-[11px] text-certifica-500" style={{ fontWeight: 500 }}>{getFaseLabel(prevFase)}</span>
                  </button>
                </div>
              )}
            </div>
            <div className="px-3.5 py-3 border-t border-certifica-200 mt-2">
              <span className="text-[9px] tracking-[0.06em] uppercase text-certifica-500/60 block mb-2" style={{ fontWeight: 600 }}>Fases</span>
              {allFases.map((f) => (
                <div key={f} className={`flex items-center gap-2 py-1 ${f === card.fase ? "opacity-100" : "opacity-40"}`}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getFaseColor(f) }} />
                  <span className="text-[10px] text-certifica-dark" style={{ fontWeight: f === card.fase ? 600 : 400 }}>{getFaseLabel(f)}</span>
                  {f === card.fase && <span className="text-[8px] text-certifica-accent ml-auto" style={{ fontWeight: 600 }}>ATUAL</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Gantt View
   ══════════════════════════════════════════════════════════ */

function GanttView({ cards, onSelectCard }: { cards: PipelineCard[]; onSelectCard: (c: PipelineCard) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);

  // Only show cards with valid dates
  const ganttCards = useMemo(() => {
    return cards
      .filter((c) => c.inicio !== "—" && c.previsao !== "—")
      .sort((a, b) => a.fase - b.fase || a.inicio.localeCompare(b.inicio));
  }, [cards]);

  const parseDate = (d: string) => {
    const [dd, mm, yyyy] = d.split("/");
    return new Date(+yyyy, +mm - 1, +dd);
  };

  const toDayOffset = (date: Date, base: Date) => {
    return Math.max(0, Math.floor((date.getTime() - base.getTime()) / 86400000));
  };

  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (ganttCards.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDays: 1 };
    let min = parseDate(ganttCards[0].inicio);
    let max = parseDate(ganttCards[0].previsao);
    ganttCards.forEach((c) => {
      const s = parseDate(c.inicio);
      const e = parseDate(c.previsao);
      if (s < min) min = s;
      if (e > max) max = e;
    });
    // Add some padding
    min = new Date(min.getTime() - 15 * 86400000);
    max = new Date(max.getTime() + 15 * 86400000);
    const days = Math.ceil((max.getTime() - min.getTime()) / 86400000);
    return { minDate: min, maxDate: max, totalDays: days };
  }, [ganttCards]);

  const dayWidth = 3.2;
  const timelineWidth = Math.max(1400, totalDays * dayWidth);

  const months = useMemo(() => {
    const result: { label: string; startDay: number; widthDay: number }[] = [];
    const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (cur <= maxDate) {
      const monthStart = Math.max(0, (cur.getTime() - minDate.getTime()) / 86400000);
      const nextMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const monthEnd = Math.min(totalDays, (nextMonth.getTime() - minDate.getTime()) / 86400000);
      result.push({
        label: cur.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", ""),
        startDay: monthStart,
        widthDay: monthEnd - monthStart,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return result;
  }, [minDate, maxDate, totalDays]);

  const today = new Date();
  const todayX = Math.max(0, Math.min(timelineWidth, toDayOffset(today, minDate) * dayWidth));

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select")) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartScrollRef.current = scroller.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    e.preventDefault();
    const deltaX = e.clientX - dragStartXRef.current;
    scroller.scrollLeft = dragStartScrollRef.current - deltaX;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  if (ganttCards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[12.5px] text-certifica-500" style={{ fontWeight: 400 }}>Nenhum projeto com datas para exibir no Gantt.</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-auto px-5 py-4"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ userSelect: "none" }}
    >
      <div className="min-w-[1100px]">
        {/* Month headers */}
        <div className="flex h-7 mb-0.5 border-b border-certifica-200">
          <div className="w-[220px] flex-shrink-0 flex items-center px-3">
            <span className="text-[10px] tracking-[0.06em] uppercase text-certifica-500" style={{ fontWeight: 600 }}>Projeto</span>
          </div>
          <div className="relative" style={{ width: timelineWidth }}>
            {months.map((m, i) => {
              const leftPx = m.startDay * dayWidth;
              const widthPx = Math.max(1, m.widthDay * dayWidth);
              return (
                <div
                  key={i}
                  className="absolute top-0 h-full border-l border-certifica-200/60 text-[10px] text-certifica-500 flex items-center justify-center"
                  style={{ left: leftPx, width: widthPx, fontWeight: 400 }}
                >
                  {widthPx > 54 ? m.label : ""}
                </div>
              );
            })}
            {/* final right border */}
            <div className="absolute top-0 bottom-0 w-px bg-certifica-200/60" style={{ left: timelineWidth }} />
            {/* Today marker */}
            <div className="absolute top-0 bottom-0 w-px bg-nao-conformidade/45 z-10" style={{ left: todayX }}>
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 px-1 py-px bg-nao-conformidade text-white text-[7px] rounded-[1px]" style={{ fontWeight: 600 }}>
                Hoje
              </div>
            </div>
          </div>
        </div>

        {/* Rows */}
        {ganttCards.map((card) => {
          const startDate = parseDate(card.inicio);
          const endDate = parseDate(card.previsao);
          const startPct = ((startDate.getTime() - minDate.getTime()) / 86400000 / totalDays) * 100;
          const widthPct = ((endDate.getTime() - startDate.getTime()) / 86400000 / totalDays) * 100;
          const entC = card.entregaveis.filter((e) => e.concluido).length;
          const entT = card.entregaveis.length;
          const pct = entT > 0 ? Math.round((entC / entT) * 100) : 0;
          const pr = prioridadeConfig[card.prioridade];

          return (
            <div key={card.id} className="flex items-center h-10 border-b border-certifica-200/40 hover:bg-certifica-50/50 cursor-pointer group"
              onClick={() => onSelectCard(card)}>
              {/* Label */}
              <div className="w-[220px] flex-shrink-0 flex items-center gap-2 px-3 overflow-hidden">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pr.dot}`} />
                <span className="text-[10px] text-certifica-700 font-mono flex-shrink-0" style={{ fontWeight: 600 }}>{card.codigo}</span>
                <span className="text-[11px] text-certifica-dark truncate" style={{ fontWeight: 500 }}>{card.clienteNome.split(" ").slice(0, 2).join(" ")}</span>
              </div>

              {/* Bar */}
              <div className="relative h-full flex items-center" style={{ width: timelineWidth }}>
                {/* Month grid lines */}
                {months.map((m, i) => (
                  <div key={i} className="absolute top-0 bottom-0 border-l border-certifica-200/30" style={{ left: m.startDay * dayWidth }} />
                ))}
                {/* Today line */}
                <div className="absolute top-0 bottom-0 w-px bg-nao-conformidade/20 z-10" style={{ left: todayX }} />

                {/* Gantt bar */}
                <div className="absolute h-5 rounded-[3px] flex items-center overflow-hidden transition-shadow group-hover:shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                  style={{
                    left: toDayOffset(startDate, minDate) * dayWidth,
                    width: Math.max(8, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) * dayWidth),
                    backgroundColor: FASE_COLORS[card.fase] + "18",
                    border: `1px solid ${FASE_COLORS[card.fase]}40`,
                  }}>
                  {/* Progress fill */}
                  <div className="absolute left-0 top-0 bottom-0 rounded-l-[2px]"
                    style={{ width: `${pct}%`, backgroundColor: FASE_COLORS[card.fase] + "30" }} />
                  {/* Label inside bar */}
                  {Math.max(8, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) * dayWidth) > 90 && (
                    <span className="relative z-10 px-2 text-[9px] truncate" style={{ color: FASE_COLORS[card.fase], fontWeight: 600 }}>
                      {card.norma} — {pct}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
