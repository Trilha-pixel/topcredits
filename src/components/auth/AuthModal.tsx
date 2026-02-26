import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type AuthMode = 'login' | 'signup';

const AuthModal = ({ open, onOpenChange, onSuccess }: AuthModalProps) => {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await login(email, password);
      
      if (error) {
        toast.error('Erro ao fazer login', {
          description: error.message === 'Invalid login credentials' 
            ? 'Email ou senha incorretos' 
            : error.message
        });
        return;
      }

      toast.success('Login realizado com sucesso!');
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setEmail('');
      setPassword('');
    } catch (error: any) {
      toast.error('Erro inesperado', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone
          }
        }
      });

      if (authError) {
        toast.error('Erro ao criar conta', {
          description: authError.message
        });
        return;
      }

      if (!authData.user) {
        toast.error('Erro ao criar conta');
        return;
      }

      // 2. Create profile (trigger should handle this, but we can ensure)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          role: 'customer'
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      // 3. Create wallet (trigger should handle this too)
      const { error: walletError } = await supabase
        .from('wallets')
        .upsert({
          user_id: authData.user.id,
          balance: 0
        });

      if (walletError) {
        console.error('Error creating wallet:', walletError);
      }

      toast.success('Conta criada com sucesso!', {
        description: 'Você já pode fazer login'
      });

      // Switch to login mode
      setMode('login');
      setPassword('');
      setFullName('');
      setPhone('');
      
    } catch (error: any) {
      toast.error('Erro inesperado', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-white">
            {mode === 'login' ? 'Entrar na sua conta' : 'Criar conta'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === 'login' 
              ? 'Entre para acessar seus pedidos e comprar créditos' 
              : 'Crie sua conta para começar a comprar créditos Lovable'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4 mt-4">
          {mode === 'signup' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">Telefone (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-950 border-slate-800 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-slate-950 border-slate-800 text-white"
            />
            {mode === 'signup' && (
              <p className="text-xs text-slate-500">Mínimo de 6 caracteres</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-white text-black hover:bg-slate-200 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'login' ? 'Entrando...' : 'Criando conta...'}
              </>
            ) : (
              mode === 'login' ? 'Entrar' : 'Criar Conta'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            {mode === 'login' ? (
              <>Não tem conta? <span className="font-medium">Criar conta</span></>
            ) : (
              <>Já tem conta? <span className="font-medium">Fazer login</span></>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
