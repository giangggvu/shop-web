import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, setToken, setUnauthorizedHandler } from "../api/client";
import type { TokenResponse, User } from "../api/types";

const STORAGE_KEY = "la-hat.auth";

interface StoredSession {
  token: string;
  user: User;
  expiresAt: number;
}

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function writeSession(session: StoredSession | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

const initialSession = readSession();
setToken(initialSession?.token ?? null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);

  const startSession = useCallback((response: TokenResponse) => {
    const session: StoredSession = {
      token: response.accessToken,
      user: response.user,
      expiresAt: Date.now() + response.expiresIn * 1000,
    };
    setToken(session.token);
    writeSession(session);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    writeSession(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      startSession(
        await api<TokenResponse>("/api/auth/login", {
          method: "POST",
          body: { email, password },
        }),
      );
    },
    [startSession],
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      startSession(
        await api<TokenResponse>("/api/auth/register", {
          method: "POST",
          body: { fullName, email, password },
        }),
      );
    },
    [startSession],
  );

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
