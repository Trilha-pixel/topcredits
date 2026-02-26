
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Order, Profile, Wallet, Transaction, Product } from '@/types';

export const useAdminData = () => {
    const queryClient = useQueryClient();

    // Fetch all orders with user and product details
    const { data: orders = [], isLoading: loadingOrders } = useQuery({
        queryKey: ['admin_orders'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    profiles:user_id (full_name, email),
                    products:product_id (name, credits_amount)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map((o: any) => ({
                ...o,
                user_name: o.profiles?.full_name || 'Usuário Desconhecido',
                lovable_email: o.lovable_email || o.profiles?.email || 'Email não informado',
                product_name: o.products?.credits_amount ? `${o.products.credits_amount} créditos` : (o.products?.name || 'Produto Removido'),
            })) as Order[];
        },
    });

    // Fetch dashboard stats (RPC)
    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['admin_stats'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
            if (error) throw error;
            return data;
        },
    });

    // Fetch all resellers with their wallet balance
    const { data: resellers = [], isLoading: loadingResellers } = useQuery({
        queryKey: ['admin_resellers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*, wallets(balance)')
                .eq('role', 'reseller')
                .order('full_name');

            if (error) throw error;
            return data.map((r: any) => {
                const walletData = r.wallets;
                const balance = Array.isArray(walletData)
                    ? walletData[0]?.balance
                    : walletData?.balance;
                return {
                    ...r,
                    balance: balance ?? 0,
                };
            });
        },
    });

    // Fetch all wallets (Backup/Direct access if needed, but resistors query covers it)
    const { data: wallets = [], isLoading: loadingWallets } = useQuery({
        queryKey: ['admin_wallets'],
        queryFn: async () => {
            const { data, error } = await supabase.from('wallets').select('*');
            if (error) throw error;
            return data as Wallet[];
        },
    });

    // Fetch all transactions (for revenue and stats)
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
            return data as Product[]; // Product type already matches DB
        },
    });

    const isLoading = loadingOrders || loadingResellers || loadingWallets || loadingTransactions || loadingProducts;

    const updateOrderStatus = async (
        orderId: string,
        status: 'completed' | 'cancelled',
        deliveryLink?: string,
        controlId?: string
    ) => {
        if (status === 'completed') {
            const { error } = await supabase.rpc('admin_deliver_order', {
                p_order_id: orderId,
                p_delivery_link: deliveryLink || null,
                p_control_id: controlId || null,
            });
            if (error) throw error;
        } else if (status === 'cancelled') {
            const { error } = await supabase.rpc('admin_refund_order', {
                p_order_id: orderId,
            });
            if (error) throw error;
        }

        // Refresh data
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['admin_orders'] }),
            queryClient.invalidateQueries({ queryKey: ['admin_resellers'] }),
            queryClient.invalidateQueries({ queryKey: ['admin_transactions'] }) // Update revenue stats
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
        deleteReseller: async (userId: string) => {
            const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
            if (error) throw error;
            await queryClient.invalidateQueries({ queryKey: ['admin_resellers'] });
            await queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
        },
        updateResellerBalance: async (userId: string, newBalance: number) => {
            const { error } = await supabase.rpc('admin_update_balance', {
                target_user_id: userId,
                new_balance: newBalance
            });
            if (error) throw error;
            await queryClient.invalidateQueries({ queryKey: ['admin_resellers'] });
            await queryClient.invalidateQueries({ queryKey: ['admin_wallets'] });
        }
    };
};
