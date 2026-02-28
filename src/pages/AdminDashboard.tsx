import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminData } from '@/hooks/useAdminData';
import { useNavigate } from 'react-router-dom';
import { AdminStats } from '@/types';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  LogOut, Search, MoreVertical, Check, X,
  Eye, Edit, Trash2, Plus, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { DiagnosticPanel } from '@/components/admin/DiagnosticPanel';
import CouponsTab from '@/components/admin/CouponsTab';
import { toast } from 'sonner';

type Tab = 'overview' | 'orders' | 'customers' | 'products' | 'coupons';

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
    { id: 'coupons', label: 'Cupons', icon: Tag },
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
        {activeTab === 'customers' && <CustomersTab customers={customers} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
        {activeTab === 'products' && <ProductsTab products={products} />}
        {activeTab === 'coupons' && <CouponsTab />}
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
                    <Badge variant="outline" className={`text-xs ${order.status === 'completed' ? 'bg-accent/10 text-accent border-accent/20' :
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { updateProduct, createProduct } = useAdminData();

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
      <div className="flex justify-between items-center">
        <h2 className="text-sm text-muted-foreground uppercase tracking-wider">Produtos</h2>
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
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
                  <Badge variant="outline" className={`text-xs mt-1 ${product.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground'
                    }`}>
                    {product.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex gap-1">
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
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product, title }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    credits_amount: product?.credits_amount || '',
    price: product?.price || '',
    active: product?.active ?? true,
    category: product?.category || 'credits',
    unit_cost_brl: product?.unit_cost_brl || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        credits_amount: product.credits_amount || '',
        price: product.price || '',
        active: product.active ?? true,
        category: product.category || 'credits',
        unit_cost_brl: product.unit_cost_brl || '',
      });
    }
  }, [product]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>

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

          <div>
            <label className="text-sm text-muted-foreground">Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="credits">Créditos</option>
              <option value="api_extension">Extensão de API</option>
            </select>
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

export default AdminDashboard;
