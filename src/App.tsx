import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import VideoCard from './components/VideoCard';
import WatchPage from './components/WatchPage';
import AdminPanel from './components/AdminPanel';
import AdModal from './components/AdModal';
import { Video, TelegramUser } from './types';
import { Compass, RefreshCw, Sparkles, Key, Shield } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [videos, setVideos] = useState<(Video & { isLocked: boolean; adsWatched: number; targetLink: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked'>('all');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  
  // UI states
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin auth persistence in app shell
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Initialize Telegram WebApp SDK or setup Simulated user profile
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
      // 1. Genuine Telegram Environment
      tg.ready();
      tg.expand();
      
      const tgUser = tg.initDataUnsafe.user;
      const parsedUser: TelegramUser = {
        id: String(tgUser.id),
        username: tgUser.username || `user_${tgUser.id}`,
        firstName: tgUser.first_name || 'Telegram User',
        lastName: tgUser.last_name || '',
        photoUrl: tgUser.photo_url || ''
      };
      
      setUser(parsedUser);
      localStorage.setItem('tg_user', JSON.stringify(parsedUser));
    } else {
      // 2. Mock environment (Browser, Preview, AI Studio Sandbox)
      const cached = localStorage.getItem('tg_user');
      if (cached) {
        setUser(JSON.parse(cached));
      } else {
        // Auto-generate beautiful mock user for testing instant demo
        const mockUser: TelegramUser = {
          id: '11204873_rashal',
          username: 'rashal_tech',
          firstName: 'Rashal',
          lastName: 'Developer',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        };
        setUser(mockUser);
        localStorage.setItem('tg_user', JSON.stringify(mockUser));
      }
    }

    // Persist admin auth status if they signed in
    const token = sessionStorage.getItem('admin_token');
    if (token === 'Rashal117') {
      setIsAdminAuthenticated(true);
    }
  }, []);

  // Fetch all videos from backend whenever user is initialized
  const fetchVideos = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/videos?userId=${user.id}`);
      const data = await res.json();
      
      if (data.success) {
        setVideos(data.videos);
      } else {
        setError(data.error || 'Failed to load videos.');
      }
    } catch (err: any) {
      setError('Could not connect to the backend server. Re-trying shortly...');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user]);

  // Handle mock profile change
  const handleLogoutMockUser = () => {
    localStorage.removeItem('tg_user');
    // Reload with a new random mock user
    const randomId = Math.floor(Math.random() * 9000000) + 1000000;
    const mockUser: TelegramUser = {
      id: String(randomId),
      username: `rashal_tester_${randomId.toString().substring(0, 3)}`,
      firstName: `Tester_${randomId.toString().substring(0, 3)}`,
      photoUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`
    };
    setUser(mockUser);
    localStorage.setItem('tg_user', JSON.stringify(mockUser));
    setSelectedVideoId(null);
  };

  // Triggered when watch ad modal is finished successfully
  const handleAdComplete = async () => {
    if (!user || !selectedVideoId) return;

    try {
      const res = await fetch('/api/watch-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          videoId: selectedVideoId
        })
      });

      const data = await res.json();
      if (data.success) {
        // Refresh videos lists to get updated status and decrypt links dynamically if needed
        await fetchVideos();
      }
    } catch (err) {
      console.error('Error recording ad completion:', err);
    } finally {
      setIsWatchingAd(false);
    }
  };

  // Triggered when user requests to decrypt link
  const handleGetLink = async () => {
    if (!user || !selectedVideoId) return;

    try {
      const res = await fetch('/api/get-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          videoId: selectedVideoId
        })
      });

      const data = await res.json();
      if (data.success) {
        await fetchVideos();
      }
    } catch (err) {
      console.error('Error fetching decrypted link:', err);
    }
  };

  // Derived user statistics
  const unlockedVideos = videos.filter(v => !v.isLocked);
  const unlockedCount = unlockedVideos.length;
  const totalPoints = videos.reduce((sum, v) => sum + (v.adsWatched || 0), 0);

  // Search and Tab filtering
  const filteredVideos = videos.filter((v) => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'unlocked') {
      return matchesSearch && !v.isLocked;
    }
    return matchesSearch;
  });

  const selectedVideo = videos.find(v => v.id === selectedVideoId);

  const triggerRedirect = (url: string) => {
    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Redirect failed:', e);
    }
  };

  const handleSelectVideo = (videoId: string) => {
    triggerRedirect("https://www.effectivecpmnetwork.com/i6ri8vs2?key=3e6ae76718530516393857b7f28b1727");
    setSelectedVideoId(videoId);
  };

  const handleBack = () => {
    triggerRedirect("https://www.effectivecpmnetwork.com/j75ihcy5?key=c4655161e29262ad189287ef9dd07ad4");
    setSelectedVideoId(null);
    fetchVideos();
  };

  // Sync admin auth status on panel open triggers
  const handleAdminTrigger = () => {
    setIsAdminOpen(true);
    const token = sessionStorage.getItem('admin_token');
    if (token === 'Rashal117') {
      setIsAdminAuthenticated(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100 flex flex-col font-sans antialiased">
      
      {/* NAVBAR */}
      <Navbar 
        user={user}
        onSearch={setSearchQuery}
        onAdminTrigger={handleAdminTrigger}
        onLogoutMockUser={handleLogoutMockUser}
        onMenuToggle={() => setMenuOpen(!menuOpen)}
      />

      {/* ADMIN PANEL IF TRIGGERED */}
      {isAdminOpen ? (
        <AdminPanel 
          onClose={() => {
            setIsAdminOpen(false);
            const token = sessionStorage.getItem('admin_token');
            if (token === 'Rashal117') {
              setIsAdminAuthenticated(true);
            }
            fetchVideos();
          }}
          videos={videos}
          onRefreshVideos={fetchVideos}
        />
      ) : (
        <div className="flex flex-1 relative">
          
          {/* SIDEBAR */}
          <Sidebar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unlockedCount={unlockedCount}
            totalPoints={totalPoints}
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            isAdminAuthenticated={isAdminAuthenticated}
            onAdminOpen={handleAdminTrigger}
          />

          {/* MAIN CONTAINER */}
          <main className="flex-1 overflow-y-auto">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500 text-sm">
                <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
                <span>Syncing secure stream catalog...</span>
              </div>
            ) : error ? (
              <div className="max-w-md mx-auto my-16 text-center space-y-4 p-6 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                <p className="text-sm text-zinc-400 font-medium">{error}</p>
                <button 
                  onClick={fetchVideos}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                >
                  Reconnect
                </button>
              </div>
            ) : selectedVideoId && selectedVideo ? (
              
              /* WATCH PAGE VIEW */
              <WatchPage 
                video={selectedVideo}
                suggestedVideos={videos}
                onBack={handleBack}
                onSelectVideo={handleSelectVideo}
                onWatchAd={() => setIsWatchingAd(true)}
                onGetLink={handleGetLink}
                isWatchingAd={isWatchingAd}
              />

            ) : (
              
              /* FEED GRID VIEW */
              <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
                
                {/* Simulated Telegram status notification inside the app */}
                <div className="bg-gradient-to-r from-red-600/10 to-transparent p-4 rounded-2xl border border-red-600/15 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-red-500 animate-pulse" />
                      <span>YouTube Ad Station for Telegram</span>
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Watch secure sponsorships to unlock files, Telegram channels and cloud links immediately.
                    </p>
                  </div>
                  
                  {/* Subtle info pill */}
                  <span className="hidden sm:inline-block px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] text-zinc-400 font-mono">
                    Telegram Secured Endpoint
                  </span>
                </div>

                {/* Categories filtering pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-medium">
                  {['All Streams', 'Unlocked Node', 'Tech Support', 'VIP Channels'].map((label, idx) => {
                    const isSelected = (idx === 0 && activeTab === 'all') || (idx === 1 && activeTab === 'unlocked');
                    return (
                      <button
                        key={label}
                        onClick={() => {
                          if (idx === 0) setActiveTab('all');
                          if (idx === 1) setActiveTab('unlocked');
                        }}
                        className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors border cursor-pointer ${
                          isSelected 
                            ? 'bg-zinc-100 text-[#0f0f0f] border-zinc-100 font-bold' 
                            : 'bg-zinc-900 text-zinc-400 border-zinc-850 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Videos Catalog Grid */}
                {filteredVideos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
                    <Compass className="w-10 h-10 text-zinc-700 animate-spin-slow" />
                    <p className="text-xs text-zinc-400 font-medium">
                      {activeTab === 'unlocked' 
                        ? 'No unlocked links detected yet. Start watching ads to decode one!' 
                        : 'No videos matching search or filters found.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {filteredVideos.map((video) => (
                      <VideoCard 
                        key={video.id}
                        video={video}
                        onSelect={() => handleSelectVideo(video.id)}
                      />
                    ))}
                  </div>
                )}

              </div>
            )}

          </main>
        </div>
      )}

      {/* WATCH SPONSOR AD OVERLAY MODAL */}
      <AnimatePresence>
        {isWatchingAd && (
          <AdModal 
            onComplete={handleAdComplete}
            onClose={() => setIsWatchingAd(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
