import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, ChevronDown, GraduationCap, Headphones, LogOut, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import logo from '@/assets/logo-neon.png';

interface DashboardHeaderProps {
  userName: string;
  initials: string;
  breadcrumb?: string;
  onLogout: () => void;
  onAcademyClick?: () => void;
  onSettings?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  initials,
  breadcrumb = 'Dashboard',
  onLogout,
  onAcademyClick,
  onSettings,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-[hsl(0_0%_100%/0.05)] bg-[hsl(0_0%_0%/0.4)] backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 h-14">
        {/* Left: Brand + Breadcrumb */}
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Top Credits"
            className="h-10 w-10 object-contain"
            style={{ filter: 'drop-shadow(0 0 8px hsl(263 70% 66% / 0.6)) drop-shadow(0 0 20px hsl(263 70% 66% / 0.25))' }}
          />
          <div className="h-5 w-px bg-[hsl(0_0%_100%/0.1)]" />
          <span className="text-sm text-muted-foreground font-medium">{breadcrumb}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={300}>
            {/* Support */}
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[hsl(0_0%_100%/0.05)] transition-colors"
                >
                  <Headphones className="h-4 w-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent>Suporte</TooltipContent>
            </Tooltip>

            {/* Academy */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onAcademyClick}
                  className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[hsl(0_0%_100%/0.05)] transition-colors"
                >
                  <GraduationCap className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Academy</TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="relative flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[hsl(0_0%_100%/0.05)] transition-colors">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Notificações</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Separator */}
          <div className="h-5 w-px bg-[hsl(0_0%_100%/0.08)] mx-1" />

          {/* Profile Pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full bg-[hsl(0_0%_100%/0.05)] hover:bg-[hsl(0_0%_100%/0.08)] pl-1 pr-2.5 py-1 transition-colors">
                <Avatar className="h-6 w-6 border border-[hsl(0_0%_100%/0.1)]">
                  <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-foreground hidden sm:block max-w-[120px] truncate">
                  {userName}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground break-all">Revendedor</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSettings} className="gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAcademyClick} className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Academy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
