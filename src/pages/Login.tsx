import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Shield, Headphones, CheckCircle2 } from 'lucide-react';
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

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }

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
        toast.success(`Verifique seu e-mail (${email}) para acessar`);
      } else {
        const { error } = await login(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Credenciais inválidas.');
          } else {
            throw error;
          }
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToLogin = () => {
    document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const testimonials = [
    {
      name: 'Ana Paula Silva',
      role: 'Designer',
      text: 'Processo extremamente ágil. Créditos disponíveis em menos de um minuto.',
      company: 'Studio Creative'
    },
    {
      name: 'Carlos Eduardo',
      role: 'CTO',
      text: 'Plataforma confiável com excelente nível de segurança e suporte técnico.',
      company: 'TechCorp'
    },
    {
      name: 'Mariana Costa',
      role: 'Founder',
      text: 'Interface intuitiva e transações transparentes. Recomendo profissionalmente.',
      company: 'Digital Ventures'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Subtle Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-slate-800/10 rounded-full blur-[150px]" />
      </div>

      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-48">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <h1 className="text-7xl md:text-8xl font-light tracking-tight text-white">
              Top Créditos
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
              Créditos Lovable com entrega instantânea.<br />
              Segurança empresarial. Suporte dedicado.
            </p>

            <div className="pt-8">
              <Button
                size="lg"
                onClick={scrollToLogin}
                className="h-14 px-10 text-base font-medium bg-white text-black hover:bg-slate-200 rounded-full transition-all duration-300"
              >
                Acessar plataforma
              </Button>
            </div>

            <p className="text-sm text-slate-600 pt-4">
              Mais de 500 transações processadas nas últimas 24 horas
            </p>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="relative px-6 py-32">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-light text-white">
              Plataforma completa para gestão de créditos
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Acesse o dashboard para gerenciar seus créditos Lovable, visualizar histórico de transações e acompanhar seu saldo em tempo real.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative px-6 py-32 border-y border-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 flex items-center justify-center">
                <Zap className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-white">Entrega Instantânea</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Processamento automático em segundos
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-white">Segurança Avançada</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Criptografia de nível empresarial
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-white">Suporte Dedicado</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Atendimento especializado 24/7
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-white">Garantia Total</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Reembolso em caso de insatisfação
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative px-6 py-32">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-light text-white mb-4">
              Depoimentos
            </h2>
          </div>

          <Card className="p-12 bg-slate-950/50 backdrop-blur-sm border-slate-900">
            <div className="text-center space-y-8">
              <p className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed">
                "{testimonials[testimonialIndex].text}"
              </p>

              <div className="pt-6">
                <p className="text-base font-medium text-white">{testimonials[testimonialIndex].name}</p>
                <p className="text-sm text-slate-500">{testimonials[testimonialIndex].role}, {testimonials[testimonialIndex].company}</p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-4">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === testimonialIndex
                        ? 'bg-white w-8'
                        : 'bg-slate-800 w-1.5 hover:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Login Section */}
      <section id="login-section" className="relative px-6 py-32 border-t border-slate-900">
        <div className="container mx-auto max-w-md">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-light text-white mb-2">
              Acessar plataforma
            </h2>
            <p className="text-slate-500">Entre com suas credenciais</p>
          </div>

          <Card className="p-8 bg-slate-950/50 backdrop-blur-sm border-slate-900">
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-slate-400">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="h-12 bg-slate-900/50 border-slate-800 focus:border-slate-700 text-white rounded-lg"
                    required
                  />
                </div>

                {!isMagicLink && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm text-slate-400">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 bg-slate-900/50 border-slate-800 focus:border-slate-700 text-white rounded-lg"
                      required={!isMagicLink}
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-900/50 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-white text-black hover:bg-slate-200 rounded-full font-medium transition-all"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                ) : (
                  isMagicLink ? 'Enviar link de acesso' : 'Continuar'
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-900" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-950 px-3 text-slate-600">ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 text-sm"
                onClick={() => setIsMagicLink(!isMagicLink)}
              >
                {isMagicLink ? 'Usar senha' : 'Acessar sem senha'}
              </Button>
            </form>
          </Card>

          <div className="mt-12 text-center space-y-4">
            <div className="flex items-center justify-center gap-6 text-xs text-slate-600">
              <a href="#" className="hover:text-slate-400 transition-colors">Termos de Uso</a>
              <span>•</span>
              <a href="#" className="hover:text-slate-400 transition-colors">Privacidade</a>
            </div>
            <p className="text-xs text-slate-700">
              © 2024 Top Créditos. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
