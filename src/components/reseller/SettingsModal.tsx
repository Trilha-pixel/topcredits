
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { User, Lock } from 'lucide-react';

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userEmail?: string;
    userId?: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange, userEmail, userId }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('As senhas não conferem.');
            return;
        }

        if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.success('Senha atualizada com sucesso!');
            setPassword('');
            setConfirmPassword('');
            onOpenChange(false);
        } catch (error: any) {
            toast.error('Erro ao atualizar senha: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Configurações da Conta</DialogTitle>
                    <DialogDescription>
                        Gerencie suas credenciais e preferências.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Email Display */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase">E-mail Cadastrado</Label>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm text-foreground">
                            <User className="h-4 w-4 text-primary" />
                            {userEmail}
                        </div>
                    </div>

                    {/* Password Update Form */}
                    <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2 border-t border-border">
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-foreground">Redefinir Senha</h3>
                            <p className="text-xs text-muted-foreground">Defina uma nova senha para acessar sua conta.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">Nova Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="new-password"
                                    type="password"
                                    className="pl-9"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    className="pl-9"
                                    placeholder="Repita a senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Atualizando...' : 'Salvar Nova Senha'}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SettingsModal;
