import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ProductCard from '@/components/reseller/ProductCard';
import PurchaseModal from '@/components/reseller/PurchaseModal';
import MobileNav from '@/components/ui/MobileNav';

const Pacotes = () => {
  const { balance } = useAuth();
  const navigate = useNavigate();
  const { products, isLoading } = useProducts();
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setPurchaseModal(true);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white/30">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.02] via-black to-black" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold tracking-tight text-white">Pacotes de Créditos</h1>
              <p className="text-xs text-neutral-500 font-medium">Adquira saldo para sua conta</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-full bg-white/5 pl-2 pr-4 py-1.5 border border-white/10">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <span className="text-sm font-semibold tracking-tight">R$ {balance.toFixed(2)}</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold tracking-wider text-neutral-300 uppercase">Entrega Imediata</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Escolha seu pacote</h2>
          <p className="text-neutral-400 font-light max-w-xl mx-auto">
            Créditos Lovable creditados automaticamente na sua conta após a confirmação do pagamento.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            <p className="text-neutral-500 text-sm">Carregando pacotes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                balance={balance}
                onSelect={handleSelectProduct}
                popular={i === 1} // Segundo produto como destaque
              />
            ))}
          </div>
        )}
      </main>

      <PurchaseModal open={purchaseModal} onOpenChange={setPurchaseModal} product={selectedProduct} />
      <MobileNav />
    </div>
  );
};

export default Pacotes;
