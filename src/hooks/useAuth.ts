import { useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const { data: profile, error: lookupError } = await supabase
      .from('panel_users')
      .select('email')
      .eq('username', username)
      .maybeSingle();

    if (lookupError || !profile) {
      return { error: { message: 'Usuário não encontrado.' } as { message: string } | null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });
    return { data, error };
  }, []);

  const signUp = useCallback(async (username: string, password: string) => {
    const { data: profile, error: lookupError } = await supabase
      .from('panel_users')
      .select('email')
      .eq('username', username)
      .maybeSingle();

    if (lookupError || !profile) {
      return { error: { message: 'Usuário não encontrado.' } as { message: string } | null };
    }

    const { data, error } = await supabase.auth.signUp({
      email: profile.email,
      password,
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { session, user, loading, signIn, signUp, signOut };
}
