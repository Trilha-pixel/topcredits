
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

export const useProducts = () => {
    const { data: products = [], isLoading: loadingProducts } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            // Clientes veem apenas dados públicos (sem custos)
            // A política RLS garante que unit_cost_brl não seja retornado
            const { data, error } = await supabase
                .from('products')
                .select('id, name, credits_amount, price, active, category')
                .eq('active', true)
                .order('price', { ascending: true });

            if (error) throw error;
            return data as Product[];
        },
    });

    return {
        products,
        isLoading: loadingProducts
    };
};
