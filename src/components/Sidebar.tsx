import React from 'react';
import { Home, Unlock, Compass, HelpCircle, Shield, Award } from 'lucide-react';

interface SidebarProps {
  activeTab: 'all' | 'unlocked';
  setActiveTab: (tab: 'all' | 'unlocked') => void;
  unlockedCount: number;
  totalPoints: number;
  isOpen: boolean;
  onClose: () => void;
  isAdminAuthenticated: boolean;
  onAdminOpen: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  unlockedCount,
  totalPoints,
  isOpen,
  onClose,
  isAdminAuthenticated,
  onAdminOpen
}: SidebarProps) {
  
  const menuItems = [
    {
      id: 'all' as const,
      label: 'Home Feed',
      icon: Home,
    },
    {
      id: 'unlocked' as const,
      label: 'Unlocked Links',
      icon: Unlock,
      badge: unlockedCount > 0 ? unlockedCount : undefined,
    }
  ];

  const handleTabClick = (tabId: 'all' | 'unlocked') => {
    setActiveTab(tabId);
    onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0f0f0f] text-zinc-300 w-60 py-4 border-r border-zinc-800/80">
      
      {/* Menu Options */}
      <div className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isActive 
                  ? 'bg-zinc-800 text-white font-semibold' 
                  : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-red-500' : ''}`} />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold bg-green-500/20 text-green-400 rounded-full font-mono">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 border-t border-zinc-800/80 my-4" />

        {/* Info panel */}
        <div className="px-4 py-3 bg-zinc-900/60 rounded-xl border border-zinc-800/50 mx-2 space-y-2">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">Total Rewards</span>
          </div>
          <div className="text-xl font-bold font-mono text-zinc-100">
            {totalPoints} <span className="text-xs text-zinc-500 font-normal">Ad Units</span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Support your creators by watching ads to instantly decode secure links.
          </p>
        </div>
      </div>

      {/* Admin Quick Entry if already unlocked */}
      {isAdminAuthenticated && (
        <div className="px-4 py-2 border-t border-zinc-800/80">
          <button
            onClick={() => {
              onAdminOpen();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold border border-zinc-800 transition-colors"
          >
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Admin Control Panel</span>
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="px-6 py-4 border-t border-zinc-800/80 text-[10px] text-zinc-600 font-mono text-center">
        <span>© 2026 TubeAd Inc.<br/>Telegram Web App Platform</span>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop view */}
      <aside className="hidden md:block w-60 flex-shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 bg-[#0f0f0f]">
        {sidebarContent}
      </aside>

      {/* Mobile view Drawer overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />
          
          {/* Drawer container */}
          <div className="relative flex flex-col h-full animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
