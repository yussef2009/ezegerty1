import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient, Session, User } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../supabase/info";

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// Enable a dev-only auto-login when running the dev server with `?dev=1`
const devAutoLogin = import.meta.env.DEV && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("dev") === "1";

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

      // When a Google OAuth user signs in and has no role assigned yet,
      // read the intended role from localStorage and sync it to their metadata.
      if (_event === "SIGNED_IN" && currentUser && !currentRole) {
        const pendingRole = localStorage.getItem("oauth_pending_role") ?? "client";
        const pendingName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split("@")[0] || "User";
        localStorage.removeItem("oauth_pending_role");

        // Persist the role and name into Supabase user metadata
        await supabase.auth.updateUser({
          data: { role: pendingRole, name: pendingName },
        });

        currentRole = pendingRole;
      }

      setSession(session);
      setUser(currentUser);
      setRole(currentRole);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async (redirectTo?: string, role: string = "client") => {
    // Store the intended role before leaving the page for OAuth
    localStorage.setItem("oauth_pending_role", role);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo ? `${window.location.origin}${redirectTo}` : `${window.location.origin}/client/dashboard`
      }
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
