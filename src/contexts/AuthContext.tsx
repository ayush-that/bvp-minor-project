import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { supabase } from "@/utils/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useAuthStore, type User } from "./useAuthStore";
import { MOCK_USER } from "@/utils/mockUser";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const dbCheckPromiseByUserId: Partial<Record<string, Promise<void>>> = {};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isMountedRef = useRef(true);
  const {
    isAuthenticated,
    user,
    loading,
    setUserAuthenticated,
    setLoading,
    clearAuth,
    hydrated,
  } = useAuthStore();

  useEffect(() => {
    isMountedRef.current = true;
    // Validate session on mount to avoid stale persisted auth
    const abortController = new AbortController();

    const validateSession = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // Set auth state immediately from current session
          setUserAuthenticated(mapSupabaseUser(session.user));
          // Ensure user exists without blocking UI
          void ensureUserExistsInDatabase(session.user).catch(() => {});
        } else {
          // Default to local mock user for zero-login local execution
          setUserAuthenticated(MOCK_USER);
        }
      } catch (error) {
        // Default to local mock user for offline / local mode
        setUserAuthenticated(MOCK_USER);
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };

    validateSession();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMountedRef.current) return;
      try {
        if (session?.user) {
          setUserAuthenticated(mapSupabaseUser(session.user));
          // Ensure presence in DB on any sign-in/refresh
          if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "USER_UPDATED"
          ) {
            void ensureUserExistsInDatabase(session.user).catch((err) => {
              console.error("User DB verification failed", err);
            });
          }
        } else if (event === "SIGNED_OUT") {
          clearAuth();
        }
      } catch (err) {
        console.error("Auth state change handler error", err);
      }
    });

    return () => {
      isMountedRef.current = false;
      data.subscription.unsubscribe();
      abortController.abort();
    };
  }, [setLoading, setUserAuthenticated, clearAuth]);

  // Post-auth client redirect to intended page
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const key = "postAuthRedirect";
      const url = new URL(window.location.href);
      const qpRedirect = url.searchParams.get("redirectTo");
      const ssRedirect = sessionStorage.getItem(key);
      const target = qpRedirect || ssRedirect;
      if (target) {
        // clean up both storages to avoid loops
        try {
          sessionStorage.removeItem(key);
        } catch {}
        if (qpRedirect) {
          url.searchParams.delete("redirectTo");
          window.history.replaceState({}, "", url.toString());
        }
        // allow localhost URLs for development
        const isLocalhost = target.includes("localhost");
        const isAbsolute = /^(https?:)?\/\//i.test(target);
        const safeTarget = isAbsolute && !isLocalhost ? "/app" : target;
        window.location.assign(safeTarget || "/app");
      }
    } catch {}
  }, [isAuthenticated]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:5173/app",
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      clearAuth();
      window.location.href = "http://localhost:5173/";
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated,
      user,
      signInWithGoogle,
      logout,
      loading: !hydrated ? true : loading,
    }),
    [isAuthenticated, user, loading, hydrated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name:
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split("@")[0] ||
      "",
    avatar_url: supabaseUser.user_metadata?.avatar_url,
  };
}

async function ensureUserExistsInDatabase(supabaseUser: SupabaseUser) {
  const userId = supabaseUser.id;
  if (dbCheckPromiseByUserId[userId]) return dbCheckPromiseByUserId[userId]!;

  const promise = (async () => {
    try {
      const userData = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        first_name: supabaseUser.user_metadata?.given_name || null,
        last_name: supabaseUser.user_metadata?.family_name || null,
        google_id: supabaseUser.user_metadata?.provider_id || supabaseUser.id,
        avatar_url: supabaseUser.user_metadata?.avatar_url || null,
        paid: false,
        profile_views: 0,
      };
      const { error } = await supabase
        .from("users")
        .upsert(userData, { onConflict: "id" });
      if (error) throw error;
    } catch (error) {
      delete dbCheckPromiseByUserId[userId];
      throw error;
    }
  })();

  dbCheckPromiseByUserId[userId] = promise;
  return promise;
}
