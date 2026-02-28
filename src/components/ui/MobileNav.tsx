import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Receipt, Key } from 'lucide-react';

const MobileNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { key: 'home', icon: Home, label: 'Início', path: '/dashboard' },
        { key: 'buy', icon: ShoppingCart, label: 'Comprar', path: '/pacotes' },
        { key: 'orders', icon: Receipt, label: 'Pedidos', path: '/pedidos' },
        { key: 'licencas', icon: Key, label: 'Licenças', path: '/licencas' },
    ];

    const getActiveTab = () => {
        if (location.pathname === '/dashboard') return 0;
        if (location.pathname === '/pacotes') return 1;
        if (location.pathname === '/pedidos') return 2;
        if (location.pathname === '/licencas') return 3;
        return 0;
    };

    const activeIndex = getActiveTab();

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[420px] sm:hidden">
            <nav className="relative flex items-center justify-between p-1.5 rounded-[2.5rem] border border-white/10 bg-black/80 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
                {/* Animated Background Indicator */}
                <div
                    className="absolute h-[calc(100%-12px)] top-1.5 rounded-[2rem] bg-white/10 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] z-0"
                    style={{
                        width: 'calc(25% - 6px)',
                        transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 4}px))`
                    }}
                />

                {tabs.map((tab, idx) => {
                    const isActive = activeIndex === idx;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => navigate(tab.path)}
                            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 z-10 transition-all duration-300 ${isActive ? 'text-white' : 'text-neutral-500'
                                }`}
                        >
                            <tab.icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                            <span className={`text-[9px] font-bold tracking-tight uppercase ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default MobileNav;
