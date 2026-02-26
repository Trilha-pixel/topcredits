import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in or if magic link hash is present
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }

    // Check for hash parameters from Magic Link
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin + '/dashboard',
          },
        });
        if (error) throw error;
        toast.success(`Check seu e-mail (${email}) para o link de acesso!`);
      } else {
        const { error } = await login(email, password);
        if (error) {
          // Se falhar login por senha, sugere magic link
          if (error.message.includes('Invalid login credentials')) {
            setError('Senha incorreta.');
          } else {
            throw error;
          }
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Fallback amigável
      if (err.message.includes('plataform')) {
        setError('Erro na plataforma.');
      } else {
        setError(err.message || 'Erro ao tentar entrar.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Glossy Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md space-y-8 z-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter text-foreground bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Top Credits
          </h1>
          <p className="text-sm text-muted-foreground">
            {isMagicLink ? 'Receba um link de acesso por e-mail' : 'Acesse sua conta de revendedor'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 space-y-6 shadow-2xl">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground ml-1">E-MAIL</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10 bg-white/5 border-white/10 h-11 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  required
                />
              </div>
            </div>

            {!isMagicLink && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground ml-1">SENHA</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-white/5 border-white/10 h-11 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    required={!isMagicLink}
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                {isMagicLink ? 'Enviar Link de Acesso' : 'Entrar na Plataforma'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black/40 backdrop-blur-xl px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-white"
            onClick={() => setIsMagicLink(!isMagicLink)}
          >
            {isMagicLink ? 'Usar senha' : 'Entrar sem senha (Magic Link)'}
          </Button>

        </form>
      </div>
    </div>
  );
};

export default Login;
