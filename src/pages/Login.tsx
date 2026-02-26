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
                onClick={() => navigate('/dashboard')}
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
                onClick={() => navigate('/dashboard')}
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
      <footer className="relative px-6 py-16 border-t border-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <h3 className="text-xl font-medium text-white mb-4">Top Créditos</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Créditos Lovable pelo menor preço do Brasil. Entrega rápida, cashback e suporte 24h.
              </p>
              <div className="flex items-center gap-3">
                <a 
                  href="https://youtube.com/@topcreditos" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a 
                  href="https://instagram.com/topcreditos" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="https://wa.me/5511999999999" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Platform Column */}
            <div>
              <h4 className="text-sm font-medium text-white uppercase tracking-wider mb-4">Plataforma</h4>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Comprar Créditos
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/pedidos')}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Meus Pedidos
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/licencas')}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Licenças
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('leaderboard')}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Ranking
                  </button>
                </li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-sm font-medium text-white uppercase tracking-wider mb-4">Suporte</h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://wa.me/5511999999999" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    WhatsApp
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/ajuda')}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Central de Ajuda
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/academy')}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Academy
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h4 className="text-sm font-medium text-white uppercase tracking-wider mb-4">Contato</h4>
              <ul className="space-y-3">
                <li className="text-sm text-slate-400">
                  <a 
                    href="mailto:contato@topcreditos.com.br"
                    className="hover:text-white transition-colors"
                  >
                    contato@topcreditos.com.br
                  </a>
                </li>
                <li className="text-sm text-slate-400">
                  <a 
                    href="https://wa.me/5511999999999"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    +55 (11) 99999-9999
                  </a>
                </li>
                <li className="text-sm text-slate-400">
                  Atendimento 24/7
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-900">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-600 text-center md:text-left">
                © 2024 Top Créditos. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-6 text-xs text-slate-600">
                <button 
                  onClick={() => navigate('/termos')}
                  className="hover:text-slate-400 transition-colors"
                >
                  Termos de Uso
                </button>
                <span>•</span>
                <button 
                  onClick={() => navigate('/privacidade')}
                  className="hover:text-slate-400 transition-colors"
                >
                  Privacidade
                </button>
                <span>•</span>
                <button 
                  onClick={() => navigate('/cookies')}
                  className="hover:text-slate-400 transition-colors"
                >
                  Cookies
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
