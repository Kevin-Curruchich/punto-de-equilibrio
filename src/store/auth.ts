import type { Role, User } from "@/src/types/domain";
import { create } from "zustand";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: User | null;
  role: Role | null;
  firebaseUid: string | null;

  setLoading: () => void;
  setAuthenticated: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  role: null,
  firebaseUid: null,

  setLoading: () => set({ status: "loading" }),

  setAuthenticated: (user) =>
    set({
      status: "authenticated",
      user,
      role: user.role,
      firebaseUid: user.firebaseUid,
    }),

  clearAuth: () =>
    set({
      status: "unauthenticated",
      user: null,
      role: null,
      firebaseUid: null,
    }),
}));
