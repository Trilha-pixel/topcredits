import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Key, Search, Filter, Download, RefreshCw, 
  CheckCircle2, XCircle, Clock, AlertCircle, ArrowLeft, Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';
import { licensesAPI } from '@/lib/licenses-api';
import { useNavigate } from 'react-router-dom';
import StatCard from './StatCard';

interface License {
  id: string;
  key: string;
  client_name: string;
  client_whatsapp?: string;
  status: 'Ativa' | 'Expirada' | 'Bloqueada';
  plan: string;
  expires_at: string;
  created_at: string;
  reseller_name?: string;
}

const AdminLicenses: React.FC = () => {
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await licensesAPI.getLicenses(params);
      setLicenses(response.licenses);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Erro ao carregar licenças:', error);
      toast.error('Erro ao carregar licenças: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, [currentPage, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadLicenses();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Ativa':
        return { 
          icon: CheckCircle2, 
          className: 'bg-green-500/10 text-green-500 border-green-500/20',
          label: 'Ativa'
        };
      case 'Expirada':
        return { 
          icon: Clock, 
          className: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
          label: 'Expirada'
        };
      case 'Bloqueada':
        return { 
          icon: XCircle, 
          className: 'bg-red-500/10 text-red-500 border-red-500/20',
          label: 'Bloqueada'
        };
      default:
        return { 
          icon: AlertCircle, 
          className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
          label: status
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  const stats = {
    total: total,
    active: licenses.filter(l => l.status === 'Ativa').length,
    expired: licenses.filter(l => l.status === 'Expirada').length,
    blocked: licenses.filter(l => l.status === 'Bloqueada').length,
  };

  return (
    <div className="space-y-6">
      {/* Header com gradiente */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-8">
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">Gerenciar Licenças</h2>
                <p className="text-sm text-muted-foreground">
                  Visão completa de todas as licenças do sistema
                </p>
              </div>
            </div>
          </div>
          <Button onClick={loadLicenses} variant="outline" size="sm" className="shadow-lg">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards com novo design */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Licenças"
          value={stats.total}
          icon={Key}
          variant="default"
        />
        <StatCard
          title="Licenças Ativas"
          value={stats.active}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Expiradas"
          value={stats.expired}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Bloqueadas"
          value={stats.blocked}
          icon={XCircle}
          variant="default"
        />
      </div>

      {/* Filters com design melhorado */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, chave ou revendedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 bg-background/50"
            />
          </div>
          <Button onClick={handleSearch} className="shadow-lg">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="shadow-sm"
          >
            Todas
          </Button>
          <Button
            variant={statusFilter === 'Ativa' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('Ativa')}
            className="shadow-sm"
          >
            Ativas
          </Button>
          <Button
            variant={statusFilter === 'Expirada' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('Expirada')}
            className="shadow-sm"
          >
            Expiradas
          </Button>
          <Button
            variant={statusFilter === 'Bloqueada' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('Bloqueada')}
            className="shadow-sm"
          >
            Bloqueadas
          </Button>
        </div>
      </div>

      {/* Licenses Table com cards melhorados */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
      ) : licenses.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Key className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <p className="text-lg font-medium text-foreground mb-1">Nenhuma licença encontrada</p>
          <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {licenses.map((license) => {
            const statusConfig = getStatusConfig(license.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={license.id} className="p-5 border-border hover:border-primary/50 hover:shadow-lg transition-all duration-200 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg text-foreground">{license.client_name}</h3>
                        <Badge variant="outline" className={`${statusConfig.className} shadow-sm`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Chave</span>
                        <p className="font-mono text-xs text-foreground bg-muted/50 px-2 py-1 rounded">{license.key}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Plano</span>
                        <p className="text-foreground font-medium">{license.plan}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Expira em</span>
                        <p className="text-foreground font-medium">{formatDate(license.expires_at)}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Criada em</span>
                        <p className="text-foreground font-medium">{formatDate(license.created_at)}</p>
                      </div>
                    </div>

                    {license.client_whatsapp && (
                      <div className="flex items-center gap-2 text-sm pt-2 border-t border-border/50">
                        <span className="text-muted-foreground">WhatsApp:</span>
                        <span className="font-medium text-foreground">{license.client_whatsapp}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, total)} de {total} licenças
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLicenses;
