import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap, Tag, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Product, CouponValidationResult } from '@/types';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { couponsAPI } from '@/lib/coupons-api';
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

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  if (!product) return null;

  const finalPrice = couponResult?.valid && couponResult.final_value !== undefined
    ? couponResult.final_value
    : product.price;

  const discountAmount = couponResult?.valid && couponResult.discount_amount !== undefined
    ? couponResult.discount_amount
    : 0;

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const result = await couponsAPI.validate(couponCode, product.price);
      setCouponResult(result);
      if (result.valid) {
        toast.success(`Cupom aplicado! Desconto de R$ ${Number(result.discount_amount).toFixed(2)}`);
      } else {
        toast.error(result.error || 'Cupom inválido');
      }
    } catch (err: any) {
      toast.error('Erro ao validar cupom');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponResult(null);
  };

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
          productId: product.id,
          couponId: couponResult?.valid ? couponResult.coupon_id : null,
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

      // Reset coupon state
      setCouponCode('');
      setCouponResult(null);
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
      <Dialog open={open} onOpenChange={(val) => { if (!val) { setCouponCode(''); setCouponResult(null); } onOpenChange(val); }}>
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

          <div className="space-y-5 pt-2">
            {/* Credits Preview */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Você vai receber</p>
              <p className="text-3xl font-bold text-primary mb-1">{product.credits_amount} créditos</p>
              {couponResult?.valid ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground line-through">R$ {product.price.toFixed(2)}</p>
                  <p className="text-lg font-bold text-emerald-500">R$ {Number(finalPrice).toFixed(2)}</p>
                  <p className="text-xs text-emerald-500">Economia de R$ {Number(discountAmount).toFixed(2)}</p>
                </div>
              ) : (
                <p className="text-sm text-foreground font-medium">Investimento: R$ {product.price.toFixed(2)}</p>
              )}
            </div>

            {/* Coupon Input */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Cupom de Desconto</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={couponCode}
                    onChange={e => {
                      setCouponCode(e.target.value.toUpperCase());
                      if (couponResult) setCouponResult(null);
                    }}
                    placeholder="CODIGO"
                    className="pl-9 uppercase font-mono tracking-wider h-10"
                    disabled={validatingCoupon || loading}
                  />
                </div>
                {couponResult?.valid ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRemoveCoupon}
                    className="h-10 w-10 border-destructive/30 text-destructive hover:bg-destructive/10 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!couponCode.trim() || validatingCoupon}
                    onClick={handleValidateCoupon}
                    className="h-10 px-4 flex-shrink-0"
                  >
                    {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                  </Button>
                )}
              </div>

              {/* Coupon Feedback */}
              {couponResult?.valid && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-emerald-500 font-medium">
                    {couponResult.discount_type === 'percentage'
                      ? `${couponResult.discount_value}% de desconto aplicado`
                      : `R$ ${Number(couponResult.discount_value).toFixed(2)} de desconto`}
                    {' '}— Economia: R$ {Number(couponResult.discount_amount).toFixed(2)}
                  </p>
                </div>
              )}
              {couponResult && !couponResult.valid && (
                <p className="text-xs text-destructive">{couponResult.error}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20"
              >
                {loading ? 'Processando...' : couponResult?.valid
                  ? `Pagar R$ ${Number(finalPrice).toFixed(2)}`
                  : 'Confirmar Pagamento'
                }
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
