import React, { useState, useEffect, useCallback } from 'react';
import { Coupon } from '@/types';
import { couponsAPI } from '@/lib/coupons-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Plus, Search, Trash2, Edit, Power, Tag,
    Hash, TrendingUp, ToggleLeft, ToggleRight,
    Percent, DollarSign, X, RefreshCw
} from 'lucide-react';

// ========== Modal de Criação/Edição ==========
interface CouponModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    coupon?: Coupon | null;
}

const CouponModal: React.FC<CouponModalProps> = ({ isOpen, onClose, onSave, coupon }) => {
    const [form, setForm] = useState({
        code: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: '',
        max_uses: '',
        min_purchase_value: '',
        expires_at: '',
        is_active: true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (coupon) {
            setForm({
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: String(coupon.discount_value),
                max_uses: coupon.max_uses !== null ? String(coupon.max_uses) : '',
                min_purchase_value: coupon.min_purchase_value > 0 ? String(coupon.min_purchase_value) : '',
                expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '',
                is_active: coupon.is_active,
            });
        } else {
            setForm({
                code: '',
                discount_type: 'percentage',
                discount_value: '',
                max_uses: '',
                min_purchase_value: '',
                expires_at: '',
                is_active: true,
            });
        }
    }, [coupon, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.code.trim() || !form.discount_value) {
            toast.error('Preencha o código e o valor do desconto.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                code: form.code,
                discount_type: form.discount_type,
                discount_value: parseFloat(form.discount_value),
                max_uses: form.max_uses ? parseInt(form.max_uses) : null,
                min_purchase_value: form.min_purchase_value ? parseFloat(form.min_purchase_value) : 0,
                expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
                is_active: form.is_active,
            };

            if (coupon) {
                await couponsAPI.update(coupon.id, payload);
                toast.success('Cupom atualizado.');
            } else {
                await couponsAPI.create(payload);
                toast.success('Cupom criado com sucesso.');
            }
            onSave();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao salvar cupom.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-2xl mx-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-foreground">
                        {coupon ? 'Editar Cupom' : 'Novo Cupom'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Toggle Ativo */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                        <span className="text-sm text-foreground font-medium">Status</span>
                        <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${form.is_active
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                    : 'bg-muted text-muted-foreground border border-border'
                                }`}
                        >
                            {form.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                            {form.is_active ? 'Ativo' : 'Desativado'}
                        </button>
                    </div>

                    {/* Código */}
                    <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Código do Cupom</label>
                        <Input
                            value={form.code}
                            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                            placeholder="EX: DESCONTO20"
                            className="uppercase font-mono tracking-wider"
                            required
                        />
                    </div>

                    {/* Tipo e Valor */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Tipo</label>
                            <div className="flex rounded-lg overflow-hidden border border-border">
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, discount_type: 'percentage' }))}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${form.discount_type === 'percentage'
                                            ? 'bg-primary/10 text-primary border-r border-border'
                                            : 'text-muted-foreground hover:text-foreground border-r border-border'
                                        }`}
                                >
                                    <Percent className="h-3.5 w-3.5" /> %
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, discount_type: 'fixed' }))}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${form.discount_type === 'fixed'
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <DollarSign className="h-3.5 w-3.5" /> R$
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Valor</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.discount_value}
                                onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                                placeholder={form.discount_type === 'percentage' ? '20' : '10.00'}
                                required
                            />
                        </div>
                    </div>

                    {/* Quantidade e Valor Mínimo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Máx. de Usos</label>
                            <Input
                                type="number"
                                min="1"
                                value={form.max_uses}
                                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                                placeholder="Ilimitado"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Valor Mín. Compra</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.min_purchase_value}
                                onChange={e => setForm(f => ({ ...f, min_purchase_value: e.target.value }))}
                                placeholder="R$ 0,00"
                            />
                        </div>
                    </div>

                    {/* Expiração */}
                    <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Data de Expiração</label>
                        <Input
                            type="datetime-local"
                            value={form.expires_at}
                            onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Deixe vazio para nunca expirar</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={saving}>
                            {saving ? 'Salvando...' : coupon ? 'Atualizar' : 'Criar Cupom'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ========== Tab Principal ==========
const CouponsTab = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    const loadCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const data = await couponsAPI.getAll();
            setCoupons(data);
        } catch (err: any) {
            toast.error('Erro ao carregar cupons: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCoupons();
    }, [loadCoupons]);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cupom?')) return;
        try {
            await couponsAPI.delete(id);
            toast.success('Cupom excluído.');
            loadCoupons();
        } catch (err: any) {
            toast.error('Erro ao excluir: ' + err.message);
        }
    };

    const handleToggle = async (coupon: Coupon) => {
        try {
            await couponsAPI.toggleActive(coupon.id, !coupon.is_active);
            toast.success(coupon.is_active ? 'Cupom desativado.' : 'Cupom ativado.');
            loadCoupons();
        } catch (err: any) {
            toast.error('Erro ao alterar status: ' + err.message);
        }
    };

    const filtered = coupons.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase())
    );

    const totalUses = coupons.reduce((acc, c) => acc + c.current_uses, 0);
    const activeCoupons = coupons.filter(c => c.is_active).length;

    const isExpired = (c: Coupon) => c.expires_at && new Date(c.expires_at) < new Date();
    const isMaxed = (c: Coupon) => c.max_uses !== null && c.current_uses >= c.max_uses;

    const getStatusBadge = (c: Coupon) => {
        if (!c.is_active) return <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">Desativado</Badge>;
        if (isExpired(c)) return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Expirado</Badge>;
        if (isMaxed(c)) return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Esgotado</Badge>;
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Ativo</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Cupons</p>
                    <p className="text-3xl font-light text-foreground">{coupons.length}</p>
                </div>
                <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Ativos</p>
                    <p className="text-3xl font-light text-emerald-500">{activeCoupons}</p>
                </div>
                <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Utilizações</p>
                    <p className="text-3xl font-light text-foreground">{totalUses}</p>
                </div>
                <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Inativos</p>
                    <p className="text-3xl font-light text-muted-foreground">{coupons.length - activeCoupons}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar cupom..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadCoupons} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button size="sm" onClick={() => { setEditingCoupon(null); setModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Cupom
                    </Button>
                </div>
            </div>

            {/* Coupons Table */}
            {loading && coupons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Carregando cupons...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
                    <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    Nenhum cupom encontrado
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(coupon => {
                        const usagePercent = coupon.max_uses
                            ? Math.min((coupon.current_uses / coupon.max_uses) * 100, 100)
                            : 0;

                        return (
                            <div
                                key={coupon.id}
                                className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4 hover:border-primary/20 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    {/* Code & Status */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Tag className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-bold text-foreground tracking-wider">{coupon.code}</span>
                                                {getStatusBadge(coupon)}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {coupon.discount_type === 'percentage'
                                                    ? `${coupon.discount_value}% de desconto`
                                                    : `R$ ${Number(coupon.discount_value).toFixed(2)} fixo`}
                                                {coupon.min_purchase_value > 0 && ` · Min. R$ ${Number(coupon.min_purchase_value).toFixed(2)}`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Usage Bar */}
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <div className="hidden sm:block min-w-[120px]">
                                            {coupon.max_uses !== null ? (
                                                <div>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                                        <span>{coupon.current_uses}/{coupon.max_uses}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 rounded-full ${usagePercent >= 100 ? 'bg-destructive' : usagePercent >= 75 ? 'bg-warning' : 'bg-emerald-500'
                                                                }`}
                                                            style={{ width: `${usagePercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-muted-foreground text-center">
                                                    {coupon.current_uses} usos · ∞
                                                </div>
                                            )}
                                        </div>

                                        {/* Expiration */}
                                        <div className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
                                            {coupon.expires_at
                                                ? new Date(coupon.expires_at).toLocaleDateString('pt-BR')
                                                : 'Sem expiração'}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                                onClick={() => handleToggle(coupon)}
                                                title={coupon.is_active ? 'Desativar' : 'Ativar'}
                                            >
                                                <Power className={`h-4 w-4 ${coupon.is_active ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                                onClick={() => { setEditingCoupon(coupon); setModalOpen(true); }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-destructive"
                                                onClick={() => handleDelete(coupon.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <CouponModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditingCoupon(null); }}
                onSave={loadCoupons}
                coupon={editingCoupon}
            />
        </div>
    );
};

export default CouponsTab;
