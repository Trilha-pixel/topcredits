import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, MessageCircle, Book, CreditCard, Shield, HelpCircle, ChevronRight, Headphones, ChevronDown, Settings, GraduationCap, LogOut, Home, ShoppingCart, Receipt, BookOpen } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import logo from '@/assets/logo-neon.png';

const HelpCenter = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const categories = [
    {
      icon: CreditCard,
      title: 'Compras e Pagamentos',
      description: 'Como comprar créditos, métodos de pagamento e reembolsos',
      articles: 8,
      color: 'text-blue-500 bg-blue-500/10'
    },
    {
      icon: Shield,
      title: 'Segurança',
      description: 'Proteção de conta, autenticação e privacidade',
      articles: 5,
      color: 'text-green-500 bg-green-500/10'
    },
    {
      icon: Book,
      title: 'Como Usar',
      description: 'Guias e tutoriais sobre a plataforma',
      articles: 12,
      color: 'text-purple-500 bg-purple-500/10'
    },
    {
      icon: MessageCircle,
      title: 'Suporte',
      description: 'Entre em contato com nossa equipe',
      articles: 3,
      color: 'text-orange-500 bg-orange-500/10'
    }
  ];

  const popularQuestions = [
    'Como fazer um depósito?',
    'Quanto tempo leva para receber os créditos?',
    'Como funciona o sistema de reembolso?',
    'Quais métodos de pagamento são aceitos?',
    'Como alterar minha senha?',
    'Como entrar em contato com o suporte?'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo - Left */}
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Top Credits"
                className="h-10 w-10 object-contain"
                style={{ filter: 'drop-shadow(0 0 8px hsl(263 70% 66% / 0.6)) drop-shadow(0 0 20px hsl(263 70% 66% / 0.25))' }}
              />
              <span className="text-sm font-medium text-white">Top Créditos</span>
            </div>

            {/* Navigation Links - Center */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Início
              </button>
              <button
                onClick={() => navigate('/pedidos')}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Meus Pedidos
              </button>
              <button
                onClick={() => navigate('/licencas')}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Licenças
              </button>
              <button
                onClick={() => navigate('/academy')}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Academy
              </button>
              <button
                onClick={() => navigate('/ajuda')}
                className="text-sm font-medium text-white transition-colors"
              >
                Suporte
              </button>
            </div>

            {/* Profile Menu - Right */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/ajuda')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Headphones className="h-4 w-4" />
              </button>
              
              <div className="h-5 w-px bg-white/10" />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 pl-1 pr-3 py-1 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
                      {initials}
                    </div>
                    <span className="text-xs font-medium text-white hidden sm:block max-w-[120px] truncate">
                      {user?.full_name}
                    </span>
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="gap-2">
                    <Settings className="h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/academy')} className="gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Academy
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive gap-2">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-12 space-y-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-light text-foreground">
            Como podemos ajudar?
          </h1>
          <p className="text-lg text-muted-foreground">
            Encontre respostas rápidas para suas dúvidas
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar artigos de ajuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-base rounded-full border-border bg-card"
            />
          </div>
        </div>

        {/* Categories */}
        <section className="space-y-6">
          <h2 className="text-2xl font-light text-foreground">Categorias</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="p-6 cursor-pointer hover:border-primary/40 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-2xl ${category.color} flex items-center justify-center flex-shrink-0`}>
                    <category.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-medium text-foreground mb-1">
                          {category.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      {category.articles} artigos
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Popular Questions */}
        <section className="space-y-6">
          <h2 className="text-2xl font-light text-foreground">Perguntas Frequentes</h2>
          <div className="space-y-3">
            {popularQuestions.map((question, index) => (
              <Card
                key={index}
                className="p-4 cursor-pointer hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    <p className="text-foreground">{question}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section className="rounded-3xl border border-border bg-card p-8 text-center space-y-4">
          <MessageCircle className="h-12 w-12 mx-auto text-primary" />
          <div>
            <h3 className="text-xl font-medium text-foreground mb-2">
              Ainda precisa de ajuda?
            </h3>
            <p className="text-muted-foreground">
              Nossa equipe está disponível 24/7 para ajudar você
            </p>
          </div>
          <Button size="lg" className="rounded-full">
            Falar com Suporte
          </Button>
        </section>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl sm:hidden">
        <div className="flex items-center justify-around py-2">
          {[
            { key: 'home', icon: Home, label: 'Home', path: '/dashboard' },
            { key: 'buy', icon: ShoppingCart, label: 'Comprar', path: '/pacotes' },
            { key: 'orders', icon: Receipt, label: 'Pedidos', path: '/pedidos' },
            { key: 'academy', icon: BookOpen, label: 'Academy', path: '/academy' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors text-muted-foreground hover:text-primary`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default HelpCenter;
