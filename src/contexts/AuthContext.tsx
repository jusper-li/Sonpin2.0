import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { Admin } from '../types';
import {
  isMissingSupabaseRpcError,
  isSupabaseAdminAuthEnabled,
  isSupabaseNetworkError,
  supabase,
} from '../lib/supabase';

interface AuthContextType {
  admin: Admin | null;
  requestLoginCode: (email: string) => Promise<void>;
  verifyLoginCode: (email: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LEGACY_ADMIN_STORAGE_KEY = 'admin';
const NETWORK_SENTINEL = '__SUPABASE_NETWORK__';
const ADMIN_SELECT_FIELDS = 'id,email,name,avatar_url,is_active,last_login_at,created_at,updated_at';
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_RATE_LIMIT_COOLDOWN_SECONDS = 600;
const OTP_GLOBAL_COOLDOWN_KEY = 'otp-cooldown:global';
const OTP_REQUEST_GUARD_MS = 12_000;
let otpNextAllowedAt = 0;

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizeToken = (token: string) => token.replace(/\D/g, '').slice(0, 6);
const otpCooldownKey = (email: string) => `otp-cooldown:${normalizeEmail(email)}`;

const getOtpCooldownRemaining = (email: string) => {
  const raw = localStorage.getItem(otpCooldownKey(email));
  if (!raw) return 0;
  const until = Number(raw);
  if (!Number.isFinite(until)) return 0;
  const remaining = Math.ceil((until - Date.now()) / 1000);
  if (remaining <= 0) {
    localStorage.removeItem(otpCooldownKey(email));
    return 0;
  }
  return remaining;
};

const setOtpCooldown = (email: string, seconds: number) => {
  const safe = Math.max(1, Math.floor(seconds));
  localStorage.setItem(otpCooldownKey(email), String(Date.now() + safe * 1000));
  localStorage.setItem(OTP_GLOBAL_COOLDOWN_KEY, String(Date.now() + safe * 1000));
};

const getGlobalOtpCooldownRemaining = () => {
  const raw = localStorage.getItem(OTP_GLOBAL_COOLDOWN_KEY);
  if (!raw) return 0;
  const until = Number(raw);
  if (!Number.isFinite(until)) return 0;
  const remaining = Math.ceil((until - Date.now()) / 1000);
  if (remaining <= 0) {
    localStorage.removeItem(OTP_GLOBAL_COOLDOWN_KEY);
    return 0;
  }
  return remaining;
};

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
    localStorage.removeItem(LEGACY_ADMIN_STORAGE_KEY);

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

  const requestLoginCode = async (email: string) => {
    if (!isSupabaseAdminAuthEnabled) {
      throw new Error('Admin email authentication is not enabled.');
    }

    const now = Date.now();
    const guardRemaining = Math.ceil((otpNextAllowedAt - now) / 1000);
    if (guardRemaining > 0) {
      throw new Error(`RATE_LIMIT:${guardRemaining}`);
    }

    const normalizedEmail = normalizeEmail(email);
    const cooldownRemaining = Math.max(
      getOtpCooldownRemaining(normalizedEmail),
      getGlobalOtpCooldownRemaining()
    );
    if (cooldownRemaining > 0) {
      throw new Error(`RATE_LIMIT:${cooldownRemaining}`);
    }

    otpNextAllowedAt = now + OTP_REQUEST_GUARD_MS;

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      const maybeStatus = (error as { status?: number }).status;
      const message = (error as { message?: string }).message || '';
      if (maybeStatus === 429 || message.toLowerCase().includes('rate limit')) {
        const cooldownSeconds = OTP_RATE_LIMIT_COOLDOWN_SECONDS;
        setOtpCooldown(normalizedEmail, cooldownSeconds);
        otpNextAllowedAt = Date.now() + cooldownSeconds * 1000;
        throw new Error(`RATE_LIMIT:${cooldownSeconds}`);
      }
      if (maybeStatus === 422) {
        otpNextAllowedAt = Date.now() + 30_000;
        throw new Error(`OTP_422:${message || 'unprocessable'}`);
      }
      otpNextAllowedAt = Date.now() + 15_000;
      throw error;
    }

    setOtpCooldown(normalizedEmail, OTP_RESEND_COOLDOWN_SECONDS);
    otpNextAllowedAt = Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000;
  };

  const verifyLoginCode = async (email: string, token: string) => {
    if (!isSupabaseAdminAuthEnabled) {
      throw new Error('Admin email authentication is not enabled.');
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedToken = normalizeToken(token);

    if (normalizedToken.length !== 6) {
      throw new Error('請輸入 6 位數驗證碼。');
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedToken,
      type: 'email',
    });

    if (error) {
      clearLegacyAuthState();
      throw error;
    }

    const user = data.user || data.session?.user;
    if (!user) {
      clearLegacyAuthState();
      throw new Error('驗證完成，但沒有取得登入狀態。請重新寄送驗證碼。');
    }

    let adminData: Admin | null = null;
    try {
      adminData = await loadAdminForUser(user);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.message === NETWORK_SENTINEL) {
        throw new Error('Network temporarily unavailable, please try again.');
      }
      throw loadError;
    }
    if (!adminData) {
      clearLegacyAuthState();
      await supabase.auth.signOut({ scope: 'local' });
      throw new Error('此信箱沒有後台管理權限。');
    }

    setAdmin(adminData);
  };

  const logout = async () => {
    setAdmin(null);
    clearLegacyAuthState();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ admin, requestLoginCode, verifyLoginCode, logout, isLoading }}>
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
