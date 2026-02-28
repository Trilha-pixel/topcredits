import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useResellerData } from '@/hooks/useResellerData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Receipt, RefreshCw, Package, Clock, CheckCircle2, XCircle, Search, Headphones, ChevronDown, Settings, GraduationCap, LogOut, Home, ShoppingCart, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import OrderDetailSheet from '@/components/reseller/OrderDetailSheet';
import { Order } from '@/types';
import logo from '@/assets/logo-neon.png';
import LoadingScreen from '@/components/ui/LoadingScreen';
import MobileNav from '@/components/ui/MobileNav';

type OrderFilter = 'all' | 'pending' | 'completed' | 'cancelled';

const MyOrders = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, isLoading, refetch } = useResellerData(user?.id);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const orderFilterTabs: { key: OrderFilter; label: string; icon: any }[] = [
    { key: 'all', label: 'Todos', icon: Package },
    { key: 'pending', label: 'Pendentes', icon: Clock },
    { key: 'completed', label: 'Concluídos', icon: CheckCircle2 },
    { key: 'cancelled', label: 'Cancelados', icon: XCircle },
  ];

  const filteredOrders = orders
    .filter(o => orderFilter === 'all' || o.status === orderFilter)
    .filter(o => searchQuery === '' ||
      o.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toString().includes(searchQuery)
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Entregue';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

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

            {/* Navigation Links - Center (Fluid) */}
            <div className="hidden md:flex items-center bg-white/[0.03] p-1 rounded-full border border-white/5 relative">
              {/* Sliding Background Pill */}
              <div
                className="absolute h-[calc(100%-8px)] top-1 rounded-full bg-white/10 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] z-0"
                style={{
                  width: '120px',
                  left: '4px',
                  transform: `translateX(${location.pathname === '/dashboard' ? '0' :
                      location.pathname === '/pedidos' ? '120px' :
                        location.pathname === '/licencas' ? '240px' :
                          location.pathname === '/pacotes' ? '360px' : '480px'
                    })`
                }}
              />

              {[
                { label: 'Início', path: '/dashboard' },
                { label: 'Meus Pedidos', path: '/pedidos' },
                { label: 'Licenças', path: '/licencas' },
                { label: 'Pacotes', path: '/pacotes' },
                { label: 'Suporte', path: '/ajuda' },
              ].map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={`relative z-10 w-[120px] py-1.5 text-center text-sm font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'
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
                className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-primary/15 text-primary hover:bg-primary/25 hover:scale-105 transition-all border border-primary/25 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                title="Suporte"
              >
                <Headphones className="h-4 w-4" />
                <span className="text-xs font-semibold hidden lg:inline">Suporte</span>
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

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-20 pb-32 space-y-8">
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-foreground">Meus Pedidos</h1>
            <p className="text-muted-foreground mt-1">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por produto ou ID do pedido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-full border-border bg-card"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {orderFilterTabs.map((tab) => (
              <Button
                key={tab.key}
                variant={orderFilter === tab.key ? 'default' : 'outline'}
                onClick={() => setOrderFilter(tab.key)}
                className="gap-2 rounded-full whitespace-nowrap"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="p-16 text-center">
            <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-medium text-foreground mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Tente ajustar sua busca' : 'Você ainda não fez nenhum pedido'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/dashboard')} className="rounded-full">
                Comprar Créditos
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                onClick={() => {
                  setSelectedOrder(order);
                  setOrderSheetOpen(true);
                }}
                className="p-6 cursor-pointer hover:border-primary/40 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${order.status === 'completed' ? 'bg-green-500/10' :
                      order.status === 'pending' ? 'bg-yellow-500/10' : 'bg-red-500/10'
                      }`}>
                      <Receipt className={`h-6 w-6 ${order.status === 'completed' ? 'text-green-500' :
                        order.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
                        }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground truncate">
                          {order.product_name}
                        </p>
                        <Badge className={`${getStatusColor(order.status)} text-xs`}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>ID: #{order.id}</span>
                        <span>•</span>
                        <span>{new Date(order.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-medium text-foreground">
                      R$ {Number(order.price_at_purchase).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.product_name}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <MobileNav />

      <OrderDetailSheet
        order={selectedOrder}
        open={orderSheetOpen}
        onOpenChange={setOrderSheetOpen}
      />
    </div>
  );
};

export default MyOrders;
