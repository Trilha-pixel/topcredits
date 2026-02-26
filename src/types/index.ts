
export type UserRole = 'admin' | 'reseller';

export interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    created_at?: string;
    balance?: number; // From joined queries
}

export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    updated_at: string;
}

export interface Product {
    id: number;
    name: string;
    credits_amount: number;
    price: number;
    active: boolean;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
    id: string;
    user_id: string;
    user_name?: string; // Optional because it might be joined
    product_id: number;
    product_name?: string; // Optional because it might be joined
    lovable_email: string;
    status: OrderStatus;
    price_at_purchase: number;
    created_at: string;
    completed_at: string | null;
    delivery_link: string | null;
    external_control_id?: string | null;
    customer_name?: string | null;
    profiles?: Profile; // For joins
    products?: Product; // For joins
}

export type TransactionType = 'deposit' | 'purchase' | 'refund';

export interface Transaction {
    id: string;
    user_id: string;
    type: TransactionType;
    amount: number;
    external_id: string | null;
    created_at: string;
}

export interface AcademyModule {
    id: string;
    title: string;
    description?: string;
    display_order: number;
    cover_url?: string;
}

export interface AcademyLesson {
    id: string;
    module_id: string;
    title: string;
    description: string;
    video_url: string;
    duration: string;
    display_order: number;
    cover_url?: string;
    content?: string; // HTML rich text
}

export interface AcademyAttachment {
    id: string;
    lesson_id: string;
    title: string;
    file_url: string;
    file_type?: string;
    file_size?: string;
    created_at?: string;
}
