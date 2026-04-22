import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  hydrated: boolean;
  setUserAuthenticated: (user: User) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  setHydrated: (hydrated: boolean) => void;
}

type PersistedAuthState = Pick<AuthState, "isAuthenticated" | "user">;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      isAuthenticated: false,
      user: null,
      loading: true,
      hydrated: false,
      setUserAuthenticated: (user) => set({ user, isAuthenticated: true }),
      setLoading: (loading) => set({ loading }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist stable auth fields, not transient loading
      partialize: (state: AuthState): PersistedAuthState => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) return;
        // Mark store as hydrated so consumers can avoid spinners on reload
        state?.setHydrated(true);
      },
    }
  )
);


