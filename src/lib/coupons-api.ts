import { supabase } from './supabase';
import { Coupon, CouponValidationResult } from '@/types';

export const couponsAPI = {
    // ========== ADMIN CRUD ==========

    async getAll(): Promise<Coupon[]> {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Coupon[];
    },

    async create(coupon: Omit<Coupon, 'id' | 'current_uses' | 'created_at'>): Promise<Coupon> {
        const { data, error } = await supabase
            .from('coupons')
            .insert({
                code: coupon.code.toUpperCase().trim(),
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                max_uses: coupon.max_uses,
                min_purchase_value: coupon.min_purchase_value || 0,
                expires_at: coupon.expires_at,
                is_active: coupon.is_active,
            })
            .select()
            .single();

        if (error) throw error;
        return data as Coupon;
    },

    async update(id: string, updates: Partial<Coupon>): Promise<Coupon> {
        const payload: any = { ...updates };
        if (payload.code) payload.code = payload.code.toUpperCase().trim();
        delete payload.id;
        delete payload.created_at;

        const { data, error } = await supabase
            .from('coupons')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Coupon;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async toggleActive(id: string, is_active: boolean): Promise<void> {
        const { error } = await supabase
            .from('coupons')
            .update({ is_active })
            .eq('id', id);

        if (error) throw error;
    },

    // ========== CHECKOUT (Consumer) ==========

    async validate(code: string, purchaseValue: number): Promise<CouponValidationResult> {
        const { data, error } = await supabase.rpc('validate_coupon', {
            p_code: code.toUpperCase().trim(),
            p_purchase_value: purchaseValue,
        });

        if (error) throw error;
        return data as CouponValidationResult;
    },

    async apply(couponId: string): Promise<void> {
        const { error } = await supabase.rpc('apply_coupon', {
            p_coupon_id: couponId,
        });

        if (error) throw error;
    },

    // ========== Admin Stats ==========

    async getStats(): Promise<{ total_coupons: number; total_uses: number; active_coupons: number }> {
        const { data, error } = await supabase.rpc('get_coupon_stats');
        if (error) throw error;
        return data as { total_coupons: number; total_uses: number; active_coupons: number };
    },
};
