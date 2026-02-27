
import React, { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart, ArrowDownCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Order, Transaction } from '@/types';

interface BalanceCardProps {
  balance: number;
  orders: Order[];
  transactions: Transaction[];
  onDeposit: () => void;
}

const AnimatedNumber = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>R$ {display.toFixed(2)}</span>;
};

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, orders, transactions, onDeposit }) => {
  const totalSpent = transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const ordersThisMonth = orders.filter(o => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Sort descending by date
  const sortedDeposits = [...transactions]
    .filter(t => t.type === 'deposit')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const lastDeposit = sortedDeposits[0];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-6 backdrop-blur-xl">
      {/* Glow effects */}
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Saldo disponível</p>
            <h2 className="text-4xl font-bold text-foreground">
              <AnimatedNumber value={balance} />
            </h2>
          </div>
          <Button
            onClick={onDeposit}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg shadow-accent/20 transition-all hover:shadow-accent/40 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Depositar
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[10px] text-muted-foreground uppercase">Gasto total</span>
            </div>
            <p className="text-sm font-bold text-foreground">R$ {totalSpent.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ShoppingCart className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase">Pedidos/mês</span>
            </div>
            <p className="text-sm font-bold text-foreground">{ordersThisMonth}</p>
          </div>
          <div className="rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownCircle className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] text-muted-foreground uppercase">Últ. depósito</span>
            </div>
            <p className="text-sm font-bold text-foreground">
              {lastDeposit ? `R$ ${lastDeposit.amount.toFixed(0)}` : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
