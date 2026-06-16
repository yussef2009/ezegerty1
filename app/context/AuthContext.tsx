/// <reference types="vite/client" />
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient, Session, User } from "@supabase/supabase-js";
import { clearStaffPortal } from "../lib/staffAccess";
import { projectId, publicAnonKey } from "../../supabase/info";

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Enable a dev-only auto-login when running the dev server with `?dev=1`
const devAutoLogin = import.meta.env.DEV && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("dev") === "1";

export const AUTH_PORTAL_KEY = "auth_portal";
/** JSON: { role: string, portal: "admin" | "client" } — portal that started OAuth */
export const OAUTH_PENDING_KEY = "oauth_pending";

type OAuthPending = { role: string; portal: "admin" | "client" };

function getOAuthPending(): OAuthPending | null {
  const raw = sessionStorage.getItem(OAUTH_PENDING_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OAuthPending;
    if (parsed?.role && (parsed.portal === "admin" || parsed.portal === "client")) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function setOAuthPending(role: string, portal: "admin" | "client") {
  sessionStorage.setItem(OAUTH_PENDING_KEY, JSON.stringify({ role, portal }));
}

function clearOAuthPending() {
  sessionStorage.removeItem(OAUTH_PENDING_KEY);
}

function getAdminEmails(): string[] {
  const raw = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;
  if (!raw?.trim()) return [];
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/** OAuth pending role is only honored when it matches the portal that started OAuth. */
function getPendingRoleForPortal(
  portal: string | null,
  pendingRole: string | null
): string | null {
  if (!portal || !pendingRole) return null;
  if (portal === "admin") {
    return pendingRole === "admin" || pendingRole === "delivery" ? pendingRole : null;
  }
  if (portal === "client") {
    return pendingRole === "client" ? pendingRole : null;
  }
  return null;
}

function resolveRoleForPortal(
  currentRole: string | null,
  portal: string | null,
  pendingRole: string | null,
  email: string | undefined
): string | null {
  const portalPendingRole = getPendingRoleForPortal(portal, pendingRole);

  if (portal === "admin") {
    if (currentRole === "admin" || currentRole === "delivery") return currentRole;
    if (portalPendingRole) return portalPendingRole;
    if (isAdminEmail(email)) return "admin";
    return currentRole;
  }
  if (portal === "client") {
    // Client login never grants admin/delivery (even if email is on allowlist)
    return "client";
  }
  if (!currentRole && portalPendingRole) return portalPendingRole;
  return currentRole;
}

/**
 * Call when entering a login page.
 * Clears OAuth intent only if it was started on this same portal (abandoned flow).
 * Preserves cross-portal OAuth intent so a late callback still gets the correct role.
 */
export function prepareAuthPortal(portal: "admin" | "client") {
  sessionStorage.setItem(AUTH_PORTAL_KEY, portal);
  const pending = getOAuthPending();
  if (pending?.portal === portal) {
    clearOAuthPending();
  }
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: (redirectTo?: string, role?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, role: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (devAutoLogin) {
      const mockUser = {
        id: "dev-admin",
        email: "admin@dev.local",
        user_metadata: { role: "admin", name: "Dev Admin" },
      } as unknown as User;
      setSession(null);
      setUser(mockUser);
      setRole("admin");
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(session?.user?.user_metadata?.role ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      let currentRole = currentUser?.user_metadata?.role ?? null;

      if (_event === "SIGNED_IN" && currentUser) {
        const oauthPending = getOAuthPending();
        const portal = oauthPending?.portal ?? sessionStorage.getItem(AUTH_PORTAL_KEY);
        const rawPendingRole = oauthPending?.role ?? null;
        const pendingRole = getPendingRoleForPortal(portal, rawPendingRole);
        let targetRole = resolveRoleForPortal(
          currentRole,
          portal,
          rawPendingRole,
          currentUser.email
        );
        if (portal === "client") {
          targetRole = "client";
        }
        const pendingName =
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          currentUser.email?.split("@")[0] ||
          "User";

        clearOAuthPending();

        if (targetRole && targetRole !== currentRole) {
          try {
            const { data, error } = await supabase.auth.updateUser({
              data: { role: targetRole, name: pendingName },
            });
            if (error) {
              console.error("Error updating user role:", error);
            } else if (data.user) {
              currentRole = data.user.user_metadata?.role ?? targetRole;
              currentUser.user_metadata = data.user.user_metadata;
            } else {
              currentRole = targetRole;
            }
          } catch (error) {
            console.error("Error updating user role:", error);
          }
        } else if (!currentRole && pendingRole) {
          try {
            const { data, error } = await supabase.auth.updateUser({
              data: { role: pendingRole, name: pendingName },
            });
            if (!error && data.user) {
              currentRole = data.user.user_metadata?.role ?? pendingRole;
            } else {
              currentRole = pendingRole;
            }
          } catch (error) {
            console.error("Error updating user role:", error);
          }
        }
      }

      setSession(session);
      setUser(currentUser);
      setRole(currentRole);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const portal = sessionStorage.getItem(AUTH_PORTAL_KEY) as "admin" | "client" | null;
    const pending = getOAuthPending();
    if (pending && portal && pending.portal === portal) {
      clearOAuthPending();
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      const currentRole = data.user.user_metadata?.role ?? null;
      let targetRole = resolveRoleForPortal(
        currentRole,
        portal,
        null,
        data.user.email
      );
      if (portal === "client") {
        targetRole = "client";
      }

      if (targetRole && targetRole !== currentRole) {
        const name =
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "User";
        const { data: updated, error: updateError } = await supabase.auth.updateUser({
          data: { role: targetRole, name },
        });
        if (!updateError && updated.user) {
          setUser(updated.user);
          setRole(updated.user.user_metadata?.role ?? targetRole);
          setSession(data.session);
          return { error: null };
        }
      }

      setSession(data.session);
      setUser(data.user);
      setRole(data.user.user_metadata?.role ?? null);
    }

    return { error };
  };

  function getOrigin(): string {
    if (import.meta.env.VITE_SITE_URL) {
      return import.meta.env.VITE_SITE_URL;
    }
    return typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  }

  const signInWithGoogle = async (redirectTo?: string, role: string = "client") => {
    const portal =
      (sessionStorage.getItem(AUTH_PORTAL_KEY) as "admin" | "client" | null) ?? "client";
    setOAuthPending(role, portal);

    const origin = getOrigin();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo ? `${origin}${redirectTo}` : `${origin}/client/dashboard`,
      },
    });
    return { error };
  };

  const signUp = async (email: string, password: string, role: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          name,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    clearStaffPortal();
    if (devAutoLogin) {
      setSession(null);
      setUser(null);
      setRole(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signIn, signInWithGoogle, signUp, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { supabase };
