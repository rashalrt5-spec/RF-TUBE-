import React, { useState, useRef } from 'react';
import { Search, Youtube, User, LogOut, Code, Menu } from 'lucide-react';
import { TelegramUser } from '../types';

interface NavbarProps {
  user: TelegramUser | null;
  onSearch: (query: string) => void;
  onAdminTrigger: () => void;
  onLogoutMockUser: () => void;
  onMenuToggle: () => void;
}

export default function Navbar({ user, onSearch, onAdminTrigger, onLogoutMockUser, onMenuToggle }: NavbarProps) {
  const [searchVal, setSearchVal] = useState('');
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safely sync search query to parent using useEffect to avoid render-time updates
  React.useEffect(() => {
    onSearch(searchVal);
  }, [searchVal, onSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
  };

  const handleLogoClick = () => {
    // Hidden click handler: click 5 times within 2 seconds to unlock Admin Modal
    setLogoClicks((prev) => {
      const nextClicks = prev + 1;
      
      if (nextClicks >= 5) {
        onAdminTrigger();
        return 0;
      }

      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      clickTimeoutRef.current = setTimeout(() => {
        setLogoClicks(0);
      }, 2000);

      return nextClicks;
    });
  };

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between bg-[#0f0f0f] px-4 py-2 md:px-6 border-b border-zinc-800/80 h-14">
      
      {/* Left side: Logo & Toggle */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuToggle}
          className="p-2 hover:bg-zinc-800 rounded-full text-white md:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-1.5 cursor-pointer select-none group"
          title="Watch Link YouTube Stream"
        >
          <div className="bg-red-600 p-1.5 rounded-lg text-white group-active:scale-95 transition-transform">
            <Youtube className="w-5 h-5 fill-white text-red-600" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight font-sans flex items-center gap-1">
            TubeAd <span className="text-[10px] font-mono text-zinc-500 font-normal hidden sm:inline">TG</span>
          </span>
        </div>
      </div>

      {/* Middle side: Search Bar */}
      <form 
        onSubmit={handleSearchSubmit}
        className="flex-1 max-w-lg mx-4 flex items-center h-9"
      >
        <div className="flex w-full items-center bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700 transition-all">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
            }}
            className="w-full bg-transparent px-4 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none"
          />
          <button 
            type="submit" 
            className="bg-zinc-800 px-5 py-2 hover:bg-zinc-700 text-zinc-300 border-l border-zinc-800 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Right side: User info (Telegram or Mock) */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            {user.photoUrl ? (
              <img 
                src={user.photoUrl} 
                alt={user.firstName || 'User'} 
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-zinc-700 object-cover shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700">
                <User className="w-4 h-4" />
              </div>
            )}
            
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-zinc-200">
                {user.firstName || 'Guest'}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                @{user.username || 'tg_user'}
              </span>
            </div>

            {/* Hidden logout for mock profiles (outside TG wrapper) */}
            {!(window as any).Telegram?.WebApp && (
              <button 
                onClick={onLogoutMockUser}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                title="Change Simulated Profile"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>

    </nav>
  );
}
