
import React, { useState } from 'react';
import { Wallet, Copy, Check, Loader2, ArrowLeft, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const presets = [50, 100, 200, 500];

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ open, onOpenChange }) => {
  const [value, setValue] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);

  // Estado do PIX Gerado
  const [generated, setGenerated] = useState(false);
  const [pixPayload, setPixPayload] = useState('');
  const [pixImage, setPixImage] = useState('');
  const [copied, setCopied] = useState(false);

  // Carrega dados do usuário ao abrir
  React.useEffect(() => {
    if (open) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          setName(data.session.user.user_metadata?.full_name || '');
        }
      });
    }
  }, [open]);

  const handleGenerate = async () => {
    if (!value || Number(value) < 10) {
      toast.error('Valor mínimo de R$ 10,00');
      return;
    }
    if (!name || !cpf || cpf.length < 11) {
      toast.error('Preencha Nome e CPF corretamente.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-payment-pix', {
        body: {
          amount: Number(value),
          name,
          cpfCnpj: cpf.replace(/\D/g, ''),
          email: session.user.email
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const payload = data.payload || data.qrCode?.payload;
      const image = data.encodedImage || data.qrCode?.encodedImage;

      if (!payload || !image) {
        throw new Error('Falha ao receber dados do PIX.');
      }

      setPixPayload(payload);
      setPixImage(image);
      setGenerated(true);
      toast.success('PIX Gerado! Aguardando pagamento.');

    } catch (error: any) {
      console.error('Erro PIX:', error);
      toast.error(error.message || 'Erro ao gerar PIX.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setTimeout(() => {
        setGenerated(false);
        setPixPayload('');
        setPixImage('');
        setValue('');
      }, 300);
    }
    onOpenChange(isOpen);
  };

  const handleBack = () => {
    setGenerated(false);
    setPixPayload('');
    setPixImage('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!bg-zinc-950 !border-zinc-800 sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl rounded-2xl">

        {/* Header fixo no topo */}
        <DialogHeader className="p-6 pb-4 shrink-0 border-b border-zinc-900">
          <DialogTitle className="flex items-center gap-2 text-white text-xl font-bold">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Wallet className="h-5 w-5" />
            </div>
            Adicionar Saldo
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {generated ? 'Pagamento via PIX instantâneo' : 'Escolha o valor para recarregar sua conta'}
          </DialogDescription>
        </DialogHeader>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          {!generated ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Presets */}
              <div className="grid grid-cols-4 gap-2">
                {presets.map((p) => (
                  <button
                    key={p}
                    onClick={() => setValue(String(p))}
                    className={`rounded-xl px-1 py-3 text-sm font-semibold transition-all border ${value === String(p)
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800'
                      }`}
                  >
                    R$ {p}
                  </button>
                ))}
              </div>

              {/* Campos */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-500 uppercase font-bold tracking-wider ml-1">Valor Personalizado</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg font-medium">R$</span>
                    <Input
                      type="number"
                      min="10"
                      step="0.01"
                      placeholder="0,00"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white text-lg h-14 pl-12 rounded-xl focus-visible:ring-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500 ml-1">Nome Completo</Label>
                    <Input
                      placeholder="Nome do titular da conta"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white h-11 rounded-xl focus-visible:ring-emerald-500/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-500 ml-1">CPF do Pagador</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white h-11 rounded-xl focus-visible:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex flex-col items-center animate-in zoom-in-95 duration-300 py-2">

              {/* Total */}
              <div className="text-center space-y-1">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  Total a Pagar
                </span>
                <p className="text-4xl font-extrabold text-white tracking-tight">R$ {Number(value).toFixed(2)}</p>
              </div>

              {/* QR Code */}
              <div className="relative group p-1 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 shadow-xl shadow-emerald-500/10">
                <div className="bg-white p-3 rounded-xl">
                  {pixImage ? (
                    <img
                      src={`data:image/png;base64,${pixImage}`}
                      alt="QR Code"
                      className="h-44 w-44 object-contain mix-blend-multiply"
                    />
                  ) : (
                    <div className="h-44 w-44 flex items-center justify-center text-zinc-400 text-xs">Erro ao carregar imagem</div>
                  )}
                </div>
              </div>

              {/* Copia e Cola */}
              <div className="w-full space-y-2">
                <Label className="text-xs text-zinc-500 font-medium text-center block">Código Copia e Cola</Label>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none rounded-l-xl z-20"></div>
                  <div className="absolute inset-y-0 right-14 w-8 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none z-20"></div>

                  <div className="flex gap-2">
                    <div className="relative flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 focus-within:border-emerald-500/50 transition-colors">
                      <code className="block w-full px-4 py-3.5 text-xs text-zinc-400 font-mono whitespace-nowrap overflow-x-auto scrollbar-hide">
                        {pixPayload}
                      </code>
                    </div>
                    <Button
                      size="icon"
                      onClick={handleCopy}
                      className={`shrink-0 rounded-xl h-12 w-12 transition-all shadow-lg ${copied ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                    >
                      {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <RefreshCw className="h-3 w-3 animate-spin text-emerald-500" />
                Aguardando confirmação automática...
              </div>
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div className="p-6 pt-4 bg-zinc-950 border-t border-zinc-900 shrink-0 z-10">
          {!generated ? (
            <Button
              onClick={handleGenerate}
              disabled={!value || loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] text-base"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Gerando PIX...
                </div>
              ) : 'Gerar QR Code Pix'}
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full text-zinc-400 hover:text-white hover:bg-zinc-900 h-12 rounded-xl border border-white/5 hover:border-white/10"
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar e Alterar Valor
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
