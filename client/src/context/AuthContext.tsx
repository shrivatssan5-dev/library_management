import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, type Librarian } from '../api/client';

interface AuthContextValue {
  librarian: Librarian | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [librarian, setLibrarian] = useState<Librarian | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .me()
      .then(({ librarian }) => setLibrarian(librarian))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, librarian } = await api.login(email, password);
    localStorage.setItem('token', token);
    setLibrarian(librarian);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setLibrarian(null);
  }, []);

  return (
    <AuthContext.Provider value={{ librarian, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
