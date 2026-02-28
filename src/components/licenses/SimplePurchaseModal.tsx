import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Tag, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { licensesAPI, Plan as APIplan } from '@/lib/licenses-api';
import { couponsAPI } from '@/lib/coupons-api';
import { CouponValidationResult } from '@/types';

interface DisplayPlan {
  id: string;
  name: string;
  duration: string;
  price: number;
  tokenCost: number;
  features: string[];
  popular?: boolean;
}

// Mapeamento de preços fixos (B2C)
const PLAN_PRICES: Record<number, number> = {
  3: 39.90,  // 1 dia = 3 tokens = R$ 39.90
  4: 97.90   // 7 dias = 4 tokens = R$ 97.90
};

interface SimplePurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletBalance: number; // Saldo em R$ da carteira
  onSuccess: () => void;
}

const SimplePurchaseModal: React.FC<SimplePurchaseModalProps> = ({
  open,
  onOpenChange,
  walletBalance,
  onSuccess
}) => {
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DisplayPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [clientName, setClientName] = useState('');
  const [clientWhatsApp, setClientWhatsApp] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Carregar planos da API
  useEffect(() => {
    if (open) {
      loadPlans();
    }
  }, [open]);

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await licensesAPI.getPlans();

      // Converter planos da API para formato de exibição
      const displayPlans: DisplayPlan[] = response.plans.map((plan: APIplan) => {
        const price = PLAN_PRICES[plan.token_cost] || 0;
        const isPopular = plan.duration_days === 7;

        return {
          id: plan.id,
          name: plan.name,
          duration: `${plan.duration_days} ${plan.duration_days === 1 ? 'dia' : 'dias'} de acesso`,
          price,
          tokenCost: plan.token_cost,
          popular: isPopular,
          features: plan.duration_days === 1 ? [
            'Acesso completo por 1 dia',
            'Suporte via WhatsApp',
            'Ativação imediata'
          ] : [
            `Acesso completo por ${plan.duration_days} dias`,
            'Suporte prioritário',
            'Ativação imediata',
            'Melhor custo-benefício'
          ]
        };
      });

      setPlans(displayPlans);
    } catch (error: any) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos disponíveis');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    if (!clientName.trim() || !clientWhatsApp.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      // Determine final price (with coupon)
      const finalPrice = couponResult?.valid && couponResult.final_value !== undefined
        ? couponResult.final_value
        : selectedPlan.price;

      // Verifica saldo em R$
      if (walletBalance < finalPrice) {
        toast.error(`Saldo insuficiente. Você precisa de R$ ${finalPrice.toFixed(2)} mas tem apenas R$ ${walletBalance.toFixed(2)}.`);
        setLoading(false);
        return;
      }

      // Gera a licença (a API vai debitar do saldo)
      const response = await licensesAPI.generateLicense({
        plan_id: selectedPlan.id,
        client_name: clientName.trim(),
        client_whatsapp: clientWhatsApp.trim()
      });

      // Incrementa uso do cupom se foi aplicado
      if (couponResult?.valid && couponResult.coupon_id) {
        try {
          await couponsAPI.apply(couponResult.coupon_id);
        } catch (err) {
          console.warn('Erro ao incrementar uso do cupom:', err);
        }
      }

      toast.success('Licença gerada com sucesso!');

      // Copiar chave para clipboard
      navigator.clipboard.writeText(response.key);
      toast.success(`Chave copiada: ${response.key}`, { duration: 10000 });

      // Reset e fecha
      setClientName('');
      setClientWhatsApp('');
      setSelectedPlan(null);
      setCouponCode('');
      setCouponResult(null);
      onOpenChange(false);
      onSuccess();

    } catch (error: any) {
      console.error('Erro ao gerar licença:', error);
      toast.error(error.message || 'Erro ao gerar licença');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Gerar Licença
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Saldo em R$ */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Saldo Disponível:</span>
              <span className="text-xl font-bold text-primary">R$ {walletBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Plans */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Escolha um Plano</h3>
            {loadingPlans ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum plano disponível no momento
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative p-4 cursor-pointer transition-all ${selectedPlan?.id === plan.id
                      ? 'border-primary shadow-lg shadow-primary/20'
                      : 'hover:border-primary/50'
                      }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-2 right-4">
                        <span className="bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-semibold">
                          Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <h4 className="text-xl font-bold text-foreground mb-1">{plan.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{plan.duration}</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold text-primary">
                          R$ {plan.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {selectedPlan?.id === plan.id && (
                      <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          {selectedPlan && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-lg font-semibold">Dados do Cliente</h3>

              <div>
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input
                  id="clientName"
                  placeholder="Ex: João Silva"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="clientWhatsApp">WhatsApp do Cliente</Label>
                <Input
                  id="clientWhatsApp"
                  placeholder="Ex: 5511999999999"
                  value={clientWhatsApp}
                  onChange={(e) => setClientWhatsApp(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formato: 55 + DDD + número (sem espaços)
                </p>
              </div>

              {/* Coupon Input */}
              <div className="border-t border-border pt-4">
                <Label>Cupom de Desconto</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={couponCode}
                      onChange={e => {
                        setCouponCode(e.target.value.toUpperCase());
                        if (couponResult) setCouponResult(null);
                      }}
                      placeholder="CODIGO"
                      className="pl-9 uppercase font-mono tracking-wider"
                      disabled={validatingCoupon}
                    />
                  </div>
                  {couponResult?.valid ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => { setCouponCode(''); setCouponResult(null); }}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!couponCode.trim() || validatingCoupon || !selectedPlan}
                      onClick={async () => {
                        if (!selectedPlan) return;
                        setValidatingCoupon(true);
                        try {
                          const result = await couponsAPI.validate(couponCode, selectedPlan.price);
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
                      }}
                    >
                      {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                    </Button>
                  )}
                </div>
                {couponResult?.valid && (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-500 font-medium">
                      {couponResult.discount_type === 'percentage'
                        ? `${couponResult.discount_value}% de desconto aplicado`
                        : `R$ ${Number(couponResult.discount_value).toFixed(2)} de desconto aplicado`}
                      {' '}— Economia: R$ {Number(couponResult.discount_amount).toFixed(2)}
                    </p>
                  </div>
                )}
                {couponResult && !couponResult.valid && (
                  <p className="text-xs text-destructive mt-1">{couponResult.error}</p>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Resumo da Compra</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plano:</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className={`font-medium ${couponResult?.valid ? 'line-through text-muted-foreground' : ''}`}>
                      R$ {selectedPlan.price.toFixed(2)}
                    </span>
                  </div>
                  {couponResult?.valid && (
                    <>
                      <div className="flex justify-between text-emerald-500">
                        <span>Desconto ({couponResult.code}):</span>
                        <span className="font-medium">- R$ {Number(couponResult.discount_amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
                        <span>Total:</span>
                        <span>R$ {Number(couponResult.final_value).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Saldo após compra:</span>
                    <span className={`font-bold ${walletBalance >= (couponResult?.valid ? Number(couponResult.final_value) : selectedPlan.price)
                      ? 'text-green-500' : 'text-red-500'
                      }`}>
                      R$ {(walletBalance - (couponResult?.valid ? Number(couponResult.final_value) : selectedPlan.price)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePurchase}
                disabled={loading || walletBalance < (couponResult?.valid ? Number(couponResult.final_value) : selectedPlan.price)}
                className="w-full h-11"
              >
                {loading ? 'Gerando...' : `Comprar por R$ ${(couponResult?.valid ? Number(couponResult.final_value) : selectedPlan.price).toFixed(2)}`}
              </Button>

              {walletBalance < (couponResult?.valid ? Number(couponResult.final_value) : selectedPlan.price) && (
                <p className="text-sm text-red-500 text-center">
                  Saldo insuficiente. Faça um depósito para continuar.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimplePurchaseModal;
