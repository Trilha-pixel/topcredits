import React from 'react';
import { Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  balance: number;
  onSelect: (product: Product) => void;
  popular?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, balance, onSelect, popular }) => {
  const canAfford = balance >= product.price;
  const deficit = product.price - balance;

  return (
    <div
      className={`group relative flex-shrink-0 w-[200px] sm:w-auto rounded-2xl border p-5 transition-all duration-300 ${canAfford
        ? 'border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] cursor-pointer bg-card'
        : 'border-border/50 bg-card/50 opacity-60'
        } ${popular ? 'ring-1 ring-primary/30' : ''}`}
      onClick={() => canAfford && onSelect(product)}
    >
      {popular && (
        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2.5 py-0.5 shadow-lg shadow-primary/20">
          <Star className="h-3 w-3 mr-1" />
          Popular
        </Badge>
      )}

      <div className="flex flex-col gap-1.5 mb-4">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
          {product.name}
        </span>
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${canAfford ? 'bg-primary/10' : 'bg-muted'}`}>
            <Zap className={`h-4 w-4 ${canAfford ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <h3 className="text-xl font-bold text-foreground">{product.credits_amount} créditos</h3>
        </div>
      </div>
      <p className="text-2xl font-extrabold text-foreground mb-4">
        R$ {product.price.toFixed(2)}
      </p>

      {canAfford ? (
        <Button
          size="sm"
          className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
        >
          Comprar
        </Button>
      ) : (
        <p className="text-[11px] text-destructive text-center">
          Faltam R$ {deficit.toFixed(2)}
        </p>
      )}
    </div>
  );
};

export default ProductCard;
