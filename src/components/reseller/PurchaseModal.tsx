import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Product } from '@/types';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ open, onOpenChange, product }) => {
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');

  if (!product) return null;

  const handleConfirm = async () => {
    if (loading) return; // Prevent double clicks
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }

      // Log para debug
      console.log('[PurchaseModal] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('[PurchaseModal] Function URL:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-order`);
      console.log('[PurchaseModal] Enviando pedido para create-order...');
      console.log('[PurchaseModal] Product ID:', product.id);
      console.log('[PurchaseModal] Customer Name:', customerName.trim() || 'N/A');

      // Using supabase.functions.invoke with explicit headers
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          productId: product.id,
          customerName: customerName.trim() || undefined
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('[PurchaseModal] Resposta recebida:', { data, error });

      if (error) {
        console.error('[PurchaseModal] Erro na invocação:', error);
        throw error;
      }

      if (data?.error) {
        console.error('[PurchaseModal] Erro no data:', data.error);
        throw new Error(data.error);
      }

      toast.success(`Pedido realizado! Aguarde o envio do link.`);
      setCustomerName(''); // Reset
      onOpenChange(false);

    } catch (error: any) {
      console.error('[PurchaseModal] Erro na compra:', error);
      toast.error(error.message || 'Erro ao processar compra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Zap className="h-5 w-5 text-primary" />
            Confirmar Compra
          </DialogTitle>
          <DialogDescription>
            {product.name} — R$ {product.price.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Você vai receber</p>
            <p className="text-3xl font-bold text-primary mb-1">{product.credits_amount} créditos</p>
            <p className="text-sm text-foreground font-medium">Investimento: R$ {product.price.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName">Identificação do Cliente (Opcional)</Label>
            <Input
              id="customerName"
              placeholder="Ex: Nome do Cliente, ID, etc."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Isso ajuda você a identificar de quem é este pedido no histórico.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20"
            >
              {loading ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseModal;
