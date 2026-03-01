import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminData } from '@/hooks/useAdminData';
import { useNavigate } from 'react-router-dom';
import { AdminStats } from '@/types';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  LogOut, Search, MoreVertical, Check, X,
  Eye, Edit, Trash2, Plus, Tag, Copy, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { DiagnosticPanel } from '@/components/admin/DiagnosticPanel';
import CouponsTab from '@/components/admin/CouponsTab';
import { toast } from 'sonner';

type Tab = 'overview' | 'orders' | 'customers' | 'products' | 'coupons' | 'categories';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    orders,
    resellers: customers,
    products,
    stats,
    isLoading,
    deleteReseller,
    updateResellerBalance,
    platforms,
    productCategories,
    createPlatform,
    deletePlatform,
    createCategory,
    deleteCategory
  } = useAdminData();

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
    { id: 'coupons', label: 'Cupons', icon: Tag },
    { id: 'categories', label: 'Ajustes de Catálogo', icon: Layers },
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
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${activeTab === tab.id
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
        {activeTab === 'customers' && <CustomersTab customers={customers} searchQuery={searchQuery} setSearchQuery={setSearchQuery} deleteReseller={deleteReseller} updateResellerBalance={updateResellerBalance} />}
        {activeTab === 'products' && <ProductsTab products={products} platforms={platforms} productCategories={productCategories} />}
        {activeTab === 'coupons' && <CouponsTab />}
        {activeTab === 'categories' && (
          <CategoriesTab
            platforms={platforms || []}
            productCategories={productCategories || []}
            onCreatePlatform={createPlatform}
            onDeletePlatform={deletePlatform}
            onCreateCategory={createCategory}
            onDeleteCategory={deleteCategory}
          />
        )}
      </main>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats, orders }: any) => {
  const kpis = [
    {
      label: 'Lucro Líquido',
      value: `R$ ${Number(stats?.net_profit || 0).toFixed(2)}`,
      color: 'text-emerald-500',
      trend: '+12.5%',
    },
    {
      label: 'Custos de API',
      value: `R$ ${Number(stats?.total_costs || 0).toFixed(2)}`,
      color: 'text-muted-foreground',
      trend: 'Est.',
    },
    {
      label: 'Novos Clientes',
      value: stats?.new_customers_this_month || 0,
      color: 'text-foreground',
      trend: 'Mês',
    },
    {
      label: 'Pedidos Pendentes',
      value: stats?.pending_orders || 0,
      color: 'text-muted-foreground',
      trend: 'Aguardando',
    },
  ];

  const creditsRevenue = Number(stats?.credits_revenue || 0);
  const apiRevenue = Number(stats?.api_extension_revenue || 0);
  const totalRevenue = creditsRevenue + apiRevenue;
  const creditsPercentage = totalRevenue > 0 ? (creditsRevenue / totalRevenue) * 100 : 0;
  const apiPercentage = totalRevenue > 0 ? (apiRevenue / totalRevenue) * 100 : 0;

  const pendingOrders = orders.filter((o: any) => o.status === 'pending' || o.status === 'processing').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPIs Minimalistas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div key={index} className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{kpi.label}</p>
            <div className="flex items-baseline justify-between">
              <p className={`text-3xl font-light ${kpi.color}`}>{kpi.value}</p>
              <span className="text-xs text-muted-foreground">{kpi.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Separação de Receita */}
      <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
        <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Receita por Categoria</h3>
        <div className="space-y-4">
          {/* Venda de Créditos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">Venda de Créditos</span>
              <span className="text-sm font-medium text-emerald-500">R$ {creditsRevenue.toFixed(2)}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500/80 transition-all duration-500"
                style={{ width: `${creditsPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{creditsPercentage.toFixed(1)}% do total</p>
          </div>

          {/* Extensão de API */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">Extensão de API</span>
              <span className="text-sm font-medium text-muted-foreground">R$ {apiRevenue.toFixed(2)}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-muted-foreground/60 transition-all duration-500"
                style={{ width: `${apiPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{apiPercentage.toFixed(1)}% do total</p>
          </div>

          {/* Total */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Receita Total</span>
              <span className="text-lg font-light text-foreground">R$ {totalRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Pending Orders */}
      <div>
        <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Pedidos Pendentes</h3>
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
                  <p className="text-sm font-light text-foreground">R$ {Number(order.price_at_purchase).toFixed(2)}</p>
                  <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground border-border">
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


// Customers Tab Component
const CustomersTab = ({ customers, searchQuery, setSearchQuery, deleteReseller, updateResellerBalance }: any) => {
  const [balanceModal, setBalanceModal] = useState<{ open: boolean; customer: any | null }>({ open: false, customer: null });
  const [newBalance, setNewBalance] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [savingBalance, setSavingBalance] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredCustomers = customers.filter((customer: any) =>
    customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteCustomer = async (customer: any) => {
    if (!confirm(`Tem certeza que deseja EXCLUIR o cliente "${customer.full_name}"? Esta ação é irreversível.`)) return;
    try {
      await deleteReseller(customer.id);
      toast.success(`Cliente "${customer.full_name}" excluído.`);
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    }
    setOpenMenuId(null);
  };

  const openBalanceModal = (customer: any) => {
    setNewBalance(String(Number(customer.balance || 0).toFixed(2)));
    setBalanceReason('');
    setBalanceModal({ open: true, customer });
    setOpenMenuId(null);
  };

  const handleSaveBalance = async () => {
    if (!balanceModal.customer) return;
    setSavingBalance(true);
    try {
      await updateResellerBalance(
        balanceModal.customer.id,
        parseFloat(newBalance),
        balanceReason || 'Ajuste manual pelo admin'
      );
      toast.success(`Saldo de "${balanceModal.customer.full_name}" atualizado para R$ ${parseFloat(newBalance).toFixed(2)}`);
      setBalanceModal({ open: false, customer: null });
    } catch (err: any) {
      toast.error('Erro ao atualizar saldo: ' + err.message);
    } finally {
      setSavingBalance(false);
    }
  };

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
                {/* Dropdown Menu */}
                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => setOpenMenuId(openMenuId === customer.id ? null : customer.id)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  {openMenuId === customer.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border bg-card shadow-xl py-1">
                        <button
                          onClick={() => openBalanceModal(customer)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Editar Saldo
                        </button>
                        <div className="h-px bg-border mx-2 my-1" />
                        <button
                          onClick={() => handleDeleteCustomer(customer)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir Cliente
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div
                  className="rounded bg-secondary/50 p-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => openBalanceModal(customer)}
                >
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-accent">R$ {Number(customer.balance || 0).toFixed(2)}</p>
                    <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
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

      {/* Balance Edit Modal */}
      {balanceModal.open && balanceModal.customer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl mx-4">
            <h2 className="text-lg font-semibold text-foreground mb-1">Editar Saldo</h2>
            <p className="text-sm text-muted-foreground mb-5">
              {balanceModal.customer.full_name} — {balanceModal.customer.email}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Saldo Atual</label>
                <p className="text-2xl font-light text-accent">R$ {Number(balanceModal.customer.balance || 0).toFixed(2)}</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Novo Saldo (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Motivo (opcional)</label>
                <Input
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="Ex: Bônus promocional, Correção, etc."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setBalanceModal({ open: false, customer: null })}
                  className="flex-1"
                  disabled={savingBalance}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveBalance}
                  className="flex-1"
                  disabled={savingBalance || !newBalance}
                >
                  {savingBalance ? 'Salvando...' : 'Atualizar Saldo'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onUpdateStatus }: any) => {
  if (!order) return null;

  const shortId = `#${order.id.split('-')[0].toUpperCase().substring(0, 4)}`;
  const dateStr = new Date(order.created_at).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const paidValue = Number(order.price_at_purchase);
  const discountApplied = Number(order.discount_applied || 0);
  const hasDiscount = discountApplied > 0;
  const originalValue = hasDiscount ? paidValue + discountApplied : paidValue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Detalhes do Pedido {shortId}</h2>
            <p className="text-sm text-muted-foreground">{dateStr}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Informações do Cliente */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Informações do Cliente</h3>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Nome</p>
              <p className="text-sm font-medium text-foreground">{order.user_name || 'Cliente'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">E-mail</p>
              <p className="text-sm font-medium text-foreground">{order.lovable_email}</p>
            </div>
          </div>

          {/* Informações do Produto */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Produto</h3>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Item Comprado</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{order.product_name}</p>
                <Badge variant="outline" className="text-[10px] uppercase py-0 px-1.5 h-auto">
                  {order.product_name?.toLowerCase().includes('api') ? 'API' : 'Créditos'}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Status</p>
              <Badge variant="outline" className={`text-xs font-medium ${order.status === 'completed' ? 'bg-[#062417] text-[#34d399] border-[#064e3b]' :
                order.status === 'pending' ? 'bg-[#2b1f0c] text-[#fbbf24] border-[#78350f]' :
                  'bg-destructive/10 text-destructive border-destructive/20'
                }`}>
                {order.status === 'completed' ? 'Concluído' : order.status === 'pending' ? 'Pendente' : 'Cancelado'}
              </Badge>
            </div>
          </div>

          {/* Financeiro */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Financeiro</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Valor Bruto:</span>
              <span className="text-foreground">R$ {originalValue.toFixed(2)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-500">Desconto:</span>
                <span className="text-emerald-500">- R$ {discountApplied.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-base font-semibold pt-2 border-t border-border">
              <span className="text-foreground">Valor Final Pago:</span>
              <span className="text-foreground">R$ {paidValue.toFixed(2)}</span>
            </div>
          </div>

          {/* ID de Controle */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Técnico</h3>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Order UUID</p>
              <p className="text-[11px] font-mono text-muted-foreground break-all">{order.id}</p>
            </div>
            {order.external_control_id && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">ID Externo</p>
                <p className="text-[11px] font-mono text-muted-foreground">{order.external_control_id}</p>
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        {order.status === 'pending' && (
          <div className="flex gap-3 mt-8 pt-6 border-t border-border">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              onClick={() => onUpdateStatus(order.id, 'completed')}
            >
              <Check className="h-4 w-4 mr-2" />
              Aprovar Pedido
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar Pedido
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Orders Tab Component
const OrdersTab = ({ orders, searchQuery, setSearchQuery }: any) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const { updateOrderStatus } = useAdminData();

  const filteredOrders = orders.filter((order: any) => {
    const s = searchQuery.toLowerCase();
    const matchesSearch =
      order.user_name?.toLowerCase().includes(s) ||
      order.lovable_email?.toLowerCase().includes(s) ||
      order.product_name?.toLowerCase().includes(s) ||
      order.id?.toLowerCase().includes(s); // Permitir busca por UUID parcial

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = (status: string) => {
    if (status === 'all') return orders.length;
    return orders.filter((o: any) => o.status === status).length;
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success('E-mail copiado para a área de transferência');
    setOpenMenuId(null);
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setOpenMenuId(null);
  };

  const handleUpdateStatus = async (orderId: string, status: 'completed' | 'cancelled') => {
    try {
      const deliveryLink = status === 'completed' ? prompt('Link de entrega (opcional):') || '' : '';
      await updateOrderStatus(orderId, status, deliveryLink);
      toast.success(`Pedido ${status === 'completed' ? 'aprovado' : 'cancelado'} com sucesso.`);
      setSelectedOrder(null);
    } catch (err: any) {
      toast.error('Erro ao atualizar status: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
          {['all', 'pending', 'completed', 'cancelled'].map((status) => {
            const count = getStatusCounts(status);
            const label = status === 'all' ? 'Todos' : status === 'pending' ? 'Pendentes' : status === 'completed' ? 'Concluídos' : 'Cancelados';
            return (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="whitespace-nowrap rounded-md font-medium"
              >
                {label} <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === status ? 'bg-background/20 text-current' : 'bg-secondary text-muted-foreground'}`}>{count}</span>
              </Button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 border-border bg-card/50"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden text-[#d1d5db]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 sticky top-0 border-b border-border">
              <tr>
                <th className="px-5 py-4 font-medium tracking-wider">Pedido</th>
                <th className="px-5 py-4 font-medium tracking-wider">Cliente</th>
                <th className="px-5 py-4 font-medium tracking-wider">Produto</th>
                <th className="px-5 py-4 font-medium tracking-wider text-right">Financeiro</th>
                <th className="px-5 py-4 font-medium tracking-wider text-center">Status</th>
                <th className="px-5 py-4 font-medium tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => {
                  const isApi = order.product_name?.toLowerCase().includes('api');
                  const productTag = isApi ? 'API' : 'Créditos';
                  const shortId = `#${order.id.split('-')[0].toUpperCase().substring(0, 4)}`;
                  const dateStr = new Date(order.created_at).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  });
                  const paidValue = Number(order.price_at_purchase);
                  const discountApplied = Number(order.discount_applied || 0);
                  const hasDiscount = discountApplied > 0;
                  const originalValue = hasDiscount ? paidValue + discountApplied : paidValue;

                  return (
                    <tr key={order.id} className="hover:bg-secondary/10 transition-colors group">
                      <td className="px-5 py-3 align-middle">
                        <div className="font-semibold text-foreground">{shortId}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{dateStr}</div>
                      </td>
                      <td className="px-5 py-3 align-middle">
                        <div className="font-medium text-foreground">{order.user_name || 'Cliente'}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{order.lovable_email}</div>
                      </td>
                      <td className="px-5 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{order.product_name}</span>
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-secondary/30">
                            {productTag}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 align-middle text-right">
                        {hasDiscount ? (
                          <div className="flex flex-col items-end justify-center">
                            <span className="text-[11px] text-muted-foreground line-through opacity-70">
                              R$ {originalValue.toFixed(2)}
                            </span>
                            <span className="font-semibold text-foreground">
                              R$ {paidValue.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                                {order.coupon_id ? 'Cupom Aplicado' : 'Desconto Aplicado'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="font-medium text-foreground">
                            R$ {paidValue.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 align-middle text-center">
                        <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 whitespace-nowrap ${order.status === 'completed' ? 'bg-[#062417] text-[#34d399] border-[#064e3b]' :
                          order.status === 'pending' ? 'bg-[#2b1f0c] text-[#fbbf24] border-[#78350f]' :
                            'bg-destructive/10 text-destructive border-destructive/20'
                          }`}>
                          {order.status === 'completed' ? 'Concluído' : order.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 align-middle text-right relative">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === order.id ? null : order.id);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {openMenuId === order.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-6 top-10 mt-1 z-50 w-40 rounded-md border border-border bg-card shadow-2xl py-1 text-left">
                              <button
                                onClick={() => handleViewDetails(order)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                Ver Detalhes
                              </button>
                              <button
                                onClick={() => handleCopyEmail(order.lovable_email)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                              >
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                Copiar E-mail
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

// Products Tab Component
const ProductsTab = ({ products, platforms, productCategories }: any) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const { updateProduct, createProduct } = useAdminData();

  // Extract unique platforms for the filter pills
  const availableFilters = useMemo(() => {
    const uniquePlatforms = new Set<string>();
    products.forEach((p: any) => {
      if (p.platform) uniquePlatforms.add(p.platform);
    });
    return ['all', ...Array.from(uniquePlatforms).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (platformFilter === 'all') return products;
    return products.filter((p: any) => p.platform === platformFilter);
  }, [products, platformFilter]);

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (productId: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      toast.success('Produto excluído com sucesso');
    } catch (error: any) {
      toast.error('Erro ao excluir produto: ' + error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
        <div>
          <h2 className="text-sm text-muted-foreground uppercase tracking-wider mb-2 sm:mb-0">Produtos</h2>
        </div>
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Platform Filters */}
      {availableFilters.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {availableFilters.map((platform) => {
            const count = platform === 'all'
              ? products.length
              : products.filter((p: any) => p.platform === platform).length;

            const label = platform === 'all' ? 'Todos' : platform;

            return (
              <Button
                key={platform}
                variant={platformFilter === platform ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPlatformFilter(platform)}
                className="whitespace-nowrap rounded-md font-medium"
              >
                {label} <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${platformFilter === platform ? 'bg-background/20 text-current' : 'bg-secondary text-muted-foreground'}`}>{count}</span>
              </Button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
            Nenhum produto encontrado para este filtro.
          </div>
        ) : (
          filteredProducts.map((product: any) => (
            <div key={product.id} className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4 relative group">
              <div className="flex items-start justify-between mb-3">
                <div className="pr-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                    {product.platform && (
                      <Badge variant="outline" className="text-[10px] bg-secondary/30 text-muted-foreground uppercase px-1.5 py-0 h-auto font-semibold">
                        {product.platform}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-xs mt-1.5 ${product.active ? 'bg-[#062417] text-[#34d399] border-[#064e3b]' : 'bg-muted text-muted-foreground'
                    }`}>
                    {product.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex gap-1 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => handleDelete(product.id)}
                  >
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
                  <span className="font-light text-emerald-500">R$ {Number(product.price).toFixed(2)}</span>
                </div>
                {product.unit_cost_brl > 0 && (
                  <div className="flex justify-between text-xs pt-2 border-t border-border">
                    <span className="text-muted-foreground">Custo:</span>
                    <span className="text-muted-foreground">R$ {(product.unit_cost_brl * product.credits_amount).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Product Modal */}
      <ProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={createProduct}
        title="Novo Produto"
        platforms={platforms}
        productCategories={productCategories}
      />

      {/* Edit Product Modal */}
      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={(data) => updateProduct(selectedProduct.id, data)}
        product={selectedProduct}
        title="Editar Produto"
        platforms={platforms}
        productCategories={productCategories}
      />
    </div>
  );
};

// Product Modal Component
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  product?: any;
  title: string;
  platforms: any[];
  productCategories: any[];
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product, title, platforms, productCategories }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    credits_amount: product?.credits_amount || '',
    price: product?.price || '',
    active: product?.active ?? true,
    category: product?.category || 'credits',
    unit_cost_brl: product?.unit_cost_brl || '',
    platform: product?.platform || '',
  });
  const isPlatformPredefined = (plat: string) => platforms.some(p => p.name === plat);

  const [isCustomPlatform, setIsCustomPlatform] = useState(
    product?.platform && !isPlatformPredefined(product.platform)
  );
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (product) {
      const isCustom = product.platform && !isPlatformPredefined(product.platform);
      setFormData({
        name: product.name || '',
        credits_amount: product.credits_amount || '',
        price: product.price || '',
        active: product.active ?? true,
        category: product.category || 'credits',
        unit_cost_brl: product.unit_cost_brl || '',
        platform: product.platform || '',
      });
      setIsCustomPlatform(isCustom);
    } else if (isOpen) {
      setFormData({
        name: '',
        credits_amount: '',
        price: '',
        active: true,
        category: 'credits',
        unit_cost_brl: '',
        platform: '',
      });
      setIsCustomPlatform(false);
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const productData = {
        name: formData.name,
        credits_amount: parseInt(formData.credits_amount),
        price: parseFloat(formData.price),
        active: formData.active,
        category: formData.category,
        unit_cost_brl: formData.unit_cost_brl ? parseFloat(formData.unit_cost_brl) : 0,
        platform: formData.platform || null,
      };

      console.log('Salvando produto:', productData);
      console.log('Produto ID:', product?.id);

      await onSave(productData);

      toast.success(product ? 'Produto atualizado com sucesso' : 'Produto criado com sucesso');
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      toast.error('Erro ao salvar produto: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomPlatform(true);
      setFormData({ ...formData, platform: '' });
    } else {
      setIsCustomPlatform(false);
      setFormData({ ...formData, platform: val });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0" disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Nome do Produto</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Pacote Starter"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Créditos</label>
              <Input
                type="number"
                value={formData.credits_amount}
                onChange={(e) => setFormData({ ...formData, credits_amount: e.target.value })}
                placeholder="10"
                required
                min="1"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Preço (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="5.00"
                required
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Custo Unitário (R$)</label>
            <Input
              type="number"
              step="0.0001"
              value={formData.unit_cost_brl}
              onChange={(e) => setFormData({ ...formData, unit_cost_brl: e.target.value })}
              placeholder="0.19"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Custo por crédito (opcional)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Plataforma</label>
              <select
                value={isCustomPlatform ? 'custom' : formData.platform}
                onChange={handlePlatformChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Nenhuma / Omitir</option>
                {platforms?.map((p: any) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
                <option value="custom">Outra (Digitar)</option>
              </select>

              {isCustomPlatform && (
                <Input
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  placeholder="Nome da plataforma"
                  required
                  className="mt-2"
                  autoFocus
                />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {productCategories?.map((c: any) => (
                  <option key={c.id} value={c.value}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-border"
            />
            <label htmlFor="active" className="text-sm text-foreground">
              Produto ativo
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Categories Tab Component ---
const CategoriesTab = ({
  platforms,
  productCategories,
  onCreatePlatform,
  onDeletePlatform,
  onCreateCategory,
  onDeleteCategory
}: any) => {
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryValue, setNewCategoryValue] = useState('');

  const handleCreatePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatformName.trim()) return;
    try {
      await onCreatePlatform(newPlatformName.trim());
      setNewPlatformName('');
      toast.success('Plataforma criada');
    } catch (err: any) {
      toast.error('Erro ao criar: ' + err.message);
    }
  };

  const handleDeletePlatform = async (id: string) => {
    if (!confirm('Deseja excluir esta plataforma?')) return;
    try {
      await onDeletePlatform(id);
      toast.success('Plataforma excluída');
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !newCategoryValue.trim()) return;
    try {
      // Basic slugification for the value if user typed spaces
      const val = newCategoryValue.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      await onCreateCategory(newCategoryName.trim(), val);
      setNewCategoryName('');
      setNewCategoryValue('');
      toast.success('Categoria criada');
    } catch (err: any) {
      toast.error('Erro ao criar: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id: string, value: string) => {
    if (value === 'credits' || value === 'api_extension') {
      toast.error('Não é possível excluir categorias do sistema.');
      return; // Basic safeguard
    }
    if (!confirm('Deseja excluir esta categoria?')) return;
    try {
      await onDeleteCategory(id);
      toast.success('Categoria excluída');
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* PLATFORMS */}
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-medium text-foreground uppercase tracking-wider mb-1">Plataformas</h2>
          <p className="text-xs text-muted-foreground">Gerencie as opções de plataformas para os produtos.</p>
        </div>

        <form onSubmit={handleCreatePlatform} className="flex gap-2">
          <Input
            placeholder="Nova plataforma..."
            value={newPlatformName}
            onChange={(e) => setNewPlatformName(e.target.value)}
            className="bg-card w-full"
          />
          <Button type="submit" size="sm" className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </form>

        <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/50 border-b border-border text-xs uppercase text-muted-foreground font-medium">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3 w-16 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {platforms?.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground text-xs">Nenhuma plataforma cadastrada.</td>
                </tr>
              ) : (
                platforms.map((p: any) => (
                  <tr key={p.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePlatform(p.id)}
                        className="h-8 w-8 p-0 text-destructive/70 hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-medium text-foreground uppercase tracking-wider mb-1">Categorias</h2>
          <p className="text-xs text-muted-foreground">Grupos internos para classificação de produtos.</p>
        </div>

        <form onSubmit={handleCreateCategory} className="flex gap-2">
          <Input
            placeholder="Nome (Ex: Licenças)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="bg-card w-1/2"
            required
          />
          <Input
            placeholder="ID (Ex: licenses)"
            value={newCategoryValue}
            onChange={(e) => setNewCategoryValue(e.target.value)}
            className="bg-card w-1/2 font-mono text-xs"
            required
          />
          <Button type="submit" size="sm" className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </form>

        <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/50 border-b border-border text-xs uppercase text-muted-foreground font-medium">
              <tr>
                <th className="px-4 py-3">Nome (Exibição)</th>
                <th className="px-4 py-3 text-muted-foreground font-mono">ID / Valor (Sistema)</th>
                <th className="px-4 py-3 w-16 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {productCategories?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground text-xs">Nenhuma categoria cadastrada.</td>
                </tr>
              ) : (
                productCategories.map((c: any) => (
                  <tr key={c.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{c.value}</td>
                    <td className="px-4 py-3 text-right">
                      {c.value !== 'credits' && c.value !== 'api_extension' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCategory(c.id, c.value)}
                          className="h-8 w-8 p-0 text-destructive/70 hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

// --- End Categories Tab Component ---

export default AdminDashboard;
