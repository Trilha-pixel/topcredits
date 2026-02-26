
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Order, Profile, Wallet, Transaction, Product } from '@/types';

export const useAdminData = () => {
    const queryClient = useQueryClient();

    // Fetch all orders with user and product details using RPC
    const { data: orders = [], isLoading: loadingOrders } = useQuery({
        queryKey: ['admin_orders'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_all_orders_admin', {
                p_status: null,
                p_search: null,
                p_limit: 1000,
                p_offset: 0
            });

            if (error) throw error;
            return data as Order[];
        },
    });

    // Fetch dashboard stats using RPC
    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['admin_stats'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_admin_stats');
            if (error) throw error;
            return data;
        },
    });

    // Fetch all customers with their wallet balance using RPC
    const { data: resellers = [], isLoading: loadingResellers } = useQuery({
        queryKey: ['admin_resellers'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_all_customers_admin', {
                p_search: null
            });
            if (error) throw error;
            return data;
        },
    });

    // Fetch all wallets
    const { data: wallets = [], isLoading: loadingWallets } = useQuery({
        queryKey: ['admin_wallets'],
        queryFn: async () => {
            const { data, error } = await supabase.from('wallets').select('*');
            if (error) throw error;
            return data as Wallet[];
        },
    });

    // Fetch all transactions
    const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
        queryKey: ['admin_transactions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Transaction[];
        },
    });

    // Fetch all products
    const { data: products = [], isLoading: loadingProducts } = useQuery({
        queryKey: ['admin_products'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('id');
            if (error) throw error;
            return data as Product[];
        },
    });

    const isLoading = loadingOrders || loadingResellers || loadingWallets || loadingTransactions || loadingProducts || loadingStats;

    const updateOrderStatus = async (
        orderId: string,
        status: 'completed' | 'cancelled',
        deliveryLink?: string,
        deliveryCode?: string
    ) => {
        const { error } = await supabase.rpc('admin_update_order_status', {
            p_order_id: orderId,
            p_new_status: status,
            p_delivery_link: deliveryLink || null,
            p_delivery_code: deliveryCode || null
        });
        
        if (error) throw error;

        // Refresh data
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['admin_orders'] }),
            queryClient.invalidateQueries({ queryKey: ['admin_resellers'] }),
            queryClient.invalidateQueries({ queryKey: ['admin_transactions'] }),
            queryClient.invalidateQueries({ queryKey: ['admin_stats'] })
        ]);
    };

    const updateProduct = async (id: number, updates: Partial<Product>) => {
        const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ['admin_products'] });
    };

    const createProduct = async (product: Omit<Product, 'id'>) => {
        const { error } = await supabase
            .from('products')
            .insert(product);
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ['admin_products'] });
    };

    const deleteReseller = async (userId: string) => {
        const { error } = await supabase.rpc('admin_delete_customer', { 
            p_user_id: userId 
        });
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ['admin_resellers'] });
        await queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
    };

    const updateResellerBalance = async (userId: string, newBalance: number, reason?: string) => {
        const { error } = await supabase.rpc('admin_update_customer_balance', {
            p_user_id: userId,
            p_new_balance: newBalance,
            p_reason: reason || 'Ajuste manual pelo admin'
        });
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ['admin_resellers'] });
        await queryClient.invalidateQueries({ queryKey: ['admin_wallets'] });
        await queryClient.invalidateQueries({ queryKey: ['admin_transactions'] });
    };

    return {
        orders,
        resellers,
        wallets,
        transactions,
        products,
        stats,
        isLoading,
        updateOrderStatus,
        updateProduct,
        createProduct,
        deleteReseller,
        updateResellerBalance
    };
};
