import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Sparkles, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { licensesAPI } from '@/lib/licenses-api';

interface Plan {
  id: string;
  name: string;
  duration: string;
  price: number;
  tokenCost: number;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: '1-day',
    name: '1 Dia',
    duration: '1 dia de acesso',
    price: 39.90,
    tokenCost: 3,
    features: [
      'Acesso completo por 1 dia',
      'Suporte via WhatsApp',
      'Ativação imediata',
      'Sem renovação automática'
    ]
  },
  {
    id: '7-days',
    name: '7 Dias',
    duration: '7 dias de acesso',
    price: 97.90,
    tokenCost: 4,
    popular: true,
    features: [
      'Acesso completo por 7 dias',
      'Suporte prioritário',
      'Ativação imediata',
      'Melhor custo-benefício'
    ]
  }
];

const ComprarLicenca: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [clientName, setClientName] = useState('');
  const [clientWhatsApp, setClientWhatsApp] = useState('');

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const data = await licensesAPI.getBalance();
      setBalance(data.token_balance);
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
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
      // Verifica saldo
      if (balance < selectedPlan.tokenCost) {
        toast.error(`Saldo insuficiente. Você precisa de ${selectedPlan.tokenCost} tokens.`);
        setLoading(false);
        return;
      }

      // Gera a licença
      const response = await licensesAPI.generateLicense({
        plan_id: selectedPlan.id,
        client_name: clientName.trim(),
        client_whatsapp: clientWhatsApp.trim()
      });

      toast.success('Licença gerada com sucesso!');
      
      // Mostra a chave gerada
      toast.success(`Chave: ${response.key}`, { duration: 10000 });
      
      // Redireciona para a página de licenças
      setTimeout(() => {
        navigate('/licencas');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao gerar licença:', error);
      toast.error(error.message || 'Erro ao gerar licença');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/licencas')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Comprar Licença</h1>
            <p className="text-muted-foreground">Escolha um plano e gere sua licença</p>
          </div>
        </div>

        {/* Balance */}
        <Card className="p-4 mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                <p className="text-2xl font-bold text-foreground">{balance} tokens</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/licencas')}>
              Comprar Tokens
            </Button>
          </div>
        </Card>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative p-6 cursor-pointer transition-all ${
                selectedPlan?.id === plan.id
                  ? 'border-primary shadow-lg shadow-primary/20 scale-105'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedPlan(plan)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.duration}</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-primary">
                    R$ {plan.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.tokenCost} tokens
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {selectedPlan?.id === plan.id && (
                <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
              )}
            </Card>
          ))}
        </div>

        {/* Form */}
        {selectedPlan && (
          <Card className="p-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Dados do Cliente
            </h3>

            <div className="space-y-4 mb-6">
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
                  Formato: 55 + DDD + número (sem espaços ou caracteres especiais)
                </p>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-foreground mb-2">Resumo da Compra</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plano:</span>
                  <span className="font-medium text-foreground">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo:</span>
                  <span className="font-medium text-foreground">{selectedPlan.tokenCost} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saldo atual:</span>
                  <span className="font-medium text-foreground">{balance} tokens</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-primary/20">
                  <span className="text-muted-foreground">Saldo após compra:</span>
                  <span className={`font-bold ${balance >= selectedPlan.tokenCost ? 'text-green-500' : 'text-red-500'}`}>
                    {balance - selectedPlan.tokenCost} tokens
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              disabled={loading || balance < selectedPlan.tokenCost}
              className="w-full h-12 text-lg font-semibold"
            >
              {loading ? 'Gerando Licença...' : 'Gerar Licença Agora'}
            </Button>

            {balance < selectedPlan.tokenCost && (
              <p className="text-sm text-red-500 text-center mt-4">
                Saldo insuficiente. Compre mais tokens para continuar.
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default ComprarLicenca;
