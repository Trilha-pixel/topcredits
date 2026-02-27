import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Headphones, CheckCircle2, Youtube, Instagram, MessageCircle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Navbar */}
      <header className="w-full border-b border-white/5 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">Top Créditos</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">Início</Link>
            <Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">Pacotes</Link>
            <Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">Leaderboard</Link>
            <Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">Suporte</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-sm text-gray-400 hover:text-white transition-colors">Minha Conta</Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-24 md:py-32 flex flex-col items-center justify-center text-center px-4">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 mb-8">
            <span className="text-xs font-medium text-gray-300">Créditos Lovable Oficiais</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
            Top Créditos
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
            Compre créditos Lovable com entrega instantânea.<br className="hidden md:inline" />
            A forma mais rápida e segura de adquirir seus créditos.
          </p>
          
          <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-8 py-6 text-base font-medium mb-8">
            Ver Pacotes de Créditos
          </Button>
          
          <p className="text-sm text-gray-500">
            Mais de 500 créditos Lovable vendidos nas últimas 24 horas
          </p>
        </section>

        {/* Section 2: Direct to account */}
        <section className="py-24 bg-black/50 border-t border-white/5 px-4">
          <div className="container mx-auto text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Créditos Lovable direto na sua conta
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Escolha seu pacote, efetue o pagamento e receba seus créditos Lovable
              automaticamente em segundos. Simples, rápido e seguro.
            </p>
          </div>
        </section>

        {/* Section 3: Why buy here? */}
        <section className="py-24 border-t border-white/5 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Por que comprar créditos Lovable aqui?
            </h2>
            <p className="text-gray-400 mb-16 text-lg">
              A melhor experiência de compra de créditos Lovable
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">Entrega Instantânea</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Créditos Lovable na sua conta em segundos após o pagamento
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">100% Seguro</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Transações protegidas com criptografia de nível bancário
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Headphones className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">Suporte 24/7</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Atendimento especializado para suas compras de créditos
                </p>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">Garantia Total</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Seus créditos Lovable garantidos ou seu dinheiro de volta
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Testimonials */}
        <section className="py-24 bg-black/50 border-t border-white/5 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Clientes satisfeitos
            </h2>
            <p className="text-gray-400 mb-16 text-lg">
              Veja o que nossos clientes dizem sobre comprar créditos Lovable conosco
            </p>

            <div className="max-w-2xl mx-auto bg-white/[0.02] border border-white/10 rounded-2xl p-10 md:p-14">
              <p className="text-xl md:text-2xl text-white font-medium mb-10 leading-relaxed">
                "Processo extremamente ágil. Créditos disponíveis em menos de um minuto."
              </p>
              
              <div className="flex flex-col items-center">
                <p className="text-white font-medium">Ana Paula Silva</p>
                <p className="text-sm text-gray-500">Designer, Studio Creative</p>
              </div>

              <div className="flex items-center justify-center gap-2 mt-8">
                <div className="w-8 h-1.5 bg-white rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: CTA */}
        <section className="py-24 border-t border-white/5 px-4">
          <div className="container mx-auto text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pronto para comprar seus créditos Lovable?
            </h2>
            <p className="text-gray-400 text-lg mb-10">
              Escolha seu pacote e receba seus créditos instantaneamente. Processo simples e 100% seguro.
            </p>
            <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-8 py-6 text-base font-medium">
              Comprar Créditos Agora
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-4 bg-black/80">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <h3 className="text-xl font-bold text-white mb-4">Top Créditos</h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed pr-4">
                Créditos Lovable pelo menor preço do Brasil. Entrega rápida, cashback e suporte 24h.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://www.youtube.com/@realfelipetop" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="https://www.instagram.com/realfelipetop" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Plataforma</h4>
              <ul className="space-y-4">
                <li><Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">Comprar Créditos</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">Meus Pedidos</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">Licenças</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">Ranking</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Suporte</h4>
              <ul className="space-y-4">
                <li><Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">WhatsApp</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">Central de Ajuda</Link></li>
                <li><Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">Academy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Contato</h4>
              <ul className="space-y-4">
                <li className="text-sm text-gray-400">contato@topcreditos.com.br</li>
                <li className="text-sm text-gray-400">+55 (11) 99999-9999</li>
                <li className="text-sm text-gray-400">Atendimento 24/7</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-8 text-center md:text-left flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Top Créditos. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;