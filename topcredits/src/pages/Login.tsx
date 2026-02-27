import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Shield, Headphones, CheckCircle2, ArrowRight } from 'lucide-react';

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

  const proofImages = [
    { src: '/testimonials/t1.jpeg', alt: 'Comprovante 1' },
    { src: '/testimonials/t2.jpeg', alt: 'Comprovante 2' },
    { src: '/testimonials/t3.jpeg', alt: 'Comprovante 3' },
    { src: '/testimonials/t4.jpeg', alt: 'Comprovante 4' },
    { src: '/testimonials/t5.jpeg', alt: 'Comprovante 5' },
    { src: '/testimonials/t6.jpeg', alt: 'Comprovante 6' }
  ];

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
    <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans selection:bg-white/30">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-black to-black" />
        <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-white/[0.02] to-transparent" />
      </div>

      {/* Sticky Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-black/60 backdrop-blur-2xl border-b border-white/5 py-4' : 'bg-transparent py-6'
      }`}>
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button 
              onClick={() => scrollToSection('hero')}
              className="text-xl font-bold tracking-tighter text-white hover:opacity-80 transition-opacity"
            >
              Top Créditos.
            </button>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-10">
              {['Início', 'Pacotes', 'Leaderboard', 'Suporte'].map((item) => (
                <button
                  key={item}
                  onClick={() => item === 'Pacotes' ? navigate('/dashboard') : item === 'Suporte' ? navigate('/ajuda') : scrollToSection(item.toLowerCase())}
                  className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-full bg-white/10 hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-md"
            >
              Minha Conta
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section id="hero" className="relative px-6 pt-40 pb-32 md:pt-52 md:pb-40 flex flex-col items-center justify-center text-center min-h-[90vh]">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-neutral-300 tracking-wide uppercase">Créditos Lovable Oficiais</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500 mb-8 pb-2">
              Top Créditos
            </h1>
            
            <p className="text-lg md:text-2xl text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed mb-12">
              A forma mais minimalista e segura de adquirir seus créditos. <br className="hidden md:block" />
              Entrega instantânea na sua conta.
            </p>

            <button
              onClick={() => navigate('/dashboard')}
              className="group relative inline-flex items-center justify-center gap-3 h-14 px-10 text-base font-semibold bg-white text-black rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Ver Pacotes de Créditos</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-neutral-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            </button>

            <p className="text-sm text-neutral-600 mt-8 font-medium">
              Mais de 500 créditos vendidos hoje
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="pacotes" className="relative px-6 py-32 border-t border-white/5 bg-gradient-to-b from-black to-neutral-950">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                A melhor experiência
              </h2>
              <p className="text-xl text-neutral-400 font-light">
                Por que escolher a Top Créditos?
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: Zap, title: 'Instantâneo', desc: 'Créditos na sua conta em segundos após o pagamento.' },
                { icon: Shield, title: '100% Seguro', desc: 'Criptografia de nível bancário em todas as transações.' },
                { icon: Headphones, title: 'Suporte 24/7', desc: 'Atendimento premium e especializado sempre disponível.' },
                { icon: CheckCircle2, title: 'Garantia Total', desc: 'Satisfação garantida ou seu dinheiro de volta integralmente.' }
              ].map((feature, idx) => (
                <div key={idx} className="group p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-500 hover:-translate-y-2">
                  <div className="w-14 h-14 mb-8 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white text-white group-hover:text-black transition-all duration-500">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials & Proofs */}
        <section id="leaderboard" className="relative px-6 py-32 border-t border-white/5 bg-gradient-to-b from-neutral-950 to-black overflow-hidden">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-20 relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                A Prova Social
              </h2>
              <p className="text-xl text-neutral-400 font-light">
                Quem usa, aprova. Veja os últimos comprovantes reais da nossa comunidade.
              </p>
            </div>

            {/* Gamified Proofs Gallery */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-32 relative z-10">
              {proofImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`group relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 transition-all duration-500 hover:z-20 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] ${
                    idx % 2 === 0 ? 'translate-y-4 md:translate-y-8' : '-translate-y-4 md:-translate-y-8'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <img 
                    src={img.src} 
                    alt={img.alt} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110 filter saturate-[0.8] group-hover:saturate-100"
                  />
                  <div className="absolute bottom-4 left-4 right-4 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      Entrega Confirmada
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Text Testimonials */}
            <div className="relative p-12 md:p-20 rounded-[3rem] bg-white/[0.02] border border-white/10 overflow-hidden mt-24">
              {/* Decorative blur */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="relative z-10 text-center space-y-12">
                <p className="text-2xl md:text-4xl text-neutral-200 font-light leading-snug tracking-tight">
                  "{testimonials[testimonialIndex].text}"
                </p>

                <div>
                  <p className="text-lg font-semibold text-white">{testimonials[testimonialIndex].name}</p>
                  <p className="text-sm text-neutral-500 font-medium tracking-wide mt-1">{testimonials[testimonialIndex].role} • {testimonials[testimonialIndex].company}</p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTestimonialIndex(i)}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        i === testimonialIndex
                          ? 'bg-white w-10'
                          : 'bg-white/20 w-2 hover:bg-white/40'
                      }`}
                      aria-label={`Ver depoimento ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative px-6 py-40 border-t border-white/5 overflow-hidden">
          {/* Background glow for CTA */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/[0.03] rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 container mx-auto max-w-3xl text-center">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8">
              Pronto para evoluir?
            </h2>
            <p className="text-xl text-neutral-400 mb-14 font-light max-w-xl mx-auto">
              Adquira seus créditos agora e tenha acesso imediato a todos os recursos.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center h-16 px-12 text-lg font-semibold bg-white text-black rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              Comprar Créditos Agora
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative px-6 py-20 border-t border-white/10 bg-neutral-950">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
            {/* Brand Column */}
            <div className="md:col-span-5 pr-8">
              <h3 className="text-2xl font-bold tracking-tighter text-white mb-6">Top Créditos.</h3>
              <p className="text-neutral-400 font-light leading-relaxed mb-8 max-w-sm">
                A experiência mais premium e minimalista para compra de créditos Lovable do Brasil. Rápido, seguro e focado em você.
              </p>
              <div className="flex items-center gap-4">
                {[
                  { icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, url: "https://youtube.com/@realfelipetop" },
                  { icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>, url: "https://instagram.com/realfelipetop" }
                ].map((social, idx) => (
                  <a 
                    key={idx}
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Plataforma</h4>
              <ul className="space-y-4">
                {['Comprar Créditos', 'Meus Pedidos', 'Licenças', 'Ranking'].map((link) => (
                  <li key={link}>
                    <button onClick={() => navigate('/dashboard')} className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Suporte</h4>
              <ul className="space-y-4">
                {['WhatsApp', 'Central de Ajuda', 'Academy'].map((link) => (
                  <li key={link}>
                    <button onClick={() => navigate('/ajuda')} className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Contato</h4>
              <ul className="space-y-4">
                <li><a href="mailto:contato@topcreditos.com.br" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">contato@topcreditos.com.br</a></li>
                <li><a href="https://wa.me/5511999999999" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">+55 (11) 99999-9999</a></li>
                <li className="text-neutral-500 text-sm font-medium">Atendimento 24/7</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-neutral-500 text-sm font-medium text-center md:text-left">
              © {new Date().getFullYear()} Top Créditos. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-8 text-sm font-medium text-neutral-500">
              {['Termos de Uso', 'Privacidade', 'Cookies'].map((link) => (
                <button key={link} onClick={() => navigate('/termos')} className="hover:text-white transition-colors">
                  {link}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;