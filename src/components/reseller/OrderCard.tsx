import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, XCircle, Loader2, User, ChevronRight, Package, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const statusConfig = {
  pending: { label: 'Pendente', icon: Clock, className: 'bg-muted text-muted-foreground border-transparent' },
  processing: { label: 'Processando', icon: Loader2, className: 'bg-primary/10 text-primary border-primary/20 animate-pulse' },
  completed: { label: 'Entregue', icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  cancelled: { label: 'Cancelado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
  onCancel?: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order: initialOrder, onClick, onCancel }) => {
  const [order, setOrder] = useState<Order>(initialOrder);

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
    if (order.delivery_link || order.status === 'cancelled') return;

    const channel = supabase
      .channel(`order-update-${order.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
        (payload) => setOrder(payload.new as Order)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [order.id, order.delivery_link, order.status]);

  const handleCancelClick = (e: React.MouseEvent) => e.stopPropagation();
  const handleConfirmCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCancel) onCancel(order);
  }

  // Determine State
  const isProcessing = order.status === 'completed' && (!order.delivery_link || order.delivery_link === 'PROCESSING_CLAIM' || order.delivery_link.startsWith('PROCESSANDO'));
  const isError = !!order.delivery_link && order.delivery_link.startsWith('ERRO');
  const isDelivered = !!order.delivery_link && !isProcessing && !isError && order.status !== 'cancelled';

  // Config Status
  let s = statusConfig[order.status] || statusConfig.pending;
  if (isProcessing) s = statusConfig.processing;

  const StatusIcon = s.icon;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl border bg-card hover:bg-accent/5 transition-all duration-200 cursor-pointer overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 ${isDelivered ? 'border-emerald-500/20' : 'border-border'}`}
    >
      <div className="p-5 flex flex-col gap-4">
        {/* Header Row: Date | Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">
            {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>

          <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${s.className}`}>
            <StatusIcon className={`h-3.5 w-3.5 mr-1.5 ${isProcessing ? 'animate-spin' : ''}`} />
            {s.label}
          </Badge>
        </div>

        {/* Main Content Row: Product Name | Price */}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
              {order.product_name}
            </h4>
            {order.customer_name && (
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>{order.customer_name}</span>
              </div>
            )}
            {order.external_control_id && (
              <span className="inline-block mt-1 text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                #{order.external_control_id}
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="font-bold text-sm text-foreground">R$ {order.price_at_purchase.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer Action Area */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between">
          {/* Left Side: Status Hint */}
          <div>
            {isProcessing && (
              <span className="text-xs text-primary flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Gerando licença...
              </span>
            )}
            {isDelivered && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" /> Produto Pronto
              </span>
            )}
            {isError && (
              <span className="text-xs text-destructive flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> Erro no processamento
              </span>
            )}
            {order.status === 'pending' && (
              <span className="text-xs text-muted-foreground">
                Aguardando pagamento
              </span>
            )}
          </div>

          {/* Right Side: Action Button */}
          <div className="flex items-center gap-2">
            {order.status === 'pending' && onCancel ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    onClick={handleCancelClick}
                    className="text-xs font-medium text-destructive hover:text-destructive/80 hover:underline px-2 py-1"
                  >
                    Cancelar
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar Pedido?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O valor será estornado imediatamente para sua carteira.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive text-white hover:bg-destructive/90">
                      Confirmar Cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div className={`flex items-center gap-1 text-xs font-medium transition-colors ${isDelivered ? 'text-emerald-500' : 'text-muted-foreground group-hover:text-primary'}`}>
                <span>{isDelivered ? 'Acessar' : 'Detalhes'}</span>
                {isDelivered ? <ArrowRight className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
