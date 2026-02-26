import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Key, Search, Filter, Download, RefreshCw, 
  CheckCircle2, XCircle, Clock, AlertCircle, ArrowLeft 
} from 'lucide-react';
import { toast } from 'sonner';
import { licensesAPI } from '@/lib/licenses-api';
import { useNavigate } from 'react-router-dom';

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
      {/* Back Button */}
      <Button 
        onClick={() => navigate('/dashboard')} 
        variant="ghost" 
        size="sm"
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar ao Dashboard
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            Gerenciar Licenças
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visão completa de todas as licenças do sistema
          </p>
        </div>
        <Button onClick={loadLicenses} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <Key className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-green-500/20 bg-green-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Ativas</p>
              <p className="text-2xl font-bold text-green-500">{stats.active}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-orange-500/20 bg-orange-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Expiradas</p>
              <p className="text-2xl font-bold text-orange-500">{stats.expired}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-red-500/20 bg-red-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Bloqueadas</p>
              <p className="text-2xl font-bold text-red-500">{stats.blocked}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, chave ou revendedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            Todas
          </Button>
          <Button
            variant={statusFilter === 'Ativa' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('Ativa')}
          >
            Ativas
          </Button>
          <Button
            variant={statusFilter === 'Expirada' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('Expirada')}
          >
            Expiradas
          </Button>
          <Button
            variant={statusFilter === 'Bloqueada' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('Bloqueada')}
          >
            Bloqueadas
          </Button>
        </div>
      </div>

      {/* Licenses Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : licenses.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Nenhuma licença encontrada</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {licenses.map((license) => {
            const statusConfig = getStatusConfig(license.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={license.id} className="p-4 border-border hover:border-primary/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground">{license.client_name}</h3>
                      <Badge variant="outline" className={statusConfig.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Chave:</span>
                        <p className="font-mono text-xs text-foreground">{license.key}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Plano:</span>
                        <p className="text-foreground">{license.plan}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expira em:</span>
                        <p className="text-foreground">{formatDate(license.expires_at)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Criada em:</span>
                        <p className="text-foreground">{formatDate(license.created_at)}</p>
                      </div>
                    </div>

                    {license.client_whatsapp && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">WhatsApp:</span>
                        <span className="ml-2 text-foreground">{license.client_whatsapp}</span>
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
