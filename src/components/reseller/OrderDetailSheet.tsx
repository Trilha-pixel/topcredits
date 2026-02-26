import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Clock, CheckCircle2, XCircle, MessageCircle, Info, ChevronRight, User, Hash, Calendar, DollarSign, Package, GraduationCap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { Order } from '@/types';
import { supabase } from '@/lib/supabase';
import { OrderTrackingStepper } from './OrderTrackingStepper';

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  pending: { label: 'Pendente', icon: Clock, className: 'bg-muted text-muted-foreground border-transparent' },
  processing: { label: 'Processando', icon: Clock, className: 'bg-primary/10 text-primary border-primary/20' },
  completed: { label: 'Concluído', icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  cancelled: { label: 'Cancelado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

interface Props {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrderDetailSheet: React.FC<Props> = ({ order: initialOrder, open, onOpenChange }) => {
  const isMobile = useIsMobile();
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  // Realtime Subscription
  useEffect(() => {
    if (!order || !open || order.delivery_link || order.status === 'cancelled') return;

    const channel = supabase
      .channel(`order-detail-${order.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
        (payload) => setOrder(payload.new as Order)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [order?.id, order?.delivery_link, order?.status, open]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm('Deseja realmente cancelar? O valor será estornado.')) return;

    setIsCancelling(true);
    const toastId = toast.loading('Solicitando cancelamento...');

    try {
      const { data, error } = await supabase.functions.invoke('cancel-order', { body: { orderId: order.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Pedido cancelado e reembolsado.', { id: toastId });
      setOrder(prev => prev ? { ...prev, status: 'cancelled', delivery_link: null } : null);
    } catch (err: any) {
      toast.error('Erro ao cancelar.', { id: toastId, description: err.message });
    } finally {
      setIsCancelling(false);
    }
  };

  if (!order) return null;

  const s = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = s.icon;
  const isProcessing = order.status === 'completed' && (!order.delivery_link || order.delivery_link === 'PROCESSING_CLAIM' || order.delivery_link.startsWith('PROCESSANDO'));
  const isError = !!order.delivery_link && order.delivery_link.startsWith('ERRO');
  const isDelivered = !!order.delivery_link && !isProcessing && !isError && order.status !== 'cancelled';

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? 'bottom' : 'right'} className={`p-0 gap-0 border-l border-white/10 ${isMobile ? 'max-h-[90vh] rounded-t-xl' : ''}`}>

        {/* Header Section */}
        <div className="p-6 border-b border-white/5 bg-card/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Produto {order.product_name}
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                ID: {order.id}
              </p>
            </div>
            <Badge variant="outline" className={`rounded-full px-3 py-1 text-xs font-medium border ${s.className}`}>
              <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
              {s.label}
            </Badge>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Valor
              </span>
              <p className="text-sm font-medium">R$ {order.price_at_purchase.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Data
              </span>
              <p className="text-sm font-medium">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            {order.customer_name && (
              <div className="col-span-2 space-y-1 pt-2 border-t border-white/5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <User className="h-3 w-3" /> Cliente
                </span>
                <p className="text-sm font-medium">{order.customer_name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-220px)] space-y-8">

          {/* 1. DELIVERY SECTION (Main Focus) */}
          {isDelivered && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <h3 className="text-sm font-bold text-foreground">Entrega Realizada</h3>
              </div>

              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Link de Ativação / Token</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-background/50 border border-white/10 rounded px-3 py-2.5 font-mono text-xs text-foreground truncate select-all">
                      {order.delivery_link}
                    </div>
                    <Button size="icon" variant="outline" className="h-9 w-9 shrink-0 border-white/10 hover:bg-white/5" onClick={() => copyText(order.delivery_link!)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/20" asChild>
                  <a href={order.delivery_link!} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Acessar Créditos Agora
                  </a>
                </Button>
              </div>

              {/* Instructions - Reduced */}
              <div className="rounded-lg border border-white/5 bg-card/30 p-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" /> Instruções Importantes
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Para garantir o recebimento correto dos seus créditos, é <strong>obrigatório</strong> assistir às duas primeiras aulas do <strong>Módulo 1</strong> na Top Academy.
                  </p>
                </div>

                <Button variant="secondary" className="w-full justify-start h-auto py-3 px-4 bg-secondary/50 hover:bg-secondary/80 border border-white/5" asChild>
                  <Link
                    to="/academy"
                    className="flex items-center gap-3"
                    onClick={() => onOpenChange(false)}
                  >
                    <div className="bg-primary/20 p-2 rounded-full">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-foreground">Acessar Top Academy</p>
                      <p className="text-[10px] text-muted-foreground">Assistir aulas do Módulo 1</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* 2. PROCESSING / TRACKING SECTION */}
          {(isProcessing || order.status === 'pending') && !isError && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground">Status do Processamento</h3>
              <div className="rounded-lg border border-white/5 bg-card/30 p-4">
                <OrderTrackingStepper orderId={order.id} localStatus={order.status} />
              </div>
            </div>
          )}

          {/* 3. ERROR SECTION */}
          {isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <h3 className="font-bold text-sm">Falha na Entrega</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                O sistema encontrou um erro: <span className="font-mono text-destructive">{order.delivery_link}</span>
              </p>
              <Button variant="outline" size="sm" className="w-full border-destructive/20 hover:bg-destructive/10 text-destructive" asChild>
                <a href="https://wa.me/5524992224589" target="_blank" rel="noopener noreferrer">Falar com Suporte</a>
              </Button>
            </div>
          )}
        </div>

        {/* Footer Actions (Cancel / Close) */}
        {!isDelivered && order.status !== 'cancelled' && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-background/80 backdrop-blur-sm">
            <Button
              variant="ghost"
              className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
              onClick={handleCancelOrder}
              disabled={isCancelling}
            >
              {isCancelling ? <span className="flex items-center gap-2"><div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> Cancelando...</span> : 'Cancelar Pedido e Reembolsar'}
            </Button>
          </div>
        )}

      </SheetContent>
    </Sheet>
  );
};

export default OrderDetailSheet;
