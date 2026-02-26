import React from 'react';
import { ArrowDownCircle, ShoppingCart, RotateCcw } from 'lucide-react';
import { Transaction } from '@/types';

const typeConfig = {
  deposit: { label: 'Depósito', icon: ArrowDownCircle, color: 'text-accent' },
  purchase: { label: 'Compra', icon: ShoppingCart, color: 'text-destructive' },
  refund: { label: 'Estorno', icon: RotateCcw, color: 'text-warning' },
};

const TransactionTimeline: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const sorted = [...transactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação ainda.</p>;
  }

  return (
    <div className="space-y-1">
      {sorted.map((tx) => {
        const cfg = typeConfig[tx.type] || typeConfig.purchase;
        const Icon = cfg.icon;
        const isPositive = tx.amount > 0;
        return (
          <div key={tx.id} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-secondary/50 transition-colors">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary ${cfg.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{cfg.label}</p>
              <p className="text-[11px] text-muted-foreground">
                {new Date(tx.created_at).toLocaleDateString('pt-BR')} · {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span className={`text-sm font-bold ${isPositive ? 'text-accent' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}R$ {Math.abs(tx.amount).toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionTimeline;
