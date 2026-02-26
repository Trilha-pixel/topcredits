import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Step {
    id: number;
    label: string;
    description?: string;
    status: 'pending' | 'current' | 'completed' | 'error';
}

interface OrderDetails {
    status: string;
    etapaProcessamento: number;
    mensagemBot?: string | null;
    statusVerificacaoConvite?: string;
    creditosEnviados?: number;
    creditos?: number;
}

interface Props {
    orderId: string;
    localStatus: string;
}

export const OrderTrackingStepper: React.FC<Props> = ({ orderId, localStatus }) => {
    const [details, setDetails] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetails = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('get-order-details', {
                body: { orderId }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            if (data.success && data.data) {
                setDetails(data.data as OrderDetails);
            } else if (data.localStatusOnly) {
                setDetails({
                    status: data.status,
                    etapaProcessamento: data.etapaProcessamento || 0,
                    mensagemBot: data.mensagemBot
                } as OrderDetails);
            }
            setError(null);
        } catch (err: any) {
            console.error('Error fetching details:', err);
            // Silent error for UX, just don't update
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
        let interval: NodeJS.Timeout;
        if (localStatus !== 'cancelled' && (!details || (details.status !== 'sucesso' && details.status !== 'falha'))) {
            interval = setInterval(fetchDetails, 5000);
        }
        return () => clearInterval(interval);
    }, [orderId, localStatus, details?.status]);

    // Steps Definition (Portuguese & Simple)
    const steps: Step[] = [
        { id: 0, label: 'Pagamento Confirmado', description: 'Pedido recebido', status: 'completed' },
        { id: 1, label: 'Iniciando Processo', description: 'Aguardando sistema', status: 'pending' },
        { id: 2, label: 'Configurando Conta', description: 'Preparando ambiente', status: 'pending' },
        { id: 3, label: 'Enviando Créditos', description: 'Transferindo saldo', status: 'pending' },
        { id: 4, label: 'Concluído', description: 'Entrega finalizada', status: 'pending' }
    ];

    if (details) {
        const s = details.status;
        const etapa = details.etapaProcessamento;

        // Logic (Simplified)
        // Step 1: Processing
        if (etapa >= 1 || ['configurando', 'recarregando', 'entregando', 'sucesso'].includes(s)) steps[1].status = 'completed';
        else if (['novo', 'aguardando'].includes(s)) steps[1].status = 'current';

        // Step 2: Config
        if (etapa >= 2 || ['entregando', 'sucesso'].includes(s)) steps[2].status = 'completed';
        else if (['configurando', 'recarregando'].includes(s)) steps[2].status = 'current';

        // Step 3: Delivery
        if (etapa >= 3 || ['sucesso'].includes(s)) steps[3].status = 'completed';
        else if (['entregando'].includes(s)) steps[3].status = 'current';

        // Step 4: Done
        if (s === 'sucesso') steps[4].status = 'completed';

        // Errors
        if (['falha', 'queimado', 'cancelado'].includes(s) || localStatus === 'cancelled') {
            const current = steps.find(st => st.status === 'current') || steps[steps.length - 1];
            current.status = 'error';
            current.label = 'Falha no Processamento';
            current.description = 'Ocorreu um erro. Suporte notificado.';
        }
    }

    if (loading && !details) return null; // Don't show flashy loading, just wait

    return (
        <div className="w-full pl-2">
            <div className="space-y-0">
                {steps.map((step, index) => (
                    <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
                        {/* Connecting Line */}
                        {index !== steps.length - 1 && (
                            <div className={cn(
                                "absolute left-2.5 top-6 bottom-0 w-[1px]",
                                step.status === 'completed' ? "bg-emerald-500/50" : "bg-border"
                            )} />
                        )}

                        <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background ring-2 ring-background">
                            {step.status === 'completed' ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                            ) : step.status === 'current' ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : step.status === 'error' ? (
                                <AlertCircle className="h-5 w-5 text-destructive" />
                            ) : (
                                <Circle className="h-3 w-3 text-muted-foreground/30" />
                            )}
                        </div>

                        <div className="-mt-1 flex flex-col">
                            <span className={cn(
                                "text-sm font-medium",
                                step.status === 'completed' ? "text-foreground" :
                                    step.status === 'current' ? "text-primary" : "text-muted-foreground",
                                step.status === 'error' && "text-destructive"
                            )}>
                                {step.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {step.description}
                            </span>

                            {/* Bot Message Inline */}
                            {step.status === 'current' && details?.mensagemBot && (
                                <div className="mt-2 text-xs bg-accent/10 text-accent p-2 rounded-lg border border-accent/20 max-w-[240px]">
                                    "{details.mensagemBot}"
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Credit Info Badge */}
            {details?.creditosEnviados !== undefined && details.creditosEnviados > 0 && (
                <div className="mt-6 flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                    <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Créditos Transferidos</span>
                    <Badge variant="secondary" className="bg-emerald-500 text-white hover:bg-emerald-600 border-none">
                        {details.creditosEnviados} / {details.creditos || '?'}
                    </Badge>
                </div>
            )}
        </div>
    );
};
