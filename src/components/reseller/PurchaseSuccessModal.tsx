import React, { useState, useEffect } from 'react';
import { CheckCircle2, ExternalLink, Copy, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PurchaseSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryLink: string;
  credits: number;
  productName: string;
}

const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
  open,
  onOpenChange,
  deliveryLink,
  credits,
  productName,
}) => {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setCopied(false);
    }
  }, [open]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(deliveryLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenLink = () => {
    window.open(deliveryLink, '_blank');
    setStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="relative">
              <CheckCircle2 className="h-8 w-8 text-green-500 animate-in zoom-in duration-500" />
              <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              Compra Realizada!
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Success Message */}
          <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <Sparkles className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">
                {credits} créditos adquiridos
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {productName}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {/* Step 1 */}
            <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              step === 1 
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20' 
                : 'border-border bg-card/50'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  1
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground">Acesse o Link de Entrega</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clique no botão abaixo para abrir a página de configuração
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleOpenLink}
                      className="flex-1 h-12 text-base font-semibold shadow-lg shadow-primary/20 group"
                    >
                      <ExternalLink className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                      Abrir Link de Entrega
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      size="icon"
                      className="h-12 w-12"
                    >
                      <Copy className={`h-5 w-5 ${copied ? 'text-green-500' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              step === 2 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-card/50 opacity-60'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Configure a Entrega</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Na página que abrir, escolha como deseja receber seus créditos:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Criar novo workspace
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Adicionar a workspace existente
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl border-2 border-border bg-card/50 opacity-60">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold bg-muted text-muted-foreground">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Pronto! 🎉</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seus créditos serão entregues automaticamente após a configuração
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-400 flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Você pode acessar este link a qualquer momento na página "Meus Pedidos"
              </span>
            </p>
          </div>

          {/* Close Button */}
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseSuccessModal;
