import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./supabase";

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  role_id: string;
  avatar_url: string | null;
  role_nome?: string;
  permissoes?: Record<string, boolean>;
}

const ROUTE_PERMISSIONS: Record<string, string> = {
  "/": "dashboard",
  "/reunioes": "reunioes",
  "/chat": "chat",
  "/clientes": "clientes",
  "/projetos": "projetos",
  "/projetos/pipeline": "pipeline",
  "/documentos": "documentos",
  "/auditorias": "auditorias",
  "/auditorias/rai": "auditorias",
  "/normas": "normas",
  "/treinamentos": "treinamentos",
  "/relatorios": "relatorios",
  "/configuracoes": "configuracoes",
};

const STORAGE_KEY = "certifica_user_profile";

export function useRBAC() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*, roles(nome, permissoes)")
          .eq("user_id", user.id)
          .single();

        if (profileData) {
          const p: UserProfile = {
            id: profileData.id,
            nome: profileData.nome,
            email: profileData.email,
            role_id: profileData.role_id,
            avatar_url: profileData.avatar_url,
            role_nome: (profileData as any).roles?.nome,
            permissoes: (profileData as any).roles?.permissoes as Record<string, boolean> ?? {},
          };
          setProfile(p);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
          setLoading(false);
          return;
        }
      }

      const defaultProfile: UserProfile = {
        id: "local",
        nome: "Carlos Silva",
        email: "carlos@certifica.com",
        role_id: "admin",
        avatar_url: null,
        role_nome: "Administrador",
        permissoes: {},
      };
      setProfile(defaultProfile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfile));
    } catch {
      const fallback: UserProfile = {
        id: "local",
        nome: "Carlos Silva",
        email: "carlos@certifica.com",
        role_id: "admin",
        avatar_url: null,
        role_nome: "Administrador",
        permissoes: {},
      };
      setProfile(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const canAccess = useCallback(
    (path: string): boolean => {
      if (!profile) return false;
      if (profile.role_nome === "Administrador" || profile.role_id === "admin") return true;
      if (!profile.permissoes || Object.keys(profile.permissoes).length === 0) return true;

      const perm = ROUTE_PERMISSIONS[path];
      if (!perm) return true;
      return profile.permissoes[perm] !== false;
    },
    [profile]
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // no active session
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("certifica_last_route");
    setProfile(null);
    window.location.href = "/";
  }, []);

  const initials = useMemo(() => {
    if (!profile?.nome) return "??";
    return profile.nome
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }, [profile]);

  return { profile, loading, canAccess, logout, initials, refresh: fetchProfile };
}
