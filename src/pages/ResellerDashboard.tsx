
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useResellerData } from '@/hooks/useResellerData';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Home, ShoppingCart, Receipt, BookOpen, ArrowRight, RefreshCw, Key, Gift, Sparkles, Headphones, ChevronDown, Settings, GraduationCap, LogOut, User, Image as ImageIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate, useLocation } from 'react-router-dom';
import BalanceCard from '@/components/reseller/BalanceCard';
import ProductCard from '@/components/reseller/ProductCard';
import OrderCard from '@/components/reseller/OrderCard';
import TransactionTimeline from '@/components/reseller/TransactionTimeline';
import DepositModal from '@/components/reseller/DepositModal';
import PurchaseModal from '@/components/reseller/PurchaseModal';
import OrderDetailSheet from '@/components/reseller/OrderDetailSheet';
import SettingsModal from '@/components/reseller/SettingsModal';
import AuthModal from '@/components/auth/AuthModal';
import { Product, Order } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import logo from '@/assets/logo-neon.png';
import LoadingScreen from '@/components/ui/LoadingScreen';
import MobileNav from '@/components/ui/MobileNav';

type Tab = 'home' | 'buy' | 'orders' | 'academy';
type OrderFilter = 'all' | 'pending' | 'completed' | 'cancelled';

const ResellerDashboard = () => {
  const { user, balance, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, transactions, isLoading: loadingData, refetch } = useResellerData(user?.id);
  const { products, isLoading: loadingProducts } = useProducts();

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [depositModal, setDepositModal] = useState(false);
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authModal, setAuthModal] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetch]);

  // Synchronize Realtime Updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('reseller-realtime-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` },
        () => {
          // Wallet balance update
          refetch();
          // We also trigger a reload of page content to ensure balance from context is indirectly updated 
          // (though refetch only updates local dashboard orders/transactions)
          // For a true balance update, the user would need a refresh or we'd need to expose it in context.
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);

  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  const handleSelectProduct = (product: Product) => {
    // Verifica se o usuário está logado antes de permitir a compra
    if (!user) {
      setSelectedProduct(product);
      setAuthModal(true);
      return;
    }

    setSelectedProduct(product);
    setPurchaseModal(true);
  };

  const handleAuthSuccess = () => {
    // Após login bem-sucedido, abre o modal de compra se houver produto selecionado
    if (selectedProduct) {
      setPurchaseModal(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const orderFilterTabs: { key: OrderFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'pending', label: 'Pendentes' },
    { key: 'completed', label: 'Concluídos' },
    { key: 'cancelled', label: 'Cancelados' },
  ];

  if (loadingData || loadingProducts) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-6">
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

            {/* Navigation Links - Center (Fluid) */}
            <div className="hidden md:flex items-center bg-white/[0.03] p-1 rounded-full border border-white/5 relative">
              {/* Sliding Background Pill */}
              <div
                className="absolute h-[calc(100%-8px)] top-1 rounded-full bg-white/10 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] z-0"
                style={{
                  width: 'calc(20% - 4px)', // Assuming 5 items
                  left: `${location.pathname === '/dashboard' ? '2px' :
                    location.pathname === '/pedidos' ? 'calc(20% + 2px)' :
                      location.pathname === '/licencas' ? 'calc(40% + 2px)' :
                        location.pathname === '/academy' ? 'calc(60% + 2px)' : 'calc(80% + 2px)'
                    }`
                }}
              />

              {[
                { label: 'Início', path: '/dashboard' },
                { label: 'Meus Pedidos', path: '/pedidos' },
                { label: 'Licenças', path: '/licencas' },
                { label: 'Academy', path: '/academy' },
                { label: 'Suporte', path: '/ajuda' },
              ].map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={`relative z-10 px-5 py-1.5 text-sm font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>

            {/* Profile Menu - Right */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/ajuda')}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:scale-110 transition-all border border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                title="Suporte"
              >
                <Headphones className="h-4 w-4" />
              </button>

              <div className="h-5 w-px bg-white/10" />

              {user ? (
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
                    <DropdownMenuItem onClick={() => setSettingsModal(true)} className="gap-2">
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
              ) : (
                <Button
                  onClick={() => setAuthModal(true)}
                  variant="ghost"
                  size="sm"
                  className="text-sm text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <User className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-12 space-y-12">
        {/* Greeting - Minimalista */}
        <div className="space-y-2 pt-4">
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Bem-vindo de volta{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}.
          </h1>
          <p className="text-lg text-neutral-400 font-light">Seu painel de controle de créditos Lovable.</p>
        </div>

        {/* Balance Hero - Redesenhado */}
        {user ? (
          <section className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md p-8 md:p-10 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 relative z-10 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium tracking-widest text-neutral-500 uppercase flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Saldo Disponível
                </p>
                <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter">
                  R$ {balance.toFixed(2)}
                </h2>
              </div>
              <Button onClick={() => setDepositModal(true)} size="lg" className="rounded-full px-8 h-14 font-semibold bg-white text-black hover:bg-neutral-200 transition-all hover:scale-105 shrink-0 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                Adicionar Fundos
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-white/10 relative z-10">
              <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Gasto Total</p>
                <p className="text-2xl font-semibold text-white">R$ {transactions.filter(t => t.type === 'purchase').reduce((s, t) => s + Math.abs(Number(t.amount)), 0).toFixed(2)}</p>
              </div>
              <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Pedidos Totais</p>
                <p className="text-2xl font-semibold text-white">{orders.length}</p>
              </div>
              <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Último Depósito</p>
                <p className="text-2xl font-semibold text-white">R$ {transactions.filter(t => t.type === 'deposit').slice(-1)[0]?.amount || '0.00'}</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-md border border-border bg-[#0A0A0A] p-10">
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <h2 className="text-3xl font-light text-foreground">Bem-vindo ao Top Créditos</h2>
                <p className="text-muted-foreground">Faça login para acessar seu saldo e histórico de pedidos</p>
              </div>
              <Button onClick={() => setAuthModal(true)} size="lg" className="rounded-md px-8 h-12 font-bold">
                Entrar ou Criar Conta
              </Button>
            </div>
          </section>
        )}

        {/* Credit Packages - Redesenhado */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-light text-foreground">Pacotes de Créditos Lovable</h2>
              <p className="text-sm text-muted-foreground mt-1">Escolha quantos créditos Lovable você precisa</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/pacotes')} className="gap-2">
              Ver Todos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.slice(0, 4).map((p, i) => (
              <div
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                className="group relative rounded-2xl border border-border bg-card p-6 cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all"
              >
                {i === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Mais Vendido
                    </span>
                  </div>
                )}
                <div className="text-center space-y-4">
                  <div className="h-12 w-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{p.credits_amount}</p>
                    <p className="text-xs text-muted-foreground">créditos Lovable</p>
                  </div>
                  <div>
                    <p className="text-3xl font-light text-foreground">R$ {p.price.toFixed(2)}</p>
                  </div>
                  <Button
                    className="w-full rounded-full"
                    variant={balance >= p.price ? "default" : "outline"}
                    disabled={balance < p.price}
                  >
                    Comprar Agora
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Buyers Ranking - Premium Design */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">Top Compradores</h2>
              <p className="text-sm text-neutral-400 mt-1 font-light">Os maiores investidores da plataforma</p>
            </div>
            {/* Filtros Rápidos */}
            <div className="flex items-center gap-2 bg-[#0A0A0A] p-1 rounded-xl border border-white/5">
              <button className="px-4 py-1.5 text-xs font-medium text-white bg-white/10 rounded-lg border border-white/10 shadow-sm transition-all">
                Geral
              </button>
              <button className="px-4 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Mensal
              </button>
              <button className="px-4 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Semanal
              </button>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/5 bg-[#050505] p-2 md:p-4">
            <div className="flex flex-col gap-2">
              {[
                { position: 1, name: 'Leonardo', credits: 7490, badge: 'bg-gradient-to-br from-amber-400 to-orange-600', color: 'text-amber-500' },
                { position: 2, name: 'Luis Fernando', credits: 5500, badge: 'bg-gradient-to-br from-slate-300 to-slate-500', color: 'text-slate-400' },
                { position: 3, name: 'Jorge', credits: 5000, badge: 'bg-gradient-to-br from-orange-500 to-red-600', color: 'text-orange-500' }
              ].map((buyer) => (
                <div key={buyer.position} className="group flex items-center justify-between p-4 md:p-6 rounded-[1.5rem] bg-[#0A0A0A] hover:bg-[#111] transition-all duration-300 border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-4 md:gap-6">
                    {/* Position Badge */}
                    <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full ${buyer.badge} flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0 shadow-lg`}>
                      #{buyer.position}
                    </div>

                    {/* User Avatar */}
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-b from-neutral-800 to-neutral-950 flex items-center justify-center text-white font-mono font-medium text-xs md:text-sm border border-white/10 flex-shrink-0 group-hover:border-white/20 transition-colors">
                      {buyer.name.substring(0, 2).toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-white text-base md:text-lg tracking-tight">{buyer.name}</p>
                        <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium">Membro ativo</p>
                    </div>
                  </div>

                  {/* Credits */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl md:text-3xl font-light text-white tracking-tighter">
                      {buyer.credits.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-[10px] md:text-xs text-neutral-500 font-medium">créditos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Networking Group CTA */}
        <section className="relative overflow-hidden rounded-md border border-border bg-[#0A0A0A] p-10 hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
            {/* Icon Badge */}
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/20">
              <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-foreground" style={{ letterSpacing: '-0.02em' }}>
                Construindo o futuro com I.A.
              </h3>
              <p className="text-base text-muted-foreground max-w-xl mx-auto font-medium leading-relaxed">
                Junte-se ao nosso grupo exclusivo de networking e conecte-se com empreendedores que estão transformando negócios com inteligência artificial.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">150+</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Membros</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">24/7</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Ativo</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">100%</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Exclusivo</p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="space-y-3">
              <Button
                size="lg"
                onClick={() => window.open('https://chat.whatsapp.com/seu-link-aqui', '_blank')}
                className="rounded-md px-8 py-6 text-base font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                style={{ letterSpacing: '-0.01em' }}
              >
                Entrar no Grupo de Networking
                <ArrowRight className="ml-2 h-5 w-5" strokeWidth={1.5} />
              </Button>

              <p className="text-sm text-muted-foreground/80 font-medium">
                Vagas limitadas — comunidade criada para revendedores
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions - Minimalista */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/academy')}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 cursor-pointer hover:bg-white/[0.04] transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white text-white group-hover:text-black transition-colors">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Academy</h3>
                <p className="text-xs text-neutral-400 font-medium">Aprenda a usar seus créditos</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/pedidos')}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 cursor-pointer hover:bg-white/[0.04] transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white text-white group-hover:text-black transition-colors">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Meus Pedidos</h3>
                <p className="text-xs text-neutral-400 font-medium">Histórico e status</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/ajuda')}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 cursor-pointer hover:bg-white/[0.04] transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white text-white group-hover:text-black transition-colors">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Suporte</h3>
                <p className="text-xs text-neutral-400 font-medium">Central de ajuda</p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Orders - Minimalista */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-light text-foreground">Pedidos Recentes</h2>
              <p className="text-sm text-muted-foreground mt-1">Acompanhe seus pedidos</p>
            </div>
            <Button onClick={handleRefresh} variant="ghost" size="sm" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/50">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum pedido ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map(order => (
                <div
                  key={order.id}
                  onClick={() => { setSelectedOrder(order); setOrderSheetOpen(true); }}
                  className="flex items-center justify-between p-6 rounded-2xl border border-border bg-card hover:border-primary/40 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${order.status === 'completed' ? 'bg-accent/10' :
                      order.status === 'pending' ? 'bg-warning/10' : 'bg-destructive/10'
                      }`}>
                      <Receipt className={`h-5 w-5 ${order.status === 'completed' ? 'text-accent' :
                        order.status === 'pending' ? 'text-warning' : 'text-destructive'
                        }`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{order.product_name}</p>
                      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">R$ {Number(order.price_at_purchase).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{order.status === 'completed' ? 'Entregue' : order.status === 'pending' ? 'Pendente' : 'Cancelado'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


      </main>

      <MobileNav />

      {/* Modals */}
      <DepositModal open={depositModal} onOpenChange={setDepositModal} />
      <PurchaseModal open={purchaseModal} onOpenChange={setPurchaseModal} product={selectedProduct} />
      <OrderDetailSheet order={selectedOrder} open={orderSheetOpen} onOpenChange={setOrderSheetOpen} />
      <SettingsModal open={settingsModal} onOpenChange={setSettingsModal} userEmail={user?.email} userId={user?.id} />
      <AuthModal open={authModal} onOpenChange={setAuthModal} onSuccess={handleAuthSuccess} />
    </div>
  );
};

export default ResellerDashboard;
