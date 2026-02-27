import React from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  GraduationCap, 
  Key,
  LogOut,
  Shield
} from 'lucide-react';

type AdminTab = 'overview' | 'orders' | 'customers' | 'products' | 'academy' | 'licenses';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  userName?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  onLogout,
  userName = 'Admin'
}) => {
  const menuItems = [
    { key: 'overview' as AdminTab, label: 'Visão Geral', icon: LayoutDashboard },
    { key: 'orders' as AdminTab, label: 'Pedidos', icon: Package },
    { key: 'customers' as AdminTab, label: 'Clientes', icon: Users },
    { key: 'products' as AdminTab, label: 'Produtos', icon: ShoppingCart },
    { key: 'academy' as AdminTab, label: 'Academy', icon: GraduationCap },
    { key: 'licenses' as AdminTab, label: 'Licenças', icon: Key },
  ];

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Painel de Controle</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {userName.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
