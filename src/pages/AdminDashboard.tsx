import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminData } from '@/hooks/useAdminData';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Users, ShoppingCart, 
  TrendingUp, DollarSign, Clock, LogOut,
  Search, Filter, MoreVertical, Check, X,
  Eye, Edit, Trash2, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { DiagnosticPanel } from '@/components/admin/DiagnosticPanel';
import { toast } from 'sonner';

type Tab = 'overview' | 'orders' | 'customers' | 'products';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { orders, resellers: customers, products, stats, isLoading } = useAdminData();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Mostrar diagnóstico se não houver dados
  const hasData = orders.length > 0 || customers.length > 0;
  if (!hasData && !isLoading) {
    return (
      <DiagnosticPanel
        ordersCount={orders.length}
        customersCount={customers.length}
        productsCount={products.length}
        hasStats={!!stats}
        isLoading={isLoading}
      />
    );
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'orders', label: 'Pedidos', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'products', label: 'Produtos', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">TC</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Painel Admin</h1>
              <p className="text-xs text-muted-foreground">Top Créditos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'overview' && <OverviewTab stats={stats} orders={orders} />}
        {activeTab === 'orders' && <OrdersTab orders={orders} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
        {activeTab === 'customers' && <CustomersTab customers={customers} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
        {activeTab === 'products' && <ProductsTab products={products} />}
      </main>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats, orders }: any) => {
  const kpis = [
    {
      label: 'Volume em Carteiras',
      value: `R$ ${Number(stats?.total_wallet_balance || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-accent',
    },
    {
      label: 'Receita Total',
      value: `R$ ${Number(stats?.total_revenue || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      label: 'Pedidos Pendentes',
      value: stats?.pending_orders || 0,
      icon: Clock,
      color: 'text-warning',
    },
    {
      label: 'Total de Clientes',
      value: stats?.total_customers || 0,
      icon: Users,
      color: 'text-foreground',
    },
  ];

  const pendingOrders = orders.filter((o: any) => o.status === 'pending' || o.status === 'processing').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Pending Orders */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Pedidos Pendentes</h2>
        <div className="space-y-2">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum pedido pendente
            </div>
          ) : (
            pendingOrders.map((order: any) => (
              <div key={order.id} className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{order.user_name || order.lovable_email}</p>
                  <p className="text-xs text-muted-foreground">{order.product_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">R$ {Number(order.price_at_purchase).toFixed(2)}</p>
                  <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                    Pendente
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Orders Tab Component
const OrdersTab = ({ orders, searchQuery, setSearchQuery }: any) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = 
      order.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.lovable_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pedidos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'completed', 'cancelled'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'Todos' : status === 'pending' ? 'Pendentes' : status === 'completed' ? 'Concluídos' : 'Cancelados'}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum pedido encontrado
          </div>
        ) : (
          filteredOrders.map((order: any) => (
            <div key={order.id} className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">{order.user_name || 'Cliente'}</p>
                    <Badge variant="outline" className={`text-xs ${
                      order.status === 'completed' ? 'bg-accent/10 text-accent border-accent/20' :
                      order.status === 'pending' ? 'bg-warning/10 text-warning border-warning/20' :
                      'bg-destructive/10 text-destructive border-destructive/20'
                    }`}>
                      {order.status === 'completed' ? 'Concluído' : order.status === 'pending' ? 'Pendente' : 'Cancelado'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{order.lovable_email}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{order.product_name}</span>
                    <span>•</span>
                    <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground mb-2">R$ {Number(order.price_at_purchase).toFixed(2)}</p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {order.status === 'pending' && (
                      <>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-accent">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Customers Tab Component
const CustomersTab = ({ customers, searchQuery, setSearchQuery }: any) => {
  const filteredCustomers = customers.filter((customer: any) =>
    customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Customers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground text-sm">
            Nenhum cliente encontrado
          </div>
        ) : (
          filteredCustomers.map((customer: any) => (
            <div key={customer.id} className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{customer.full_name}</p>
                  <p className="text-xs text-muted-foreground">{customer.email}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded bg-secondary/50 p-2">
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className="text-sm font-bold text-accent">R$ {Number(customer.balance || 0).toFixed(2)}</p>
                </div>
                <div className="rounded bg-secondary/50 p-2">
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                  <p className="text-sm font-bold text-foreground">{customer.total_orders || 0}</p>
                </div>
                <div className="rounded bg-secondary/50 p-2">
                  <p className="text-xs text-muted-foreground">Gasto</p>
                  <p className="text-sm font-bold text-foreground">R$ {Number(customer.total_spent || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Products Tab Component
const ProductsTab = ({ products }: any) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Produtos</h2>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground text-sm">
            Nenhum produto cadastrado
          </div>
        ) : (
          products.map((product: any) => (
            <div key={product.id} className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{product.name}</p>
                  <Badge variant="outline" className={`text-xs mt-1 ${
                    product.active ? 'bg-accent/10 text-accent border-accent/20' : 'bg-muted text-muted-foreground'
                  }`}>
                    {product.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Créditos:</span>
                  <span className="font-medium text-foreground">{product.credits_amount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço:</span>
                  <span className="font-bold text-accent">R$ {Number(product.price).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
