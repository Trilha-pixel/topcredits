import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap, Shield, Headphones, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
      {/* Sticky Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/80 backdrop-blur-lg border-b border-slate-900/50' : 'bg-transparent'
      }`}>
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button 
              onClick={() => scrollToSection('hero')}
              className="text-lg font-medium text-white hover:text-slate-300 transition-colors"
            >
              Top Créditos
            </button>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Início
              </button>
              <button
                onClick={() => scrollToSection('pacotes')}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Pacotes
              </button>
              <button
                onClick={() => scrollToSection('leaderboard')}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Leaderboard
              </button>
              <button
                onClick={() => navigate('/ajuda')}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Suporte
              </button>
            </div>

            {/* CTA Button */}
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="text-sm text-slate-400 hover:text-white hover:bg-slate-900/50"
            >
              Minha Conta
            </Button>
          </div>
        </div>
      </nav>

      {/* Subtle Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-slate-800/10 rounded-full blur-[150px]" />
      </div>

      {/* Hero Section */}
      <section id="hero" className="relative px-6 pt-32 pb-48">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <div className="inline-block px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800 mb-4">
              <p className="text-sm text-slate-400">Créditos Lovable Oficiais</p>
            </div>
            
            <h1 className="text-7xl md:text-8xl font-light tracking-tight text-white">
              Top Créditos
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
              Compre créditos Lovable com entrega instantânea.<br />
              A forma mais rápida e segura de adquirir seus créditos.
            </p>

            <div className="pt-8">
              <Button
                size="lg"
                onClick={() => scrollToSection('pacotes')}
                className="h-14 px-10 text-base font-medium bg-white text-black hover:bg-slate-200 rounded-full transition-all duration-300"
              >
                Ver Pacotes de Créditos
              </Button>
            </div>

            <p className="text-sm text-slate-600 pt-4">
              Mais de 500 créditos Lovable vendidos nas últimas 24 horas
            </p>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="relative px-6 py-32">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-light text-white">
              Créditos Lovable direto na sua conta
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Escolha seu pacote, efetue o pagamento e receba seus créditos Lovable automaticamente em segundos. Simples, rápido e seguro.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="pacotes" className="relative px-6 py-32 border-y border-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Por que comprar créditos Lovable aqui?
            </h2>
            <p className="text-lg text-slate-400">
              A melhor experiência de compra de créditos Lovable
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-12">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 flex items-center justify-center">
                <Zap className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-white">Entrega Instantânea</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Créditos Lovable na sua conta em segundos após o pagamento
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-white">100% Seguro</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Transações protegidas com criptografia de nível bancário
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-white">Suporte 24/7</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Atendimento especializado para suas compras de créditos
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-white">Garantia Total</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Seus créditos Lovable garantidos ou seu dinheiro de volta
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="leaderboard" className="relative px-6 py-32">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-light text-white mb-4">
              Clientes satisfeitos
            </h2>
            <p className="text-lg text-slate-400">
              Veja o que nossos clientes dizem sobre comprar créditos Lovable conosco
            </p>
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

      {/* CTA Section */}
      <section className="relative px-6 py-32 border-t border-slate-900">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Pronto para comprar seus créditos Lovable?
          </h2>
          <p className="text-lg text-slate-400 mb-12">
            Escolha seu pacote e receba seus créditos instantaneamente. Processo simples e 100% seguro.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="h-14 px-10 text-base font-medium bg-white text-black hover:bg-slate-200 rounded-full transition-all duration-300"
          >
            Comprar Créditos Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 py-12 border-t border-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4">
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
      </footer>
    </div>
  );
};

export default Login;
