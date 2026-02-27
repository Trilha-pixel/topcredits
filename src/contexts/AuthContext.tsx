
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile } from '@/types';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: Profile | null;
  session: Session | null;
  balance: number;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfileAndWallet(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfileAndWallet(session.user.id);
      } else {
        setUser(null);
        setBalance(0);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfileAndWallet = async (userId: string) => {
    console.log('👤 Buscando perfil e carteira para:', userId);
    
    try {
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
          fullError: profileError
        });
      } else {
        console.log('✅ Perfil carregado:', profileData);
        setUser(profileData as Profile);
      }

      // Fetch Wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar carteira:', walletError);
      } else {
        console.log('✅ Carteira carregada:', walletData);
      }

      setBalance(walletData?.balance ?? 0);

    } catch (error) {
      console.error('❌ Erro inesperado ao buscar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔑 AuthContext.login chamado', { email });
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('🔑 Resultado do signInWithPassword:', { error });
    
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setBalance(0);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, balance, login, logout, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
