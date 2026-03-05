import React from "react";
import { useLocation } from "react-router";

const routeNames: Record<string, string> = {
  "/clientes": "Clientes",
  "/projetos": "Projetos",
  "/projetos/pipeline": "Pipeline",
  "/normas": "Normas & Certificacoes",
  "/normas/iso9001": "ISO 9001",
  "/normas/iso14001": "ISO 14001",
  "/normas/iso45001": "ISO 45001",
  "/auditorias": "Auditorias",
  "/treinamentos": "Treinamentos",
  "/esg": "ESG",
  "/documentos": "Documentos",
  "/relatorios": "Relatorios",
  "/configuracoes": "Configuracoes",
};

export default function PlaceholderPage() {
  const location = useLocation();
  const name = routeNames[location.pathname] || "Pagina";

  return (
    <div className="p-5">
      <h2 className="text-certifica-900 mb-1">{name}</h2>
      <p className="text-[12px] text-certifica-500" style={{ fontWeight: 400 }}>
        Em desenvolvimento.
      </p>
      <div className="mt-6 border border-dashed border-certifica-200 rounded-[4px] h-[200px]" />
    </div>
  );
}
