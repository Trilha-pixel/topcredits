
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

export const useProducts = () => {
    const { data: products = [], isLoading: loadingProducts } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
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
