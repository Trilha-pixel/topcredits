import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'warning' | 'success';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className
}) => {
  const variantStyles = {
    default: 'border-border bg-card',
    primary: 'border-primary/20 bg-gradient-to-br from-primary/10 via-card to-primary/5',
    accent: 'border-accent/20 bg-gradient-to-br from-accent/10 via-card to-accent/5',
    warning: 'border-warning/20 bg-gradient-to-br from-warning/10 via-card to-warning/5',
    success: 'border-green-500/20 bg-gradient-to-br from-green-500/10 via-card to-green-500/5',
  };

  const iconColors = {
    default: 'text-foreground',
    primary: 'text-primary',
    accent: 'text-accent',
    warning: 'text-warning',
    success: 'text-green-500',
  };

  const valueColors = {
    default: 'text-foreground',
    primary: 'text-primary',
    accent: 'text-accent',
    warning: 'text-warning',
    success: 'text-green-500',
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-lg",
      variantStyles[variant],
      className
    )}>
      {/* Decorative blur */}
      {variant !== 'default' && (
        <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-current opacity-10 blur-2xl" />
      )}
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {title}
          </p>
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center",
            variant !== 'default' ? 'bg-current/10' : 'bg-muted'
          )}>
            <Icon className={cn("h-5 w-5", iconColors[variant])} />
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <p className={cn("text-3xl font-bold", valueColors[variant])}>
            {value}
          </p>
          
          {trend && (
            <div className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend.isPositive 
                ? "bg-green-500/10 text-green-500" 
                : "bg-red-500/10 text-red-500"
            )}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
