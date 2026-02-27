
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminData } from '@/hooks/useAdminData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Copy, Check, X, TrendingUp, Users,
  Clock, CheckCircle2, XCircle, Search, DollarSign,
  BarChart3, Package, UserCheck, UserX, ArrowUpRight,
  Link, ExternalLink, Send, ArrowLeft, UserPlus, Mail, ShoppingCart, Plus, Edit, Trash2, GraduationCap, Key, LayoutDashboard, LogOut, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardHeader from '@/components/reseller/DashboardHeader';
import AdminAcademy from '@/components/admin/AdminAcademy';
import AdminLicenses from '@/components/admin/AdminLicenses';
import { Order, Profile, Product } from '@/types';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { label: 'Pendente', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20', pulse: true },
  processing: { label: 'Pendente', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20', pulse: true },
  completed: { label: 'Entregue', icon: CheckCircle2, className: 'bg-accent/10 text-accent border-accent/20', pulse: false },
  cancelled: { label: 'Cancelado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20', pulse: false },
};

type AdminTab = 'overview' | 'orders' | 'customers' | 'products' | 'academy' | 'licenses';
type OrderFilter = 'pending' | 'completed' | 'cancelled';

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const { orders, resellers: customers, wallets, transactions, products, stats, isLoading, updateOrderStatus, updateProduct, createProduct, deleteReseller: deleteCustomer, updateResellerBalance: updateCustomerBalance } = useAdminData();

  const [cancelModal, setCancelModal] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [deliverModal, setDeliverModal] = useState<Order | null>(null);
  const [deliveryLink, setDeliveryLink] = useState('');
  const [deliveryControlId, setDeliveryControlId] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOrderFilter, setCustomerOrderFilter] = useState<OrderFilter>('pending');
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);

  // Balance Edit State
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [editingBalanceUser, setEditingBalanceUser] = useState<any | null>(null); // using any for Profile & balance
  const [newBalanceValue, setNewBalanceValue] = useState('');

  // Products state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({ name: '', price: 0, credits_amount: 0, active: true });
  const [isEditing, setIsEditing] = useState(false);

  // Invite function (Server-side / Edge Function)
  const inviteCustomer = async (name: string, email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('invite-customer', {
        body: {
          email: email,
          fullName: name
        }
      });

      if (error) throw error;

      toast.success(`Link de acesso enviado para ${email}!`);
      setInviteModal(false);
      setInviteName('');
      setInviteEmail('');
    } catch (error: any) {
      console.error('Erro ao convidar:', error);
      toast.error('Erro ao enviar convite: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerId) return;
    try {
      await deleteCustomer(deleteCustomerId);
      toast.success('Cliente excluído com sucesso!');
      setDeleteCustomerId(null);
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente: ' + (error.message || 'Erro ao deletar usuário'));
    }
  }


  const handleOpenBalanceModal = (user: any) => {
    setEditingBalanceUser(user);
    // user.balance comes from the hook's map function
    setNewBalanceValue(String(user.balance || 0));
    setIsBalanceModalOpen(true);
  };

  const handleSaveBalance = async () => {
    if (!editingBalanceUser) return;
    try {
      const val = parseFloat(newBalanceValue);
      if (isNaN(val)) {
        toast.error('Valor inválido');
        return;
      }
      await updateCustomerBalance(editingBalanceUser.id, val);
      toast.success('Saldo atualizado com sucesso!');
      setIsBalanceModalOpen(false);
    } catch (error: any) {
      console.error('Error updating balance:', error);
      toast.error('Erro ao atualizar saldo: ' + (error.message || 'Erro desconhecido'));
    }
  };

  // KPI calculations
  const totalDeposited = wallets.reduce((s, w) => s + Number(w.balance), 0);
  const totalRevenue = transactions
    .filter(t => t.type === 'purchase')
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  const activeCustomersCount = customers.filter(u => u.is_active).length;
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  const copyEmail = (order: Order) => {
    navigator.clipboard.writeText(order.lovable_email);
    setCopiedId(order.id);
    toast.success('E-mail copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openDeliverModal = (order: Order) => {
    setDeliverModal(order);
    setDeliveryLink('');
    setDeliveryControlId('');
  };

  const confirmDeliver = async () => {
    if (!deliverModal || !deliveryLink.trim()) return;

    try {
      await updateOrderStatus(deliverModal.id, 'completed', deliveryLink.trim(), deliveryControlId.trim());
      toast.success('Pedido entregue com link!');
      setDeliverModal(null);
      setDeliveryLink('');
      setDeliveryControlId('');
    } catch (error) {
      toast.error('Erro ao entregar pedido.');
    }
  };

  const confirmCancel = async () => {
    if (!cancelModal) return;

    try {
      await updateOrderStatus(cancelModal.id, 'cancelled');
      toast.success(`Pedido cancelado. Valor estornado.`);
      setCancelModal(null);
      setCancelReason('');
    } catch (error) {
      toast.error('Erro ao cancelar pedido.');
    }
  };

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        credits_amount: product.credits_amount,
        active: product.active ?? true
      });
      setIsEditing(true);
    } else {
      setEditingProduct({ name: '', price: 0, credits_amount: 0, active: true });
      setIsEditing(false);
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (isEditing && editingProduct.id) {
        await updateProduct(editingProduct.id, editingProduct);
        toast.success('Produto atualizado!');
      } else {
        await createProduct(editingProduct as Omit<Product, 'id'>);
        toast.success('Produto criado!');
      }
      setIsProductModalOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar produto.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Filter orders
  const getFilteredOrders = () => {
    let filtered = orders;
    if (orderFilter === 'pending') filtered = filtered.filter(o => o.status === 'pending' || o.status === 'processing');
    else if (orderFilter === 'completed') filtered = filtered.filter(o => o.status === 'completed');
    else filtered = filtered.filter(o => o.status === 'cancelled');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        (o.user_name || '').toLowerCase().includes(q) ||
        (o.lovable_email || '').toLowerCase().includes(q) ||
        (o.product_name || '').toLowerCase().includes(q) ||
        (o.id || '').toLowerCase().includes(q) ||
        (o.external_control_id || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  const tabs: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { key: 'orders', label: 'Pedidos', icon: Package },
    { key: 'customers', label: 'Clientes', icon: Users },
    { key: 'products', label: 'Produtos', icon: ShoppingCart },
    { key: 'academy', label: 'Academy', icon: GraduationCap },
    { key: 'licenses', label: 'Licenças', icon: Key },
  ];

  const orderFilterTabs: { key: OrderFilter; label: string; count: number }[] = [
    { key: 'pending', label: 'Pendentes', count: pendingCount },
    { key: 'completed', label: 'Entregues', count: completedCount },
    { key: 'cancelled', label: 'Cancelados', count: cancelledCount },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={user?.full_name || 'Admin'}
        initials={user?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
        breadcrumb="Painel Admin"
        onLogout={handleLogout}
        onAcademyClick={() => navigate('/academy')}
      />

      {/* Admin Tab Navigation */}
      <div className="sticky top-14 z-40 border-b border-[hsl(0_0%_100%/0.05)] bg-[hsl(0_0%_0%/0.3)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">

        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-accent/5 p-5">
                <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Volume em carteiras</p>
                    <DollarSign className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-2xl font-bold text-accent">R$ {Number(stats?.total_wallet_balance || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-primary/5 p-5">
                <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Receita total</p>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">R$ {Number(stats?.total_revenue || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendentes</p>
                  <Clock className="h-4 w-4 text-warning animate-pulse" />
                </div>
                <p className="text-2xl font-bold text-warning">{stats?.pending_orders || 0}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Clientes</p>
                  <Users className="h-4 w-4 text-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats?.total_customers || 0}</p>
              </div>
            </div>

            {/* Quick Actions: Recent Pending Orders */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Aguardando Entrega
                </h2>
                <button
                  onClick={() => { setActiveTab('orders'); setOrderFilter('pending'); }}
                  className="text-xs text-primary hover:underline"
                >
                  Ver todos →
                </button>
              </div>
              <div className="space-y-2">
                {orders.filter(o => o.status === 'pending' || o.status === 'processing').slice(0, 5).map(order => {
                  const s = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = s.icon;
                  return (
                    <div key={order.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4 hover:bg-card transition-colors">
                      <StatusIcon className={`h-5 w-5 shrink-0 ${s.pulse ? 'animate-pulse text-warning' : 'text-primary'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-foreground">{order.user_name}</span>
                          <Badge variant="outline" className={`text-[10px] ${s.className}`}>{s.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{order.product_name}</span>
                          <span>·</span>
                          <button
                            onClick={() => copyEmail(order)}
                            className="flex items-center gap-1 hover:text-primary transition-colors font-mono"
                          >
                            {copiedId === order.id ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
                            {order.lovable_email}
                          </button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">R$ {Number(order.price_at_purchase).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {/* Entregar: Apenas se pendente */}
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <Button
                            size="sm"
                            onClick={() => openDeliverModal(order)}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground h-8 w-8 p-0"
                            title="Entregar Pedido"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Reembolsar: Se não estiver cancelado (aparece para pendente e entregue) */}
                        {order.status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCancelModal(order)}
                            className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                            title="Reembolsar Pedido"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {orders.filter(o => o.status === 'pending' || o.status === 'processing').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-accent/50" />
                    Nenhum pedido pendente. Tudo em dia! 🎉
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* ============ ORDERS TAB ============ */}
        {activeTab === 'orders' && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Esteira de Entrega
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pedido..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary border-border h-9 text-sm"
                />
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-4">
              {orderFilterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setOrderFilter(tab.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${orderFilter === tab.key
                    ? tab.key === 'pending' ? 'bg-warning/10 text-warning' : tab.key === 'completed' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Order cards */}
            <div className="space-y-2">
              {getFilteredOrders().length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Nenhum pedido encontrado.</div>
              ) : (
                getFilteredOrders().map(order => {
                  const s = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = s.icon;
                  return (
                    <div key={order.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4 hover:bg-card transition-colors">
                      <StatusIcon className={`h-5 w-5 shrink-0 ${s.pulse ? 'animate-pulse text-warning' : order.status === 'completed' ? 'text-accent' : order.status === 'cancelled' ? 'text-destructive' : 'text-primary'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {/* Cliente: Mostre o lovable_email */}
                          <span className="text-sm font-semibold text-foreground">{order.lovable_email}</span>
                          {/* Produto: product_name */}
                          <span className="text-xs text-muted-foreground">· {order.product_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {/* Data: Formate created_at */}
                          <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                          <span>· {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>

                          {order.external_control_id && (
                            <span className="flex items-center gap-1 bg-accent/5 text-[10px] text-accent px-1 rounded ml-1 font-mono">
                              # {order.external_control_id}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">R$ {Number(order.price_at_purchase).toFixed(2)}</p>
                          <Badge variant="outline" className={`text-[10px] ${s.className}`}>{s.label}</Badge>
                        </div>

                        <div className="flex gap-1.5">
                          {/* Entregar: Apenas se pendente */}
                          {(order.status === 'pending' || order.status === 'processing') && (
                            <Button size="sm" onClick={() => openDeliverModal(order)} className="bg-accent hover:bg-accent/90 text-accent-foreground h-8 w-8 p-0" title="Entregar">
                              <Check className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Reembolsar: Se não cancelado */}
                          {order.status !== 'cancelled' && (
                            <Button size="sm" variant="ghost" onClick={() => setCancelModal(order)} className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0" title="Reembolsar">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* ============ CUSTOMERS TAB ============ */}
        {activeTab === 'customers' && (
          <section>
            {!selectedCustomer ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Gerenciar Clientes
                  </h2>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou email..."
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        className="pl-9 bg-secondary border-border h-9 text-sm"
                      />
                    </div>
                    <Button size="sm" onClick={() => setInviteModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 shrink-0">
                      <UserPlus className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Novo Cliente</span>
                      <span className="sm:hidden">Novo</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {customers
                    .filter(r => {
                      if (!customerSearch) return true;
                      const q = customerSearch.toLowerCase();
                      return (r.full_name || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q);
                    })
                    .map(r => {
                      const wallet = wallets.find(w => w.user_id === r.id);
                      const userOrders = orders.filter(o => o.user_id === r.id);
                      const userCompleted = userOrders.filter(o => o.status === 'completed').length;
                      const userPending = userOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;
                      const userTx = transactions.filter(t => t.user_id === r.id);
                      const totalDeposited = userTx.filter(t => t.type === 'deposit').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
                      const initials = (r.full_name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2);

                      return (
                        <div
                          key={r.id}
                          onClick={() => { setSelectedCustomer(r); setCustomerOrderFilter('pending'); }}
                          className="relative group rounded-2xl border border-border bg-card p-5 cursor-pointer transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
                        >
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteCustomerId(r.id);
                              }}
                              className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              title="Excluir Cliente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <Avatar className="h-12 w-12 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{initials}</AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${r.is_active ? 'bg-accent' : 'bg-muted-foreground'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="text-base font-semibold text-foreground">{r.full_name}</h3>
                                {r.is_active ? (
                                  <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px]">
                                    <UserCheck className="h-3 w-3 mr-0.5" /> Ativo
                                  </Badge>
                                ) : (
                                  <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">
                                    <Mail className="h-3 w-3 mr-0.5" /> Convidado
                                  </Badge>
                                )}
                                {userPending > 0 && (
                                  <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] animate-pulse">
                                    <Clock className="h-3 w-3 mr-0.5" /> {userPending} pendente{userPending > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{r.email}</p>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="rounded-lg bg-secondary/50 p-2.5">
                                  <p className="text-[10px] text-muted-foreground uppercase">Saldo</p>
                                  <p className="text-sm font-bold text-accent">R$ {Number(r.balance ?? wallet?.balance ?? 0).toFixed(2)}</p>
                                </div>
                                <div className="rounded-lg bg-secondary/50 p-2.5">
                                  <p className="text-[10px] text-muted-foreground uppercase">Total Depositado</p>
                                  <p className="text-sm font-bold text-foreground">R$ {totalDeposited.toFixed(2)}</p>
                                </div>
                                <div className="rounded-lg bg-secondary/50 p-2.5">
                                  <p className="text-[10px] text-muted-foreground uppercase">Entregues</p>
                                  <p className="text-sm font-bold text-foreground flex items-center gap-1">
                                    <ArrowUpRight className="h-3 w-3 text-accent" /> {userCompleted}
                                  </p>
                                </div>
                                <div className="rounded-lg bg-secondary/50 p-2.5">
                                  <p className="text-[10px] text-muted-foreground uppercase">Pendentes</p>
                                  <p className="text-sm font-bold text-foreground flex items-center gap-1">
                                    {userPending > 0 && <Clock className="h-3 w-3 text-warning animate-pulse" />}
                                    {userPending}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            ) : (
              /* ============ CUSTOMER DETAIL VIEW ============ */
              (() => {
                const r = selectedCustomer;
                const wallet = wallets.find(w => w.user_id === r.id);
                const userOrders = orders.filter(o => o.user_id === r.id);
                const userPending = userOrders.filter(o => o.status === 'pending' || o.status === 'processing');
                const userCompleted = userOrders.filter(o => o.status === 'completed');
                const userCancelled = userOrders.filter(o => o.status === 'cancelled');
                const userTx = transactions.filter(t => t.user_id === r.id);
                const totalDeposited = userTx.filter(t => t.type === 'deposit').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
                const initials = (r.full_name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2);

                const customerOrderFilterTabs: { key: OrderFilter; label: string; count: number }[] = [
                  { key: 'pending', label: 'Pendentes', count: userPending.length },
                  { key: 'completed', label: 'Entregues', count: userCompleted.length },
                  { key: 'cancelled', label: 'Cancelados', count: userCancelled.length },
                ];

                const filteredCustomerOrders =
                  customerOrderFilter === 'pending' ? userPending :
                    customerOrderFilter === 'completed' ? userCompleted : userCancelled;

                return (
                  <div className="space-y-4">
                    {/* Back button */}
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Voltar para clientes
                    </button>

                    {/* Customer header */}
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <Avatar className="h-14 w-14 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">{initials}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${r.is_active ? 'bg-accent' : 'bg-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-lg font-bold text-foreground">{r.full_name}</h3>
                            {r.is_active ? (
                              <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px]">
                                <UserCheck className="h-3 w-3 mr-0.5" /> Ativo
                              </Badge>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground border-border text-[10px]">
                                <UserX className="h-3 w-3 mr-0.5" /> Inativo
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{r.email}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="rounded-lg bg-secondary/50 p-2.5 relative group/balance">
                              <p className="text-[10px] text-muted-foreground uppercase">Saldo</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-accent">R$ {Number(r.balance ?? wallet?.balance ?? 0).toFixed(2)}</p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenBalanceModal(r);
                                  }}
                                  className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors ml-2"
                                  title="Editar Saldo"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="rounded-lg bg-secondary/50 p-2.5">
                              <p className="text-[10px] text-muted-foreground uppercase">Total Depositado</p>
                              <p className="text-sm font-bold text-foreground">R$ {totalDeposited.toFixed(2)}</p>
                            </div>
                            <div className="rounded-lg bg-secondary/50 p-2.5">
                              <p className="text-[10px] text-muted-foreground uppercase">Entregues</p>
                              <p className="text-sm font-bold text-foreground">{userCompleted.length}</p>
                            </div>
                            <div className="rounded-lg bg-warning/5 border border-warning/20 p-2.5">
                              <p className="text-[10px] text-warning uppercase font-medium">Pendentes</p>
                              <p className="text-sm font-bold text-warning">{userPending.length}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order filter tabs */}
                    <div className="flex gap-2">
                      {customerOrderFilterTabs.map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setCustomerOrderFilter(tab.key)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${customerOrderFilter === tab.key
                            ? tab.key === 'pending' ? 'bg-warning/10 text-warning' : tab.key === 'completed' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          {tab.label} ({tab.count})
                        </button>
                      ))}
                    </div>

                    {/* Order list */}
                    <div className="space-y-2">
                      {filteredCustomerOrders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm">Nenhum pedido nesta categoria.</div>
                      ) : (
                        filteredCustomerOrders.map(order => {
                          const s = statusConfig[order.status] || statusConfig.pending;
                          const StatusIcon = s.icon;
                          return (
                            <div key={order.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4 hover:bg-card transition-colors">
                              <StatusIcon className={`h-5 w-5 shrink-0 ${s.pulse ? 'animate-pulse text-warning' : order.status === 'completed' ? 'text-accent' : order.status === 'cancelled' ? 'text-destructive' : 'text-primary'}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-semibold text-foreground">{order.product_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <button
                                    onClick={() => copyEmail(order)}
                                    className="flex items-center gap-1 hover:text-primary transition-colors font-mono"
                                  >
                                    {copiedId === order.id ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
                                    {order.lovable_email}
                                  </button>
                                  <span>· {new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                                {/* Show delivery link for completed orders */}
                                {order.status === 'completed' && order.delivery_link && (
                                  <div className="mt-2 flex items-center gap-2 text-xs">
                                    <Link className="h-3 w-3 text-accent" />
                                    <span className="font-mono text-muted-foreground truncate max-w-[200px]">{order.delivery_link}</span>
                                    <a href={order.delivery_link} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80">
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <p className="text-sm font-bold text-foreground">R$ {Number(order.price_at_purchase).toFixed(2)}</p>
                                  <Badge variant="outline" className={`text-[10px] ${s.className}`}>{s.label}</Badge>
                                </div>
                                {(order.status === 'pending' || order.status === 'processing') && (
                                  <div className="flex gap-1.5">
                                    <Button size="sm" onClick={() => openDeliverModal(order)} className="bg-accent hover:bg-accent/90 text-accent-foreground h-8 w-8 p-0">
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setCancelModal(order)} className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0">
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </section>
        )}
        {/* ============ PRODUCTS TAB ============ */}
        {activeTab === 'products' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Gerenciar Produtos
              </h2>
              <Button size="sm" onClick={() => handleOpenProductModal()} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1.5" />
                Novo Produto
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map(product => (
                <div key={product.id} className="relative rounded-2xl border border-border bg-card p-5 group hover:border-primary/50 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-foreground">{product.name}</h3>
                    <Badge variant="outline" className={product.active ? 'text-accent border-accent/20 bg-accent/10' : 'text-muted-foreground'}>
                      {product.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="space-y-1 mb-4">
                    <p className="text-sm text-muted-foreground flex justify-between">
                      <span>Créditos:</span> <span className="text-foreground font-mono">{product.credits_amount}</span>
                    </p>
                    <p className="text-sm text-muted-foreground flex justify-between">
                      <span>Preço:</span> <span className="text-accent font-bold">R$ {product.price.toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenProductModal(product)} className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============ ACADEMY TAB ============ */}
        {activeTab === 'academy' && (
          <section>
            <AdminAcademy />
          </section>
        )}

        {/* ============ LICENSES TAB ============ */}
        {activeTab === 'licenses' && (
          <section>
            <AdminLicenses />
          </section>
        )}
      </main>

      {/* Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Pacote</Label>
              <Input
                value={editingProduct.name || ''}
                onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                placeholder="Ex: Start"
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Créditos</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={editingProduct.credits_amount || 0}
                  onChange={e => setEditingProduct({ ...editingProduct, credits_amount: Number(e.target.value) })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct.price || 0}
                  onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={editingProduct.active}
                onChange={e => setEditingProduct({ ...editingProduct, active: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="active" className="cursor-pointer">Ativo para venda</Label>
            </div>
            <Button onClick={handleSaveProduct} className="w-full bg-primary text-primary-foreground">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Balance Edit Modal */}
      <Dialog open={isBalanceModalOpen} onOpenChange={setIsBalanceModalOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Saldo de {editingBalanceUser?.full_name}</DialogTitle>
            <DialogDescription>
              O saldo atual é R$ {Number(editingBalanceUser?.balance || 0).toFixed(2)}.
              Digite o novo valor final abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label>Novo Saldo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={newBalanceValue}
                onChange={(e) => setNewBalanceValue(e.target.value)}
                placeholder="0.00"
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">
                Isso criará uma transação de ajuste automaticamente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBalanceModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveBalance}>Salvar Alteração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Deliver Modal */}
      <Dialog open={!!deliverModal} onOpenChange={() => { setDeliverModal(null); setDeliveryLink(''); }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-accent">
              <Send className="h-5 w-5" />
              Entregar Pedido
            </DialogTitle>
            <DialogDescription>
              Insira o link de entrega para <span className="font-bold text-foreground">{deliverModal?.user_name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-accent/5 border border-accent/20 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Produto</span>
                <span className="font-medium text-foreground">{deliverModal?.product_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">E-mail</span>
                <span className="font-mono text-xs text-foreground">{deliverModal?.lovable_email}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-bold text-foreground">R$ {Number(deliverModal?.price_at_purchase || 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Link className="h-3.5 w-3.5" />
                Link de entrega
              </label>
              <Input
                type="url"
                placeholder="https://lovable.dev/credits/..."
                value={deliveryLink}
                onChange={e => setDeliveryLink(e.target.value)}
                className="bg-secondary border-border font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="font-bold text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">ID</span>
                ID de Controle / Transação (Opcional)
              </label>
              <Input
                placeholder="Ex: #d6ca0216"
                value={deliveryControlId}
                onChange={e => setDeliveryControlId(e.target.value)}
                className="bg-secondary border-border font-mono text-xs"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => { setDeliverModal(null); setDeliveryLink(''); }} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={confirmDeliver}
                disabled={!deliveryLink.trim()}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              >
                <Send className="h-4 w-4 mr-1.5" />
                Confirmar Entrega
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={!!cancelModal} onOpenChange={() => { setCancelModal(null); setCancelReason(''); }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Cancelar Pedido
            </DialogTitle>
            <DialogDescription>
              {cancelModal?.status === 'completed' ? (
                <span className="text-destructive font-semibold">
                  Este pedido já foi entregue. Deseja realmente estornar o valor para a carteira do cliente e cancelar o acesso?
                </span>
              ) : (
                <>
                  O valor de <span className="font-bold text-foreground">R$ {Number(cancelModal?.price_at_purchase || 0).toFixed(2)}</span> será estornado para <span className="font-bold text-foreground">{cancelModal?.user_name}</span>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pedido</span>
                <span className="font-medium text-foreground">{cancelModal?.product_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">E-mail</span>
                <span className="font-mono text-xs text-foreground">{cancelModal?.lovable_email}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Estorno</span>
                <span className="font-bold text-foreground">R$ {Number(cancelModal?.price_at_purchase || 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setCancelModal(null)} className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={confirmCancel}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Confirmar Cancelamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Modal - Only visual now */}
      <Dialog open={inviteModal} onOpenChange={setInviteModal}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <UserPlus className="h-5 w-5" />
              Convidar Revendedor
            </DialogTitle>
            <DialogDescription>
              Envie um convite por e-mail para um novo revendedor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                placeholder="Ex: João da Silva"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                placeholder="Ex: joao@email.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setInviteModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => inviteCustomer(inviteName, inviteEmail)}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                <Send className="h-4 w-4 mr-1.5" />
                Enviar Convite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Customer Modal */}
      <Dialog open={!!deleteCustomerId} onOpenChange={() => setDeleteCustomerId(null)}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <UserX className="h-5 w-5" />
              Excluir Cliente?
            </DialogTitle>
            <DialogDescription className="text-foreground/80">
              Tem certeza? Isso apagará TODO o histórico financeiro, pedidos e saldo deste usuário permanentemente. Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="ghost" onClick={() => setDeleteCustomerId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCustomer}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Confirmar Exclusão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
