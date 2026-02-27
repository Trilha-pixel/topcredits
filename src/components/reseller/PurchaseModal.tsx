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
import PurchaseSuccessModal from './PurchaseSuccessModal';

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ open, onOpenChange, product }) => {
  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [orderData, setOrderData] = useState<{ deliveryLink: string; credits: number; orderId: string } | null>(null);

  if (!product) return null;

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }

      console.log('[PurchaseModal] Enviando pedido...');

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          productId: product.id
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
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

      if (!data?.success) {
        console.error('[PurchaseModal] Response sem success:', data);
        throw new Error(data?.error || 'Erro desconhecido ao processar compra');
      }

      // Aguardar o link ser gerado (polling)
      const orderId = data.order.id;
      let attempts = 0;
      const maxAttempts = 30; // 30 segundos
      
      toast.loading('Gerando link de entrega...', { id: 'generating-link' });
      
      const checkLink = async (): Promise<string> => {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('delivery_link')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        const link = orderData?.delivery_link;
        
        // Verifica se o link foi gerado e não é um erro
        if (link && link !== 'GERANDO LINK...' && !link.startsWith('ERRO_')) {
          return link;
        }
        
        if (link?.startsWith('ERRO_')) {
          throw new Error(`Erro ao gerar link: ${link}`);
        }

        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Timeout ao gerar link de entrega');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        return checkLink();
      };

      const deliveryLink = await checkLink();
      
      toast.dismiss('generating-link');

      // Sucesso! Mostrar modal de sucesso
      setOrderData({
        deliveryLink,
        credits: product.credits_amount,
        orderId
      });
      
      onOpenChange(false);
      
      setTimeout(() => {
        setSuccessModalOpen(true);
      }, 300);

    } catch (error: any) {
      console.error('[PurchaseModal] Erro na compra:', error);
      toast.dismiss('generating-link');
      toast.error(error.message || 'Erro ao processar compra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
    
    {orderData && (
      <PurchaseSuccessModal
        open={successModalOpen}
        onOpenChange={setSuccessModalOpen}
        deliveryLink={orderData.deliveryLink}
        credits={orderData.credits}
        productName={product.name}
      />
    )}
    </>
  );
};

export default PurchaseModal;
