import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Key, Plus, Copy, Check, Clock, CheckCircle2, Gift, Sparkles, Calendar, Lock, Unlock, Search, RefreshCw, Coins, DollarSign, ArrowLeft, Download, ExternalLink, Headphones, ChevronDown, Settings, GraduationCap, LogOut, Play } from 'lucide-react';
import { toast } from 'sonner';
import { licensesAPI, License, Plan } from '@/lib/licenses-api';
import { supabase } from '@/lib/supabase';
import { getLicenseErrorMessage, getTokenErrorMessage } from '@/lib/error-messages';
import logo from '@/assets/logo-neon.png';
import SimplePurchaseModal from '@/components/licenses/SimplePurchaseModal';

const Licencas = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [resellerName, setResellerName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [generateModal, setGenerateModal] = useState(false);
  const [trialModal, setTrialModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [loadingDownload, setLoadingDownload] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    loadData();
    loadDownloadUrl();
  }, [statusFilter, searchQuery, offset]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plansData, licensesData, walletData] = await Promise.all([
        licensesAPI.getPlans(),
        licensesAPI.getLicenses({
          status: statusFilter || undefined,
          search: searchQuery || undefined,
          limit,
          offset,
        }),
        // Buscar saldo da carteira
        supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user?.id)
          .single()
      ]);

      // Buscar nome do perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      setWalletBalance(Number(walletData.data?.balance || 0));
      setResellerName(profileData?.full_name || 'Cliente');
      setPlans(plansData.plans);
      setLicenses(licensesData.licenses);
      setTotal(licensesData.total);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error(getLicenseErrorMessage(error, 'load'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadDownloadUrl = async () => {
    try {
      const data = await licensesAPI.getLatestRelease();
      setDownloadUrl(data.download_url);
    } catch (error: any) {
      console.error('Erro ao carregar URL de download:', error);
    }
  };

  const handleDownloadExtension = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      toast.success('Download iniciado!');
    } else {
      toast.error('URL de download não disponível');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleGenerateSuccess = () => {
    loadData(); // Recarrega os dados após gerar licença
  };

  const handleGenerateTrialLicense = async () => {
    setIsLoading(true);
    try {
      await licensesAPI.generateTrialLicense();
      toast.success('Licença de teste gerada com sucesso!');
      setTrialModal(false);
      loadData();
    } catch (error: any) {
      console.error('Erro ao gerar teste:', error);
      toast.error(getLicenseErrorMessage(error, 'trial'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyLicenseKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success('Chave copiada!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const blockLicense = async (licenseId: string) => {
    try {
      await licensesAPI.blockLicense(licenseId);
      toast.success('Licença bloqueada com sucesso');
      loadData();
    } catch (error: any) {
      console.error('Erro ao bloquear:', error);
      toast.error(getLicenseErrorMessage(error, 'block'));
    }
  };

  const unblockLicense = async (licenseId: string) => {
    try {
      await licensesAPI.unblockLicense(licenseId);
      toast.success('Licença desbloqueada com sucesso');
      loadData();
    } catch (error: any) {
      console.error('Erro ao desbloquear:', error);
      toast.error(getLicenseErrorMessage(error, 'unblock'));
    }
  };

  const initials = user?.full_name?.substring(0, 2).toUpperCase() || 'AD';

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    'Ativa': { label: 'Ativa', icon: CheckCircle2, className: 'bg-accent/10 text-accent border-accent/20' },
    'Expirada': { label: 'Expirada', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
    'Bloqueada': { label: 'Bloqueada', icon: Lock, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  };

  // Função helper para obter config de status com fallback
  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig['Expirada']; // Fallback para Expirada
  };

  const activeLicenses = licenses.filter(l => l.status === 'Ativa').length;
  const expiredLicenses = licenses.filter(l => l.status === 'Expirada').length;
  const blockedLicenses = licenses.filter(l => l.status === 'Bloqueada').length;

  if (isLoading && licenses.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
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
                className="text-sm font-medium text-white transition-colors"
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
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
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
                      {user?.full_name || resellerName}
                    </span>
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-foreground">{user?.full_name || resellerName}</p>
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

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Explicação da Extensão */}
        <div className="relative overflow-hidden rounded-md border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8">
          <div className="absolute top-0 right-0 h-96 w-96 bg-primary/10 rounded-full blur-3xl -z-0" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Key className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-3" style={{ letterSpacing: '-0.02em' }}>
                  Extensão Lovable - Créditos Infinitos
                </h2>
                <p className="text-base text-muted-foreground font-medium leading-relaxed mb-4">
                  Nossa extensão exclusiva permite que você utilize créditos infinitos na plataforma Lovable. 
                  A extensão "congela" seus créditos, permitindo que você desenvolva projetos ilimitados sem se preocupar com o consumo.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-start gap-3 p-4 rounded-md bg-card/50 border border-border">
                    <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Créditos Congelados</p>
                      <p className="text-xs text-muted-foreground">Seus créditos não são consumidos durante o uso</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-md bg-card/50 border border-border">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">Uso Ilimitado</p>
                      <p className="text-xs text-muted-foreground">Desenvolva quantos projetos quiser</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-md bg-card/50 border border-border">
                    <Lock className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">100% Seguro</p>
                      <p className="text-xs text-muted-foreground">Extensão testada e aprovada</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vídeo Explicativo */}
            <div className="rounded-md overflow-hidden border border-border bg-black">
              <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                <iframe 
                  src="https://player.vimeo.com/video/1164109842?badge=0&autopause=0&player_id=0&app_id=58479" 
                  frameBorder="0" 
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
                  title="CONGELEI O LOVABLE! Novo Bot de Créditos Infinitos (Não Gasta Nada!)"
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                onClick={handleDownloadExtension}
                disabled={!downloadUrl || loadingDownload}
                size="lg"
                className="bg-primary hover:bg-primary/90 rounded-md px-8 font-bold"
                style={{ letterSpacing: '-0.01em' }}
              >
                <Download className="h-5 w-5 mr-2" />
                Baixar Extensão Agora
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
              <Button
                onClick={() => setGenerateModal(true)}
                size="lg"
                variant="outline"
                className="rounded-md px-8 font-bold border-primary/30 hover:bg-primary/10"
                style={{ letterSpacing: '-0.01em' }}
              >
                <Key className="h-5 w-5 mr-2" />
                Gerar Licença
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Key className="h-6 w-6 text-primary" />
              Gerenciar Licenças
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gere e gerencie licenças para a extensão Lovable
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              className="border-border hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button 
              onClick={() => setTrialModal(true)} 
              variant="outline" 
              className="border-accent/20 hover:bg-accent/10 text-accent"
            >
              <Gift className="h-4 w-4 mr-2" />
              Teste Grátis
            </Button>
            <Button 
              onClick={() => setGenerateModal(true)} 
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Gerar Licença
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-primary/5 p-6">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Saldo Disponível</p>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="text-4xl font-bold text-primary mb-4">R$ {walletBalance.toFixed(2)}</p>
              <Button 
                onClick={() => navigate('/dashboard')} 
                size="sm" 
                variant="outline" 
                className="w-full border-primary/30 hover:bg-primary/10 text-primary hover:text-primary"
              >
                <DollarSign className="h-3.5 w-3.5 mr-2" />
                Adicionar Saldo
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-accent/5 p-6">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Ativas</p>
                <CheckCircle2 className="h-5 w-5 text-accent" />
              </div>
              <p className="text-4xl font-bold text-accent">{activeLicenses}</p>
              <p className="text-xs text-muted-foreground mt-2">Licenças em uso</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Expiradas</p>
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <p className="text-4xl font-bold text-warning">{expiredLicenses}</p>
            <p className="text-xs text-muted-foreground mt-2">Precisam renovação</p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Bloqueadas</p>
              <Lock className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-4xl font-bold text-destructive">{blockedLicenses}</p>
            <p className="text-xs text-muted-foreground mt-2">Suspensas temporariamente</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou chave..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-secondary/50 border-border rounded-xl"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={statusFilter === '' ? 'default' : 'outline'} 
              size="default"
              onClick={() => setStatusFilter('')}
              className="rounded-xl"
            >
              Todos
            </Button>
            <Button 
              variant={statusFilter === 'Ativa' ? 'default' : 'outline'} 
              size="default"
              onClick={() => setStatusFilter('Ativa')}
              className="rounded-xl"
            >
              Ativas
            </Button>
            <Button 
              variant={statusFilter === 'Expirada' ? 'default' : 'outline'} 
              size="default"
              onClick={() => setStatusFilter('Expirada')}
              className="rounded-xl"
            >
              Expiradas
            </Button>
            <Button 
              variant={statusFilter === 'Bloqueada' ? 'default' : 'outline'} 
              size="default"
              onClick={() => setStatusFilter('Bloqueada')}
              className="rounded-xl"
            >
              Bloqueadas
            </Button>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="default"
              className="rounded-xl"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Licenças Geradas ({total})
          </h2>
          
          {licenses.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border border-dashed border-border bg-card/30">
              <Key className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg text-muted-foreground mb-6">Nenhuma licença encontrada</p>
              <Button onClick={() => setGenerateModal(true)} size="lg" className="bg-primary hover:bg-primary/90 rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Gerar Primeira Licença
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {licenses.map(license => {
                const s = getStatusConfig(license.status);
                const StatusIcon = s.icon;
                
                return (
                  <div key={license.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-start gap-5">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        license.status === 'Ativa' ? 'bg-accent/10' : 
                        license.status === 'Bloqueada' ? 'bg-destructive/10' : 'bg-warning/10'
                      }`}>
                        <StatusIcon className={`h-7 w-7 ${
                          license.status === 'Ativa' ? 'text-accent' :
                          license.status === 'Bloqueada' ? 'text-destructive' : 'text-warning'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-lg font-semibold text-foreground">{license.client_name}</span>
                          <Badge variant="outline" className={`${s.className} px-3 py-1`}>
                            <StatusIcon className="h-3 w-3 mr-1.5" />
                            {s.label}
                          </Badge>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                            {license.plan}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <button 
                            onClick={() => copyLicenseKey(license.key)} 
                            className="flex items-center gap-2 hover:text-primary transition-colors font-mono bg-secondary/50 px-3 py-1.5 rounded-lg"
                          >
                            {copiedKey === license.key ? (
                              <Check className="h-3.5 w-3.5 text-accent" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            {license.key}
                          </button>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Expira: {new Date(license.expires_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        {license.status === 'Ativa' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => blockLicense(license.id)} 
                            className="text-destructive hover:bg-destructive/10 h-10 w-10 p-0 rounded-xl" 
                            title="Bloquear Licença"
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        )}
                        {license.status === 'Bloqueada' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => unblockLicense(license.id)} 
                            className="text-accent hover:bg-accent/10 h-10 w-10 p-0 rounded-xl" 
                            title="Desbloquear Licença"
                          >
                            <Unlock className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {total > limit && (
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Mostrando {offset + 1} - {Math.min(offset + limit, total)} de {total}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="default"
                  className="rounded-xl"
                  onClick={() => setOffset(Math.max(0, offset - limit))} 
                  disabled={offset === 0}
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="default"
                  className="rounded-xl"
                  onClick={() => setOffset(offset + limit)} 
                  disabled={offset + limit >= total}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Simple Purchase Modal - B2C */}
      <SimplePurchaseModal
        open={generateModal}
        onOpenChange={setGenerateModal}
        walletBalance={walletBalance}
        onSuccess={handleGenerateSuccess}
      />

      <Dialog open={trialModal} onOpenChange={setTrialModal}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Gift className="h-5 w-5" />
              Gerar Teste Grátis
            </DialogTitle>
            <DialogDescription>Crie uma licença de teste temporária sem custo de tokens</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-accent/5 border border-accent/20 p-4 text-center">
              <Gift className="h-12 w-12 mx-auto mb-3 text-accent" />
              <p className="text-sm text-muted-foreground">Esta licença será gerada gratuitamente e terá duração limitada para demonstração</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setTrialModal(false)}>Cancelar</Button>
            <Button onClick={handleGenerateTrialLicense} disabled={isLoading} className="bg-primary hover:bg-primary/90">
              <Gift className="h-4 w-4 mr-2" />
              Gerar Teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Licencas;
