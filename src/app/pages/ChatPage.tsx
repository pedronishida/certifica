import React, { useMemo, useState } from "react";
import { DSBadge } from "../components/ds/DSBadge";
import { DSButton } from "../components/ds/DSButton";
import { Search, MessageSquare, Paperclip, Send, Mic, Phone, Image, Bot, Link2, ShieldAlert } from "lucide-react";


type AtendimentoStatus = "aberto" | "aguardando_cliente" | "resolvido";
type Risco = "baixa" | "media" | "alta";
type Classificacao = "duvida" | "evidencia" | "urgencia" | "bloqueio" | "geral";
type LinkType = "evidencia" | "documento" | "plano_acao";
type MessageKind = "texto" | "audio" | "anexo" | "imagem";

interface Conversation {
  id: string;
  cliente: string;
  projeto: string;
  canal: "WhatsApp" | "Interno";
  consultor: string;
  status: AtendimentoStatus;
  risco: Risco;
  slaMin: number;
  minutosSemRetorno: number;
  lastMessage: string;
  time: string;
  unread: number;
}

interface ChatMessage {
  id: string;
  from: "cliente" | "consultor";
  text: string;
  time: string;
  kind: MessageKind;
  classificacao: Classificacao;
  links: { type: LinkType; label: string }[];
}

const initialConversations: Conversation[] = [
  { id: "c1", cliente: "Metalúrgica AçoForte", projeto: "ISO 9001:2015", canal: "WhatsApp", consultor: "Carlos Silva", status: "aberto", risco: "alta", slaMin: 30, minutosSemRetorno: 42, lastMessage: "Enviamos as fotos da auditoria de segurança.", time: "14:32", unread: 2 },
  { id: "c2", cliente: "Grupo Energis", projeto: "ISO 50001:2018", canal: "WhatsApp", consultor: "Ana Costa", status: "aguardando_cliente", risco: "media", slaMin: 60, minutosSemRetorno: 18, lastMessage: "Podemos revisar o item 7.1 da ISO 50001?", time: "13:05", unread: 0 },
  { id: "c3", cliente: "Plastiform Industrial", projeto: "ISO 14001:2015", canal: "Interno", consultor: "Roberto Lima", status: "resolvido", risco: "baixa", slaMin: 90, minutosSemRetorno: 0, lastMessage: "Checklist atualizado para auditoria interna.", time: "11:48", unread: 1 },
];

const initialMessages: Record<string, ChatMessage[]> = {
  c1: [
    { id: "m1", from: "cliente", text: "Bom dia, equipe Certifica.", time: "14:20", kind: "texto", classificacao: "geral", links: [] },
    { id: "m2", from: "cliente", text: "Enviamos as fotos da auditoria de segurança.", time: "14:21", kind: "imagem", classificacao: "evidencia", links: [{ type: "evidencia", label: "Evidência auditoria de segurança" }] },
    { id: "m3", from: "consultor", text: "Perfeito, vou analisar as evidências agora.", time: "14:24", kind: "texto", classificacao: "evidencia", links: [{ type: "plano_acao", label: "Plano de ação - item 7.5" }] },
  ],
  c2: [
    { id: "m4", from: "cliente", text: "Podemos revisar o item 7.1 da ISO 50001?", time: "13:05", kind: "texto", classificacao: "duvida", links: [{ type: "documento", label: "Manual energético v3" }] },
  ],
  c3: [
    { id: "m5", from: "consultor", text: "Checklist atualizado para auditoria interna.", time: "11:48", kind: "anexo", classificacao: "evidencia", links: [{ type: "documento", label: "Checklist auditoria interna" }] },
  ],
};

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function classifyMessage(text: string): Classificacao {
  const t = text.toLowerCase();
  if (t.includes("urgente") || t.includes("hoje") || t.includes("prazo")) return "urgencia";
  if (t.includes("bloqueio") || t.includes("travado") || t.includes("não consigo") || t.includes("nao consigo")) return "bloqueio";
  if (t.includes("evid") || t.includes("foto") || t.includes("anexo") || t.includes("documento")) return "evidencia";
  if (t.includes("?") || t.includes("dúvida") || t.includes("duvida")) return "duvida";
  return "geral";
}

function aiSuggestion(classificacao: Classificacao): string {
  const map: Record<Classificacao, string> = {
    duvida: "Sugestão IA: responder com referência da norma aplicável e próximo passo.",
    evidencia: "Sugestão IA: confirmar recebimento e vincular ao item de auditoria.",
    urgencia: "Sugestão IA: priorizar agora e informar ETA objetivo ao cliente.",
    bloqueio: "Sugestão IA: abrir plano de ação corretiva com responsável e prazo.",
    geral: "Sugestão IA: manter resposta objetiva com contexto do projeto.",
  };
  return map[classificacao];
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>(initialMessages);
  const [historyByConversation, setHistoryByConversation] = useState<Record<string, string[]>>({
    c1: ["14:24 · Mensagem vinculada a evidência de auditoria", "14:22 · Classificação IA: evidência"],
    c2: ["13:05 · Classificação IA: dúvida"],
    c3: ["11:50 · Conversa marcada como resolvida"],
  });
  const [selectedId, setSelectedId] = useState("c1");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | AtendimentoStatus>("todos");
  const [riskFilter, setRiskFilter] = useState<"todas" | Risco>("todas");
  const [draft, setDraft] = useState("");
  const [nextKind, setNextKind] = useState<MessageKind>("texto");
  const [nextLinkType, setNextLinkType] = useState<LinkType>("evidencia");

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? conversations[0];
  const selectedMessages = selectedConversation ? messagesByConversation[selectedConversation.id] ?? [] : [];
  const aiClassificacao = classifyMessage(draft);
  const suggestion = aiSuggestion(aiClassificacao);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (statusFilter !== "todos" && c.status !== statusFilter) return false;
      if (riskFilter !== "todas" && c.risco !== riskFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return c.cliente.toLowerCase().includes(q) || c.projeto.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
    });
  }, [conversations, searchQuery, statusFilter, riskFilter]);

  const slaBreached = selectedConversation ? selectedConversation.minutosSemRetorno > selectedConversation.slaMin : false;
  const classificacaoBadge: Record<Classificacao, "outline" | "oportunidade" | "observacao" | "nao-conformidade" | "conformidade"> = {
    geral: "outline",
    duvida: "oportunidade",
    evidencia: "conformidade",
    urgencia: "observacao",
    bloqueio: "nao-conformidade",
  };

  const updateConversation = (id: string, patch: Partial<Conversation>) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const pushHistory = (id: string, entry: string) => {
    setHistoryByConversation((prev) => ({
      ...prev,
      [id]: [`${nowTime()} · ${entry}`, ...(prev[id] ?? [])].slice(0, 20),
    }));
  };

  const sendMessage = () => {
    if (!selectedConversation) return;
    const text = draft.trim() || (nextKind !== "texto" ? `Mensagem enviada (${nextKind})` : "");
    if (!text) return;
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      from: "consultor",
      text,
      time: nowTime(),
      kind: nextKind,
      classificacao: aiClassificacao,
      links: [{ type: nextLinkType, label: `${nextLinkType} vinculada` }],
    };
    setMessagesByConversation((prev) => ({ ...prev, [selectedConversation.id]: [...(prev[selectedConversation.id] ?? []), msg] }));
    updateConversation(selectedConversation.id, { lastMessage: text, time: msg.time, unread: 0, status: "aguardando_cliente", minutosSemRetorno: 0 });
    pushHistory(selectedConversation.id, `Mensagem enviada (${msg.kind}) · IA: ${msg.classificacao}`);

    setDraft("");
    setNextKind("texto");
  };

  const simulateIncoming = () => {
    if (!selectedConversation) return;
    const text = "Recebido, vamos validar internamente e retornar em seguida.";
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      from: "cliente",
      text,
      time: nowTime(),
      kind: "texto",
      classificacao: "geral",
      links: [],
    };
    setMessagesByConversation((prev) => ({ ...prev, [selectedConversation.id]: [...(prev[selectedConversation.id] ?? []), msg] }));
    updateConversation(selectedConversation.id, { lastMessage: text, time: msg.time, unread: selectedConversation.unread + 1, status: "aberto", minutosSemRetorno: 5 });
    pushHistory(selectedConversation.id, "Mensagem recebida do cliente");
  };

  React.useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [selectedConversation, conversations]);

  return (
    <div className="p-4 h-full flex flex-col gap-3 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-certifica-900 mb-0.5 text-lg" style={{ fontWeight: 700 }}>Chat Operacional</h2>
          <p className="text-[11px] text-certifica-500" style={{ fontWeight: 400 }}>
            Atendimento técnico com SLA, classificação IA e rastreabilidade completa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DSBadge variant="conformidade">Pronto para Z-API</DSBadge>
          <DSButton variant="outline" size="sm" icon={<Phone className="w-3.5 h-3.5" />}>
            Iniciar ligação
          </DSButton>
          <DSButton variant="outline" size="sm" onClick={simulateIncoming}>
            Simular recebimento
          </DSButton>
        </div>
      </div>

      <div className="grid grid-cols-[240px_1fr_220px] gap-3 min-h-0 flex-1 overflow-hidden">
        <div className="bg-white border border-certifica-200 rounded-[4px] overflow-hidden flex flex-col min-h-0">
          <div className="p-3 border-b border-certifica-200 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-certifica-500/40" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente, projeto ou mensagem..."
                className="w-full h-8 pl-8 pr-3 rounded-[4px] bg-certifica-50 border border-certifica-200 text-[12px] focus:outline-none focus:ring-1 focus:ring-certifica-accent/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "todos" | AtendimentoStatus)} className="h-8 px-2 rounded-[4px] border border-certifica-200 text-[11px]">
                <option value="todos">Todos status</option>
                <option value="aberto">Aberto</option>
                <option value="aguardando_cliente">Aguardando cliente</option>
                <option value="resolvido">Resolvido</option>
              </select>
              <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as "todas" | Risco)} className="h-8 px-2 rounded-[4px] border border-certifica-200 text-[11px]">
                <option value="todas">Todo risco</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredConversations.length === 0 && (
              <div className="h-full flex items-center justify-center text-[12px] text-certifica-500 px-3 text-center">
                Nenhuma conversa encontrada para os filtros atuais.
              </div>
            )}
            {filteredConversations.map((conversation) => {
              const active = conversation.id === selectedId;
              return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setSelectedId(conversation.id);
                    updateConversation(conversation.id, { unread: 0 });
                  }}
                  className={`w-full text-left p-2.5 rounded-[4px] mb-1 border transition-colors ${
                    active ? "bg-certifica-accent-light border-certifica-accent/20" : "bg-white border-transparent hover:bg-certifica-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[12.5px] text-certifica-dark" style={{ fontWeight: 600 }}>{conversation.cliente}</span>
                    <span className="text-[10px] text-certifica-500">{conversation.time}</span>
                  </div>
                  <div className="text-[10.5px] text-certifica-500 mb-1">{conversation.projeto}</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11.5px] text-certifica-500 truncate">{conversation.lastMessage}</span>
                    {conversation.unread > 0 && (
                      <span className="min-w-4 h-4 px-1 rounded-full bg-certifica-accent text-white text-[10px] flex items-center justify-center">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] text-certifica-500/80">{conversation.canal}</span>
                    <span className="text-certifica-200">•</span>
                    <span className={`text-[10px] ${conversation.risco === "alta" ? "text-nao-conformidade" : conversation.risco === "media" ? "text-observacao" : "text-conformidade"}`}>
                      Risco {conversation.risco}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-certifica-200 rounded-[4px] overflow-hidden flex flex-col min-h-0">
          {!selectedConversation ? (
            <div className="h-full flex items-center justify-center text-[12px] text-certifica-500 px-6 text-center">
              Selecione uma conversa para iniciar o atendimento operacional.
            </div>
          ) : (
            <>
          <div className="px-3 py-2 border-b border-certifica-200 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-certifica-accent-light text-certifica-accent-dark flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] text-certifica-dark truncate" style={{ fontWeight: 600 }}>{selectedConversation.cliente}</div>
                <div className="text-[10px] text-certifica-500 truncate">
                  {selectedConversation.projeto} • {selectedConversation.canal}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <select
                value={selectedConversation.status}
                onChange={(e) => {
                  updateConversation(selectedConversation.id, { status: e.target.value as AtendimentoStatus });
                  pushHistory(selectedConversation.id, `Status alterado para ${e.target.value}`);
                }}
                className="h-7 px-1.5 rounded-[4px] border border-certifica-200 text-[10px]"
              >
                <option value="aberto">Aberto</option>
                <option value="aguardando_cliente">Aguardando</option>
                <option value="resolvido">Resolvido</option>
              </select>
              <DSBadge variant={slaBreached ? "nao-conformidade" : "conformidade"}>
                {selectedConversation.minutosSemRetorno}/{selectedConversation.slaMin}m
              </DSBadge>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 bg-certifica-50">
            <div className="space-y-2">
              {selectedMessages.map((message) => {
                const isConsultor = message.from === "consultor";
                return (
                  <div key={message.id} className={`flex ${isConsultor ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[74%] px-3 py-2 rounded-[6px] border ${isConsultor ? "bg-certifica-accent text-white border-certifica-accent" : "bg-white text-certifica-dark border-certifica-200"}`}>
                      <p className="text-[12.5px]" style={{ fontWeight: 400 }}>{message.text}</p>
                      {message.links.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {message.links.map((link) => (
                            <span key={`${message.id}-${link.label}`} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[9px] ${isConsultor ? "bg-white/20 text-white" : "bg-certifica-50 border border-certifica-200 text-certifica-500"}`}>
                              <Link2 className="w-2.5 h-2.5" />
                              {link.label}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className={`mt-1 text-[10px] flex items-center gap-2 ${isConsultor ? "text-white/75" : "text-certifica-500"}`}>
                        <span>{message.time}</span>
                        <span>•</span>
                        <span>{message.kind}</span>
                        <span>•</span>
                        <DSBadge variant={classificacaoBadge[message.classificacao]} className="text-[9px] px-1.5 py-0">
                          {message.classificacao}
                        </DSBadge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-3 py-2 border-t border-certifica-200 bg-white space-y-1.5 flex-shrink-0">
            <div className="bg-certifica-accent-light border border-certifica-accent/20 rounded-[4px] px-2 py-1.5 text-[10px] text-certifica-dark flex items-start gap-1.5">
              <Bot className="w-3.5 h-3.5 text-certifica-accent flex-shrink-0 mt-0.5" />
              <div>
                <span style={{ fontWeight: 600 }}>IA: {aiClassificacao}</span>
                <span className="text-certifica-500 ml-1">— {suggestion}</span>
              </div>
            </div>

            <div className="flex items-end gap-1.5">
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setNextKind("anexo")} className={`h-8 w-8 rounded-[4px] border flex items-center justify-center ${nextKind === "anexo" ? "border-certifica-accent text-certifica-accent" : "border-certifica-200 text-certifica-500 hover:text-certifica-dark"}`}>
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setNextKind("audio")} className={`h-8 w-8 rounded-[4px] border flex items-center justify-center ${nextKind === "audio" ? "border-certifica-accent text-certifica-accent" : "border-certifica-200 text-certifica-500 hover:text-certifica-dark"}`}>
                  <Mic className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setNextKind("imagem")} className={`h-8 w-8 rounded-[4px] border flex items-center justify-center ${nextKind === "imagem" ? "border-certifica-accent text-certifica-accent" : "border-certifica-200 text-certifica-500 hover:text-certifica-dark"}`}>
                  <Image className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Digite uma mensagem..."
                  className="w-full min-h-8 max-h-20 rounded-[4px] border border-certifica-200 bg-certifica-50 px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-certifica-accent/40 resize-none"
                />
              </div>
              <select value={nextLinkType} onChange={(e) => setNextLinkType(e.target.value as LinkType)} className="h-8 px-1.5 rounded-[4px] border border-certifica-200 text-[9px] bg-white flex-shrink-0">
                <option value="evidencia">Evidência</option>
                <option value="documento">Documento</option>
                <option value="plano_acao">Plano ação</option>
              </select>
              <DSButton size="sm" icon={<Send className="w-3.5 h-3.5" />} onClick={sendMessage} className="flex-shrink-0">
                Enviar
              </DSButton>
            </div>
          </div>
            </>
          )}
        </div>

        <div className="bg-white border border-certifica-200 rounded-[4px] overflow-hidden flex flex-col min-h-0">
          {!selectedConversation ? (
            <div className="h-full flex items-center justify-center text-[12px] text-certifica-500 px-6 text-center">
              Painel operacional indisponível sem conversa selecionada.
            </div>
          ) : (
            <>
          <div className="px-3 py-2.5 border-b border-certifica-200">
            <span className="text-[12px] text-certifica-900" style={{ fontWeight: 600 }}>Painel operacional</span>
          </div>
          <div className="p-3 space-y-3 overflow-y-auto">
            <div className="border border-certifica-200 rounded-[4px] p-2.5">
              <div className="text-[10px] uppercase tracking-[0.06em] text-certifica-500 mb-1" style={{ fontWeight: 600 }}>Atendimento</div>
              <div className="text-[12px] text-certifica-dark mb-1">{selectedConversation.status.replace("_", " ")}</div>
              <div className="text-[11px] text-certifica-500">Consultor responsável: {selectedConversation.consultor}</div>
              <div className={`mt-1.5 text-[11px] ${slaBreached ? "text-nao-conformidade" : "text-conformidade"}`}>
                SLA {slaBreached ? "estourado" : "dentro do prazo"} ({selectedConversation.minutosSemRetorno} min)
              </div>
            </div>

            <div className="border border-certifica-200 rounded-[4px] p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldAlert className={`w-3.5 h-3.5 ${selectedConversation.risco === "alta" ? "text-nao-conformidade" : selectedConversation.risco === "media" ? "text-observacao" : "text-conformidade"}`} />
                <span className="text-[10px] uppercase tracking-[0.06em] text-certifica-500" style={{ fontWeight: 600 }}>Risco</span>
              </div>
              <div className="text-[12px] text-certifica-dark">Etiqueta: {selectedConversation.risco}</div>
            </div>

            <div className="border border-certifica-200 rounded-[4px] p-2.5">
              <div className="text-[10px] uppercase tracking-[0.06em] text-certifica-500 mb-1" style={{ fontWeight: 600 }}>Trilha de auditoria</div>
              <div className="space-y-1.5">
                {(historyByConversation[selectedId] ?? []).map((entry) => (
                  <div key={entry} className="text-[11px] text-certifica-500">{entry}</div>
                ))}
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
