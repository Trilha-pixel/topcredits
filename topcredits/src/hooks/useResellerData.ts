
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Order, Transaction } from '@/types';

export const useResellerData = (userId: string | undefined) => {
    // Fetch user orders
    const { data: orders = [], isLoading: loadingOrders, refetch: refetchOrders } = useQuery({
        queryKey: ['reseller_orders', userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from('orders')
                .select('*, products(name, credits_amount)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map((o: any) => ({
                ...o,
                product_name: o.products?.credits_amount ? `${o.products.credits_amount} créditos` : o.products?.name,
            })) as Order[];
        },
        enabled: !!userId,
    });

    // Fetch user transactions
    const { data: transactions = [], isLoading: loadingTransactions, refetch: refetchTransactions } = useQuery({
        queryKey: ['reseller_transactions', userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Transaction[];
        },
        enabled: !!userId,
    });

    const isLoading = loadingOrders || loadingTransactions;

    return {
        orders,
        transactions,
        isLoading,
        refetch: async () => {
            await Promise.all([refetchOrders(), refetchTransactions()]);
        }
    };
};
