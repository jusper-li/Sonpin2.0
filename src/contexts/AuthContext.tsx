import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { Admin } from '../types';
import {
  isMissingSupabaseRpcError,
  isSupabaseNetworkError,
  supabase,
} from '../lib/supabase';

interface AuthContextType {
  admin: Admin | null;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LEGACY_ADMIN_STORAGE_KEY = 'admin';
const NETWORK_SENTINEL = '__SUPABASE_NETWORK__';
const ADMIN_SELECT_FIELDS = 'id,email,name,avatar_url,is_active,last_login_at,created_at,updated_at';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const clearLegacyAuthState = () => {
  localStorage.removeItem(LEGACY_ADMIN_STORAGE_KEY);
};

const toAdminData = (adminRecord: any): Admin => ({
  id: adminRecord.id,
  email: adminRecord.email,
  name: adminRecord.name,
  avatar_url: adminRecord.avatar_url,
  is_active: adminRecord.is_active,
  created_at: adminRecord.created_at,
  updated_at: adminRecord.updated_at,
  last_login_at: adminRecord.last_login_at,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    clearLegacyAuthState();

    let mounted = true;

    const syncSession = async (session: Session | null) => {
      if (!mounted) return;
      setIsLoading(true);

      try {
        if (!session?.user) {
          setAdmin(null);
          return;
        }

        const { data: authUserData, error: authUserError } = await supabase.auth.getUser();
        if (authUserError || !authUserData?.user) {
          setAdmin(null);
          clearLegacyAuthState();
          return;
        }

        let adminData: Admin | null = null;
        try {
          adminData = await loadAdminForUser(authUserData.user);
        } catch (error) {
          if (error instanceof Error && error.message === NETWORK_SENTINEL) {
            return;
          }
          throw error;
        }

        if (!mounted) return;

        if (!adminData) {
          setAdmin(null);
          await supabase.auth.signOut();
          return;
        }

        setAdmin(adminData);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          clearLegacyAuthState();
          setAdmin(null);
          setIsLoading(false);
          return;
        }

        void syncSession(data.session);
      })
      .catch(() => {
        clearLegacyAuthState();
        setAdmin(null);
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadAdminForUser = async (user: User) => {
    const email = normalizeEmail(user.email || '');
    if (!email) return null;

    const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_admin_profile');
    if (!rpcError && rpcData) {
      return toAdminData(rpcData);
    }

    if (rpcError && !isMissingSupabaseRpcError(rpcError)) {
      if (isSupabaseNetworkError(rpcError)) {
        throw new Error(NETWORK_SENTINEL);
      }
      const status = (rpcError as { status?: number }).status;
      if (status === 401 || status === 403) return null;
    }

    const { data, error } = await supabase
      .from('admins')
      .select(ADMIN_SELECT_FIELDS)
      .ilike('email', email)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      if (isSupabaseNetworkError(error)) {
        throw new Error(NETWORK_SENTINEL);
      }
      const status = (error as { status?: number }).status;
      if (status === 401 || status === 403) return null;
      return null;
    }

    if (data) {
      return toAdminData(data);
    }

    return null;
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password.trim()) {
      throw new Error('請輸入帳號與密碼。');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      const code = String((error as { code?: string }).code || '').toLowerCase();
      const message = String((error as { message?: string }).message || '');

      if (code === 'invalid_credentials' || message.toLowerCase().includes('invalid login credentials')) {
        throw new Error('帳號或密碼錯誤。');
      }
      if (message.includes('Email not confirmed')) {
        throw new Error('這個帳號尚未完成信箱驗證。');
      }
      if (isSupabaseNetworkError(error)) {
        throw new Error('網路連線異常，請稍後再試。');
      }
      throw error;
    }
  };

  const logout = async () => {
    setAdmin(null);
    clearLegacyAuthState();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ admin, signIn, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
