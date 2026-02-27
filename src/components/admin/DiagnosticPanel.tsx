import React from 'react';
import { AlertTriangle, Database, Key, Server, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiagnosticPanelProps {
  ordersCount: number;
  customersCount: number;
  productsCount: number;
  hasStats: boolean;
  isLoading: boolean;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  ordersCount,
  customersCount,
  productsCount,
  hasStats,
  isLoading
}) => {
  const hasData = ordersCount > 0 || customersCount > 0;
  
  if (isLoading || hasData) return null;

  const checks = [
    {
      name: 'Conexão Supabase',
      status: !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      icon: Server,
      details: import.meta.env.VITE_SUPABASE_URL ? 
        `Conectado: ${import.meta.env.VITE_SUPABASE_URL.split('.')[0].replace('https://', '')}` : 
        'URL não configurada'
    },
    {
      name: 'API Key',
      status: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      icon: Key,
      details: import.meta.env.VITE_SUPABASE_ANON_KEY ? 
        `Key: ${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 
        'Key não encontrada'
    },
    {
      name: 'Dados no Banco',
      status: hasData,
      icon: Database,
      details: `${ordersCount} pedidos, ${customersCount} clientes, ${productsCount} produtos`
    },
    {
      name: 'Funções RPC',
      status: hasStats,
      icon: Server,
      details: hasStats ? 'Stats carregadas' : 'Erro ao carregar stats'
    }
  ];

  const allPassed = checks.every(check => check.status);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card/50 backdrop-blur-md border border-border rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Diagnóstico do Painel Admin</h2>
            <p className="text-sm text-muted-foreground">
              {allPassed ? 'Configuração OK, mas sem dados' : 'Problemas detectados na configuração'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {checks.map((check, index) => {
            const Icon = check.icon;
            const StatusIcon = check.status ? CheckCircle : XCircle;
            
            return (
              <div 
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  check.status 
                    ? 'bg-accent/5 border-accent/20' 
                    : 'bg-destructive/5 border-destructive/20'
                }`}
              >
                <Icon className={`h-5 w-5 mt-0.5 ${
                  check.status ? 'text-accent' : 'text-destructive'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{check.name}</span>
                    <StatusIcon className={`h-4 w-4 ${
                      check.status ? 'text-accent' : 'text-destructive'
                    }`} />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{check.details}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Próximos Passos:</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>Abra o Console do navegador (F12) e veja a aba Console para erros detalhados</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>Execute o script <code className="bg-secondary px-1 rounded">diagnose-admin-panel.sql</code> no Supabase SQL Editor</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>Verifique se seu usuário tem role='admin' na tabela profiles</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">4.</span>
              <span>Execute <code className="bg-secondary px-1 rounded">fix-admin-panel-complete.sql</code> para corrigir funções RPC</span>
            </li>
          </ol>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            Recarregar Página
          </Button>
          <Button
            onClick={() => {
              console.log('=== DIAGNÓSTICO MANUAL ===');
              console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
              console.log('Key prefix:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));
              console.log('Orders:', ordersCount);
              console.log('Customers:', customersCount);
              console.log('Products:', productsCount);
              console.log('Has stats:', hasStats);
            }}
            className="flex-1 bg-primary"
          >
            Copiar Info para Console
          </Button>
        </div>
      </div>
    </div>
  );
};
