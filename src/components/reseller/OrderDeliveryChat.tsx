import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Loader2, Plus, LayoutGrid, CheckCircle2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    sender: 'bot' | 'user';
    text: string;
    type?: 'options' | 'text' | 'success';
    options?: { label: string; value: string; icon?: React.ElementType; description?: string }[];
}

interface Props {
    orderId: string;
    currentEmail: string;
    onUpdate: () => void;
    status: string;
}

export const OrderDeliveryChat: React.FC<Props> = ({ orderId, currentEmail, onUpdate, status }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'bot',
            text: 'Olá! Para prosseguir com a entrega, preciso saber como você deseja receber seus créditos.',
            type: 'options',
            options: [
                { label: 'Criar Novo Workspace', value: 'workspace_novo', icon: Plus, description: 'Vamos criar uma conta zero para você' },
                { label: 'Usar Workspace Existente', value: 'workspace_proprio', icon: LayoutGrid, description: 'Vincular a um workspace que já existe' }
            ]
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'type' | 'email' | 'confirm'>('type');
    const [deliveryType, setDeliveryType] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleOptionClick = (value: string, label: string) => {
        // Add user message with selection
        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: label,
            type: 'text'
        };
        setMessages(prev => [...prev, userMsg]);

        setDeliveryType(value);
        setStep('email');

        // Bot typing simulation
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: `Perfeito. Agora, informe o email da conta Lovable que será utilizada.`,
                type: 'text'
            }]);
            // Pre-fill email if available
            if (currentEmail) setInput(currentEmail);
        }, 600);
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        const email = input.trim();

        // Basic validation
        if (!email.includes('@') || !email.includes('.')) {
            toast.error("Por favor, digite um email válido.");
            return;
        }

        // Add user message
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: email, type: 'text' }]);
        setInput('');
        setLoading(true);

        try {
            // Call API
            const { data, error } = await supabase.functions.invoke('update-order-delivery', {
                body: { orderId, tipoEntrega: deliveryType, emailContaLovable: email }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            // Bot Success
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: 'Tudo pronto! Sua configuração foi salva e iniciamos o envio.',
                type: 'success'
            }]);

            toast.success('Entrega configurada com sucesso!');

            // Wait a bit before refreshing to let user read
            setTimeout(() => {
                onUpdate();
            }, 2000);

        } catch (err: any) {
            console.error('Error updating delivery:', err);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: 'Ocorreu um erro ao salvar. Por favor, tente novamente.',
                type: 'text'
            }]);
            toast.error('Erro ao configurar entrega.');
            setLoading(false); // Only stop loading on error, on success we wait for refresh
        }
    };

    return (
        <div className="flex flex-col bg-card/50 rounded-xl border border-border/50 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2">

            {/* Minimal Header */}
            <div className="px-4 py-3 border-b border-border/50 bg-muted/20 flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-full">
                    <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold">Assistente Virtual</h4>
                    <p className="text-[10px] text-muted-foreground leading-none">Configuração de Entrega</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 space-y-4 max-h-[400px] overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={msg.id} className={cn("flex w-full", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[85%] space-y-2 animate-in zoom-in-95 duration-300",
                            msg.sender === 'user' ? "items-end" : "items-start"
                        )}>
                            {/* Message Bubble */}
                            <div className={cn(
                                "p-3 text-sm shadow-sm",
                                msg.sender === 'user'
                                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                    : "bg-secondary/80 text-foreground border border-border/50 rounded-2xl rounded-tl-sm backdrop-blur-sm"
                            )}>
                                {msg.text}
                            </div>

                            {/* Options Cards */}
                            {msg.type === 'options' && msg.options && step === 'type' && (
                                <div className="grid grid-cols-1 gap-2 mt-2 min-w-[260px]">
                                    {msg.options.map((opt) => {
                                        const Icon = opt.icon || Plus;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleOptionClick(opt.value, opt.label)}
                                                className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all text-left"
                                            >
                                                <div className="p-2 rounded-lg bg-secondary group-hover:bg-background transition-colors">
                                                    <Icon className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                                                    <p className="text-[10px] text-muted-foreground">{opt.description}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Success State */}
                            {msg.type === 'success' && (
                                <div className="flex items-center gap-2 text-emerald-500 text-xs mt-1 px-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Processando pedido...</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && step !== 'type' && (
                    <div className="flex justify-start">
                        <div className="bg-secondary/50 text-muted-foreground rounded-2xl rounded-tl-sm p-3 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs">Salvando informações...</span>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            {step === 'email' && !loading && messages[messages.length - 1].sender === 'bot' && (
                <div className="p-3 bg-background border-t border-border mt-auto animate-in slide-in-from-bottom-10">
                    <div className="relative flex items-center">
                        <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="exemplo@email.com"
                            className="pl-9 pr-12 h-11 bg-secondary/30"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button
                            size="icon"
                            className="absolute right-1 h-9 w-9"
                            onClick={handleSendMessage}
                            disabled={!input.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 text-center">
                        Pressione Enter para enviar
                    </p>
                </div>
            )}
        </div>
    );
};
