import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types';
import { ArrowLeft, ShoppingCart, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ProductCard from '@/components/reseller/ProductCard';
import PurchaseModal from '@/components/reseller/PurchaseModal';

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Pacotes de Créditos</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 border border-primary/20">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">R$ {balance.toFixed(2)}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                balance={balance}
                onSelect={handleSelectProduct}
                popular={i === 1} // Segundo produto como destaque (exemplo)
              />
            ))}
          </div>
        )}
      </main>

      <PurchaseModal open={purchaseModal} onOpenChange={setPurchaseModal} product={selectedProduct} />
    </div>
  );
};

export default Pacotes;
