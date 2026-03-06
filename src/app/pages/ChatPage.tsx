import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DSBadge } from "../components/ds/DSBadge";
import { DSButton } from "../components/ds/DSButton";
import { Search, MessageSquare, Paperclip, Send, Mic, Phone, Image, Bot, Link2, ShieldAlert } from "lucide-react";
import { useChat, classifyMessage } from "../lib/useChat";
import { classifyMessageAI, aiSuggestionGPT } from "../lib/openai";
import type { ChatMessage } from "../lib/useChat";

type AtendimentoStatus = "aberto" | "aguardando_cliente" | "resolvido";
type Risco = "baixa" | "media" | "alta";
type Classificacao = "duvida" | "evidencia" | "urgencia" | "bloqueio" | "geral";
type LinkType = "evidencia" | "documento" | "plano_acao";
type MessageKind = "texto" | "audio" | "anexo" | "imagem";

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return ts;
  }
}

export default function ChatPage() {
  const {
    conversations,
    messages,
    loading,
    error,
    loadMessages,
    subscribeToConversation,
    sendMessage: hookSendMessage,
    unreadCount,
  } = useChat();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | AtendimentoStatus>("todos");
  const [riskFilter, setRiskFilter] = useState<"todas" | Risco>("todas");
  const [draft, setDraft] = useState("");
  const [nextKind, setNextKind] = useState<MessageKind>("texto");
  const [nextLinkType, setNextLinkType] = useState<LinkType>("evidencia");
  const [sending, setSending] = useState(false);
  const [aiClassificacao, setAiClassificacao] = useState<string>("geral");
  const [suggestion, setSuggestion] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  // Debounced GPT classification + suggestion while typing
  useEffect(() => {
    if (!draft.trim()) {
      setAiClassificacao("geral");
      setSuggestion("");
      return;
    }
    const timer = setTimeout(async () => {
      setAiLoading(true);
      try {
        const cls = await classifyMessageAI(draft);
        setAiClassificacao(cls);
        const sug = await aiSuggestionGPT(cls, draft);
        setSuggestion(sug);
      } catch {
        setAiClassificacao(classifyMessage(draft));
        setSuggestion("");
      } finally {
        setAiLoading(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [draft]);

  // Local audit trail per conversation (not stored in DB)
  const [historyByConversation, setHistoryByConversation] = useState<Record<string, string[]>>({});

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Select first conversation when conversations load
  useEffect(() => {
    if (conversations.length > 0 && selectedId === null) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  // Load messages and subscribe when selection changes
  useEffect(() => {
    if (!selectedId) return;

    loadMessages(selectedId);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    unsubscribeRef.current = subscribeToConversation(selectedId);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [selectedId, loadMessages, subscribeToConversation]);

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;
  const selectedMessages: ChatMessage[] = selectedId ? (messages[selectedId] ?? []) : [];

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Map hook status to UI status filter
      const mappedStatus: AtendimentoStatus =
        c.status === "arquivado" ? "resolvido" : "aberto";

      if (statusFilter !== "todos" && mappedStatus !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (c.titulo ?? "").toLowerCase().includes(q) ||
        (c.cliente_nome ?? "").toLowerCase().includes(q) ||
        (c.ultima_mensagem ?? "").toLowerCase().includes(q)
      );
    });
  }, [conversations, searchQuery, statusFilter]);

  const pushHistory = (id: string, entry: string) => {
    setHistoryByConversation((prev) => ({
      ...prev,
      [id]: [`${nowTime()} · ${entry}`, ...(prev[id] ?? [])].slice(0, 20),
    }));
  };

  const handleSendMessage = async () => {
    if (!selectedConversation) return;
    const text = draft.trim() || (nextKind !== "texto" ? `Mensagem enviada (${nextKind})` : "");
    if (!text) return;

    setSending(true);
    try {
      const classificacao = aiClassificacao || classifyMessage(text);
      const result = await hookSendMessage(
        selectedConversation.id,
        "Consultor", // In a real app this would be the current user's name from auth session
        text,
        classificacao
      );

      if (result) {
        pushHistory(selectedConversation.id, `Mensagem enviada (${nextKind}) · classe: ${classificacao}`);
        setDraft("");
        setNextKind("texto");
      } else {
        toast.error("Erro ao enviar mensagem.");
      }
    } finally {
      setSending(false);
    }
  };

  const classificacaoBadge: Record<Classificacao, "outline" | "oportunidade" | "observacao" | "nao-conformidade" | "conformidade"> = {
    geral: "outline",
    duvida: "oportunidade",
    evidencia: "conformidade",
    urgencia: "observacao",
    bloqueio: "nao-conformidade",
  };

  return (
    <div className="p-3 sm:p-4 h-full flex flex-col gap-3 overflow-y-auto lg:overflow-hidden">
      <div className="flex items-start sm:items-center justify-between flex-shrink-0 gap-2 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-certifica-900 mb-0.5 text-lg" style={{ fontWeight: 700 }}>Chat Operacional</h2>
          <p className="text-[11px] text-certifica-500 hidden sm:block" style={{ fontWeight: 400 }}>
            Atendimento técnico com SLA, classificação automática e rastreabilidade completa.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {error && (
            <span className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-[4px] px-2 py-1 hidden sm:inline">
              {error}
            </span>
          )}
          <DSBadge variant="conformidade" className="hidden sm:flex">Pronto para Z-API</DSBadge>
          <DSButton variant="outline" size="sm" icon={<Phone className="w-3.5 h-3.5" />}>
            Iniciar ligação
          </DSButton>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[240px_1fr_220px] gap-3 min-h-0 flex-1 lg:overflow-hidden">
        {/* Sidebar */}
        <div className="bg-white border border-certifica-200 rounded-[4px] overflow-hidden flex flex-col min-h-[220px] lg:min-h-0">
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "todos" | AtendimentoStatus)}
                className="h-8 px-2 rounded-[4px] border border-certifica-200 text-[11px]"
              >
                <option value="todos">Todos status</option>
                <option value="aberto">Aberto</option>
                <option value="aguardando_cliente">Aguardando cliente</option>
                <option value="resolvido">Resolvido</option>
              </select>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as "todas" | Risco)}
                className="h-8 px-2 rounded-[4px] border border-certifica-200 text-[11px]"
              >
                <option value="todas">Todo risco</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading && (
              <div className="h-full flex items-center justify-center text-[12px] text-certifica-500 px-3 text-center">
                Carregando conversas...
              </div>
            )}
            {!loading && filteredConversations.length === 0 && (
              <div className="h-full flex items-center justify-center text-[12px] text-certifica-500 px-3 text-center">
                Nenhuma conversa encontrada para os filtros atuais.
              </div>
            )}
            {filteredConversations.map((conversation) => {
              const active = conversation.id === selectedId;
              const unread = unreadCount(conversation.id);
              const timestamp = formatTimestamp(conversation.ultima_mensagem_at);

              return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setSelectedId(conversation.id);
                  }}
                  className={`w-full text-left p-2.5 rounded-[4px] mb-1 border transition-colors ${
                    active ? "bg-certifica-accent-light border-certifica-accent/20" : "bg-white border-transparent hover:bg-certifica-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[12.5px] text-certifica-dark" style={{ fontWeight: 600 }}>
                      {conversation.titulo ?? conversation.cliente_nome ?? "Conversa"}
                    </span>
                    <span className="text-[10px] text-certifica-500">{timestamp}</span>
                  </div>
                  {conversation.cliente_nome ? (
                    <div className="text-[10.5px] text-certifica-500 mb-1">{conversation.cliente_nome}</div>
                  ) : null}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11.5px] text-certifica-500 truncate">
                      {conversation.ultima_mensagem || "Sem mensagens"}
                    </span>
                    {unread > 0 && (
                      <span className="min-w-4 h-4 px-1 rounded-full bg-certifica-accent text-white text-[10px] flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`text-[10px] ${conversation.status === "arquivado" ? "text-certifica-500" : "text-conformidade"}`}>
                      {conversation.status === "arquivado" ? "Arquivado" : "Ativo"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main chat area */}
        <div className="bg-white border border-certifica-200 rounded-[4px] overflow-hidden flex flex-col min-h-[380px] lg:min-h-0">
          {!selectedConversation ? (
            <div className="h-full flex items-center justify-center text-[12px] text-certifica-500 px-6 text-center">
              {loading ? "Carregando..." : "Selecione uma conversa para iniciar o atendimento operacional."}
            </div>
          ) : (
            <>
              <div className="px-3 py-2 border-b border-certifica-200 flex items-center justify-between gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-certifica-accent-light text-certifica-accent-dark flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] text-certifica-dark truncate" style={{ fontWeight: 600 }}>
                      {selectedConversation.titulo ?? selectedConversation.cliente_nome ?? "Conversa"}
                    </div>
                    <div className="text-[10px] text-certifica-500 truncate">
                      {selectedConversation.cliente_nome ?? ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <DSBadge variant={selectedConversation.status === "ativo" ? "conformidade" : "outline"}>
                    {selectedConversation.status === "ativo" ? "Ativo" : "Arquivado"}
                  </DSBadge>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 bg-certifica-50">
                <div className="space-y-2">
                  {selectedMessages.map((message) => {
                    const isConsultor = message.autor === "Consultor";
                    const classif = (message.classificacao ?? "geral") as Classificacao;
                    return (
                      <div key={message.id} className={`flex ${isConsultor ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[74%] px-3 py-2 rounded-[6px] border ${isConsultor ? "bg-certifica-accent text-white border-certifica-accent" : "bg-white text-certifica-dark border-certifica-200"}`}>
                          {!isConsultor && (
                            <div className="text-[10px] mb-1 opacity-70" style={{ fontWeight: 600 }}>{message.autor}</div>
                          )}
                          <p className="text-[12.5px]" style={{ fontWeight: 400 }}>{message.conteudo}</p>
                          {message.arquivo_nome && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[9px] ${isConsultor ? "bg-white/20 text-white" : "bg-certifica-50 border border-certifica-200 text-certifica-500"}`}>
                                <Link2 className="w-2.5 h-2.5" />
                                {message.arquivo_nome}
                              </span>
                            </div>
                          )}
                          <div className={`mt-1 text-[10px] flex items-center gap-2 ${isConsultor ? "text-white/75" : "text-certifica-500"}`}>
                            <span>{formatTimestamp(message.created_at)}</span>
                            <span>•</span>
                            <span>{message.tipo ?? "texto"}</span>
                            <span>•</span>
                            <DSBadge variant={classificacaoBadge[classif]} className="text-[9px] px-1.5 py-0">
                              {classif}
                            </DSBadge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {selectedMessages.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-[12px] text-certifica-500">
                      Nenhuma mensagem ainda. Inicie a conversa abaixo.
                    </div>
                  )}
                </div>
              </div>

              <div className="px-3 py-2 border-t border-certifica-200 bg-white space-y-1.5 flex-shrink-0">
                <div className="bg-certifica-accent-light border border-certifica-accent/20 rounded-[4px] px-2 py-1.5 text-[10px] text-certifica-dark flex items-start gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-certifica-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <span style={{ fontWeight: 600 }}>Análise: {aiLoading ? "…" : aiClassificacao}</span>
                    <span className="text-certifica-500 ml-1">— {aiLoading ? "Analisando…" : (suggestion || "Digite para ver sugestão")}</span>
                  </div>
                </div>

                <div className="flex items-end gap-1.5">
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setNextKind("anexo")}
                      className={`h-8 w-8 rounded-[4px] border flex items-center justify-center ${nextKind === "anexo" ? "border-certifica-accent text-certifica-accent" : "border-certifica-200 text-certifica-500 hover:text-certifica-dark"}`}
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setNextKind("audio")}
                      className={`h-8 w-8 rounded-[4px] border flex items-center justify-center ${nextKind === "audio" ? "border-certifica-accent text-certifica-accent" : "border-certifica-200 text-certifica-500 hover:text-certifica-dark"}`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setNextKind("imagem")}
                      className={`h-8 w-8 rounded-[4px] border flex items-center justify-center ${nextKind === "imagem" ? "border-certifica-accent text-certifica-accent" : "border-certifica-200 text-certifica-500 hover:text-certifica-dark"}`}
                    >
                      <Image className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <textarea
                      rows={1}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Digite uma mensagem..."
                      className="w-full min-h-8 max-h-20 rounded-[4px] border border-certifica-200 bg-certifica-50 px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-certifica-accent/40 resize-none"
                    />
                  </div>
                  <select
                    value={nextLinkType}
                    onChange={(e) => setNextLinkType(e.target.value as LinkType)}
                    className="h-8 px-1.5 rounded-[4px] border border-certifica-200 text-[9px] bg-white flex-shrink-0"
                  >
                    <option value="evidencia">Evidencia</option>
                    <option value="documento">Documento</option>
                    <option value="plano_acao">Plano acao</option>
                  </select>
                  <DSButton
                    size="sm"
                    icon={<Send className="w-3.5 h-3.5" />}
                    onClick={handleSendMessage}
                    className="flex-shrink-0"
                    disabled={sending}
                  >
                    {sending ? "..." : "Enviar"}
                  </DSButton>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right panel */}
        <div className="bg-white border border-certifica-200 rounded-[4px] overflow-hidden flex flex-col min-h-[200px] lg:min-h-0">
          {!selectedConversation ? (
            <div className="h-full flex items-center justify-center text-[12px] text-certifica-500 px-6 text-center">
              Painel operacional indisponivel sem conversa selecionada.
            </div>
          ) : (
            <>
              <div className="px-3 py-2.5 border-b border-certifica-200">
                <span className="text-[12px] text-certifica-900" style={{ fontWeight: 600 }}>Painel operacional</span>
              </div>
              <div className="p-3 space-y-3 overflow-y-auto">
                <div className="border border-certifica-200 rounded-[4px] p-2.5">
                  <div className="text-[10px] uppercase tracking-[0.06em] text-certifica-500 mb-1" style={{ fontWeight: 600 }}>Atendimento</div>
                  <div className="text-[12px] text-certifica-dark mb-1">
                    {selectedConversation.status === "ativo" ? "Ativo" : "Arquivado"}
                  </div>
                  <div className="text-[11px] text-certifica-500">
                    Participantes: {(selectedConversation.participantes ?? []).join(", ") || "Nenhum"}
                  </div>
                </div>

                <div className="border border-certifica-200 rounded-[4px] p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-certifica-500" />
                    <span className="text-[10px] uppercase tracking-[0.06em] text-certifica-500" style={{ fontWeight: 600 }}>Classificação</span>
                  </div>
                  <div className="text-[12px] text-certifica-dark">
                    {draft ? (aiLoading ? "Analisando…" : aiClassificacao) : "Digite uma mensagem para classificar"}
                  </div>
                </div>

                <div className="border border-certifica-200 rounded-[4px] p-2.5">
                  <div className="text-[10px] uppercase tracking-[0.06em] text-certifica-500 mb-1" style={{ fontWeight: 600 }}>Trilha de auditoria</div>
                  <div className="space-y-1.5">
                    {(historyByConversation[selectedConversation.id] ?? []).length === 0 ? (
                      <div className="text-[11px] text-certifica-500">Nenhuma acao registrada ainda.</div>
                    ) : (
                      (historyByConversation[selectedConversation.id] ?? []).map((entry) => (
                        <div key={entry} className="text-[11px] text-certifica-500">{entry}</div>
                      ))
                    )}
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
