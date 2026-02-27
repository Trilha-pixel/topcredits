
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Order, Profile, Wallet, Transaction, Product } from '@/types';

// Função auxiliar para logging detalhado
const logSupabaseError = (context: string, error: any, data: any) => {
    console.group(`🔴 Supabase Error: ${context}`);
    console.error('Error object:', error);
    console.log('Data received:', data);
    console.log('Error message:', error?.message);
    console.log('Error details:', error?.details);
    console.log('Error hint:', error?.hint);
    console.log('Error code:', error?.code);
    console.groupEnd();
};

// Função auxiliar para logging de sucesso
const logSupabaseSuccess = (context: string, data: any) => {
    console.group(`✅ Supabase Success: ${context}`);
    console.log('Data type:', Array.isArray(data) ? 'Array' : typeof data);
    console.log('Data length:', Array.isArray(data) ? data.length : 'N/A');
    console.log('First item:', Array.isArray(data) && data.length > 0 ? data[0] : data);
    console.groupEnd();
};

export const useAdminData = () => {
    const queryClient = useQueryClient();

    // Verificar configuração do Supabase
    console.log('🔧 Supabase Config:', {
        url: import.meta.env.VITE_SUPABASE_URL,
        project: import.meta.env.VITE_SUPABASE_URL?.split('.')[0].replace('https://', ''),
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
        schema: 'public'
    });

    // Fetch all orders with user and product details using RPC
    const { data: orders = [], isLoading: loadingOrders, error: ordersError } = useQuery({
        queryKey: ['admin_orders'],
        queryFn: async () => {
            console.log('📦 Fetching orders...');
            
            try {
                const { data, error } = await supabase.rpc('get_all_orders_admin', {
                    p_status: null,
                    p_search: null,
                    p_limit: 1000,
                    p_offset: 0
                });

                if (error) {
                    logSupabaseError('get_all_orders_admin', error, data);
                    throw error;
                }

                logSupabaseSuccess('get_all_orders_admin', data);
                return (data || []) as Order[];
            } catch (err) {
                console.error('❌ Exception in orders fetch:', err);
                throw err;
            }
        },
        staleTime: 30000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    // Fetch dashboard stats using RPC
    const { data: stats, isLoading: loadingStats, error: statsError } = useQuery({
        queryKey: ['admin_stats'],
        queryFn: async () => {
            console.log('📊 Fetching stats...');
            
            try {
                const { data, error } = await supabase.rpc('get_admin_stats');
                
                if (error) {
                    logSupabaseError('get_admin_stats', error, data);
                    throw error;
                }

                logSupabaseSuccess('get_admin_stats', data);
                
                // A função retorna TABLE, então sempre será um array
                if (Array.isArray(data) && data.length > 0) {
                    return data[0];
                }
                
                // Fallback para dados vazios
                console.warn('⚠️ Stats returned empty, using fallback');
                return {
                    total_orders: 0,
                    pending_orders: 0,
                    completed_orders: 0,
                    cancelled_orders: 0,
                    total_customers: 0,
                    total_revenue: 0,
                    total_credits_sold: 0,
                    total_wallet_balance: 0,
                    net_profit: 0,
                    total_costs: 0,
                    credits_revenue: 0,
                    api_extension_revenue: 0,
                    new_customers_this_month: 0
                };
            } catch (err) {
                console.error('❌ Exception in stats fetch:', err);
                throw err;
            }
        },
        staleTime: 30000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    // Fetch all customers with their wallet balance using RPC
    const { data: resellers = [], isLoading: loadingResellers, error: resellersError } = useQuery({
        queryKey: ['admin_resellers'],
        queryFn: async () => {
            console.log('👥 Fetching customers...');
            
            try {
                const { data, error } = await supabase.rpc('get_all_customers_admin', {
                    p_search: null
                });
                
                if (error) {
                    logSupabaseError('get_all_customers_admin', error, data);
                    throw error;
                }

                logSupabaseSuccess('get_all_customers_admin', data);
                return (data || []) as Profile[];
            } catch (err) {
                console.error('❌ Exception in customers fetch:', err);
                throw err;
            }
        },
        staleTime: 30000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    // Fetch all wallets - REMOVIDO (já vem nos resellers)
    const wallets: Wallet[] = [];

    // Fetch all transactions - LAZY LOAD (só quando necessário)
    const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
        queryKey: ['admin_transactions'],
        queryFn: async () => {
            console.log('💳 Fetching transactions...');
            
            try {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) {
                    logSupabaseError('transactions', error, data);
                    throw error;
                }

                logSupabaseSuccess('transactions', data);
                return (data || []) as Transaction[];
            } catch (err) {
                console.error('❌ Exception in transactions fetch:', err);
                throw err;
            }
        },
        staleTime: 60000,
        refetchOnWindowFocus: false,
        enabled: false, // Não carregar automaticamente
        retry: 1,
    });

    // Fetch all products
    const { data: products = [], isLoading: loadingProducts, error: productsError } = useQuery({
        queryKey: ['admin_products'],
        queryFn: async () => {
            console.log('🛍️ Fetching products...');
            
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('id');
                
                if (error) {
                    logSupabaseError('products', error, data);
                    throw error;
                }

                logSupabaseSuccess('products', data);
                return (data || []) as Product[];
            } catch (err) {
                console.error('❌ Exception in products fetch:', err);
                throw err;
            }
        },
        staleTime: 60000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    // Log de erros consolidado
    if (ordersError || statsError || resellersError || productsError) {
        console.group('🚨 Admin Data Errors Summary');
        if (ordersError) console.error('Orders error:', ordersError);
        if (statsError) console.error('Stats error:', statsError);
        if (resellersError) console.error('Resellers error:', resellersError);
        if (productsError) console.error('Products error:', productsError);
        console.groupEnd();
    }

    // Apenas stats, orders e resellers são essenciais para o loading inicial
    const isLoading = loadingOrders || loadingResellers || loadingProducts || loadingStats;

    // Log do estado final
    console.log('📈 Admin Data State:', {
        isLoading,
        ordersCount: orders.length,
        resellersCount: resellers.length,
        productsCount: products.length,
        hasStats: !!stats,
        errors: {
            orders: !!ordersError,
            stats: !!statsError,
            resellers: !!resellersError,
            products: !!productsError
        }
    });

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
        await queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
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
