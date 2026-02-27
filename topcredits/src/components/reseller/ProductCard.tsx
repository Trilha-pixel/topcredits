import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
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
      onClick={() => canAfford && onSelect(product)}
      className={`group relative flex-col justify-between w-full rounded-3xl p-6 transition-all duration-500 overflow-hidden ${
        canAfford
          ? 'bg-[#050505] border border-white/10 hover:border-white/20 hover:bg-[#0A0A0A] hover:-translate-y-2 cursor-pointer shadow-2xl'
          : 'bg-[#050505] border border-white/5 opacity-60 cursor-not-allowed'
      } ${popular ? 'ring-1 ring-purple-500/30' : ''}`}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      {popular && (
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none" />
      )}

      {popular && (
        <div className="absolute top-0 inset-x-0 flex justify-center">
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-bold tracking-widest uppercase px-4 py-1 rounded-b-xl shadow-lg">
            Mais Vendido
          </span>
        </div>
      )}

      <div className={`flex flex-col gap-4 relative z-10 ${popular ? 'mt-4' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
            {product.name}
          </span>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${canAfford ? 'bg-white/10' : 'bg-white/5'}`}>
            <Sparkles className={`h-5 w-5 ${canAfford ? 'text-white' : 'text-neutral-500'}`} />
          </div>
        </div>

        <div>
          <h3 className="text-3xl font-bold text-white tracking-tighter">
            {product.credits_amount}
          </h3>
          <p className="text-sm text-neutral-400 font-medium">créditos Lovable</p>
        </div>

        <div className="pt-4 border-t border-white/10 mt-2">
          <p className="text-2xl font-light text-white tracking-tight">
            R$ {product.price.toFixed(2)}
          </p>
        </div>

        {canAfford ? (
          <button className="w-full flex items-center justify-center gap-2 mt-4 bg-white text-black py-3 rounded-xl font-semibold hover:bg-neutral-200 transition-colors">
            Comprar Agora
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-full flex flex-col items-center justify-center gap-1 mt-4 py-2 border border-white/5 rounded-xl bg-white/5">
            <span className="text-xs font-medium text-neutral-400">Saldo insuficiente</span>
            <span className="text-[10px] text-red-400 font-semibold tracking-wider">Falta R$ {deficit.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
