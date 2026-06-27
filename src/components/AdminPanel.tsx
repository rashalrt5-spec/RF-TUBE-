import React, { useState, useEffect } from 'react';
import { 
  Shield, Key, LayoutGrid, Plus, Trash2, Edit, Save, X, Eye, 
  Award, Unlock, RefreshCw, BarChart2, Film, Link2 
} from 'lucide-react';
import { Video } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  videos: (Video & { isLocked: boolean; adsWatched: number; targetLink: string })[];
  onRefreshVideos: () => void;
}

export default function AdminPanel({ onClose, videos, onRefreshVideos }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Dashboard statistics
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalAdViews: 0,
    totalUnlocks: 0,
    totalVideoViews: 0
  });

  // Video Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formThumbnail, setFormThumbnail] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formTargetLink, setFormTargetLink] = useState('');
  const [formDownloadLink, setFormDownloadLink] = useState('');
  const [formCopyLink, setFormCopyLink] = useState('');
  const [formRequiredAds, setFormRequiredAds] = useState(3);
  const [formCategory, setFormCategory] = useState('Tech');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Upload progress states
  const [videoUploadProgress, setVideoUploadProgress] = useState('');
  const [thumbUploadProgress, setThumbUploadProgress] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setProgress = type === 'video' ? setVideoUploadProgress : setThumbUploadProgress;
    const setUrl = type === 'video' ? setFormVideoUrl : setFormThumbnail;

    setProgress('Uploading file (আপলোড হচ্ছে)...');
    setFormError('');
    setFormSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/admin/upload?password=${password}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setUrl(data.url);
        setProgress('Upload completed (আপলোড সফল হয়েছে)!');
        setFormSuccess(`${type === 'video' ? 'Video' : 'Thumbnail'} uploaded successfully and field populated.`);
        setTimeout(() => setProgress(''), 3000);
      } else {
        setFormError(data.error || 'Upload failed.');
        setProgress('Upload failed.');
      }
    } catch (err: any) {
      console.error(err);
      setFormError('Upload network failure: ' + err.message);
      setProgress('Upload failed.');
    }
  };

  // Categories list
  const categories = ['Tutorial', 'Film', 'Music', 'Gaming', 'Tech', 'Blog', 'Other'];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_token', password);
        fetchStats(password);
      } else {
        setAuthError('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
      setAuthError('Connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (pwd: string) => {
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    const savedToken = sessionStorage.getItem('admin_token');
    if (savedToken === 'Rashal117') {
      setIsAuthenticated(true);
      setPassword(savedToken);
      fetchStats(savedToken);
    }
  }, []);

  const handleResetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormThumbnail('');
    setFormVideoUrl('');
    setFormTargetLink('');
    setFormDownloadLink('');
    setFormCopyLink('');
    setFormRequiredAds(3);
    setFormCategory('Tech');
    setIsEditing(false);
    setEditId(null);
    setFormError('');
    setFormSuccess('');
  };

  const handleEditClick = (video: Video) => {
    setIsEditing(true);
    setEditId(video.id);
    setFormTitle(video.title);
    setFormDescription(video.description);
    setFormThumbnail(video.thumbnailUrl);
    setFormVideoUrl(video.videoUrl);
    setFormTargetLink(''); // Keep empty, only input if editing the link
    setFormDownloadLink(''); // Keep empty, only input if editing the link
    setFormCopyLink(''); // Keep empty, only input if editing the link
    setFormRequiredAds(video.requiredAdsCount);
    setFormCategory(video.category);
    setFormError('');
    setFormSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (videoId: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this video? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (data.success) {
        onRefreshVideos();
        fetchStats(password);
        handleResetForm();
        setFormSuccess('Video deleted successfully!');
      } else {
        setFormError(data.error || 'Failed to delete video.');
      }
    } catch (err: any) {
      setFormError('Connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const getYouTubeId = (url: string): string | null => {
      if (!url) return null;
      if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };

    const hasYtId = getYouTubeId(formVideoUrl);

    if (!formTitle || (!isEditing && !formTargetLink)) {
      setFormError('Title and Destination Link are required.');
      return;
    }

    setLoading(true);

    try {
      const url = isEditing ? `/api/admin/videos/${editId}` : '/api/admin/videos';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        password,
        title: formTitle,
        description: formDescription,
        thumbnailUrl: formThumbnail,
        videoUrl: formVideoUrl,
        targetLink: formTargetLink || undefined, // Send if defined
        downloadLink: formDownloadLink || undefined, // Send if defined
        copyLink: formCopyLink || undefined, // Send if defined
        requiredAdsCount: formRequiredAds,
        category: formCategory
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        onRefreshVideos();
        fetchStats(password);
        setFormSuccess(isEditing ? 'Video details updated!' : 'New video secure payload deployed!');
        handleResetForm();
      } else {
        setFormError(data.error || 'Something went wrong.');
      }
    } catch (err: any) {
      setFormError('Network failure: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERING MODAL SIGN IN IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center mx-auto text-red-500">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Secure Administration Access
            </h2>
            <p className="text-xs text-zinc-500">
              This node is encrypted. Please provide the primary credential to continue.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 font-mono">
                Access Token
              </label>
              <div className="flex items-center bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 focus-within:border-zinc-700 transition-all">
                <Key className="w-4 h-4 text-zinc-600 mr-2.5" />
                <input
                  type="password"
                  placeholder="Enter Admin Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-sm text-zinc-100 outline-none w-full"
                  required
                />
              </div>
            </div>

            {authError && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg font-medium text-center">
                {authError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl text-xs border border-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Unlock Terminal</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDERING MAIN ADMIN TERMINAL ---
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100 p-4 md:p-8 animate-fade-in">
      
      {/* Control panel header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between border-b border-zinc-800/80 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600/10 text-red-500 rounded-xl border border-red-600/20">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
              System Admin Terminal <span className="text-[10px] font-mono font-normal bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">Rashal v1.0</span>
            </h1>
            <p className="text-xs text-zinc-500">Manage stream nodes, track analytics and update encrypted payload targets securely.</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Exit Console</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Add/Edit Video Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/90 rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h2 className="text-sm font-bold text-zinc-200 tracking-wide flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-500" />
                <span>{isEditing ? 'Edit Stream Node' : 'Register New Stream Node'}</span>
              </h2>
              {isEditing && (
                <button 
                  onClick={handleResetForm}
                  className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded"
                  title="Cancel Edit"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-400 font-mono">Video Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Unlocked VIP Tutorial"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-zinc-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-400 font-mono">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-zinc-700"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-400 font-mono">Required Ad Watch *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formRequiredAds}
                    onChange={(e) => setFormRequiredAds(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-zinc-700 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-400 font-mono flex justify-between items-center">
                  <span>Video stream URL, YouTube ID or File</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. dQw4w9WgXcQ or /uploads/..."
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-zinc-700"
                  />
                  <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer border border-zinc-750 flex items-center gap-1 hover:text-white transition-all">
                    <Film className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'video')}
                    />
                  </label>
                </div>
                {videoUploadProgress && (
                  <div className="text-[10px] text-yellow-500 font-mono mt-0.5">{videoUploadProgress}</div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-400 font-mono flex justify-between items-center">
                  <span>Thumbnail Image URL (or upload image)</span>
                  <span className="text-[10px] text-zinc-500 font-sans font-normal">Optional for YouTube</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/... or upload"
                    value={formThumbnail}
                    onChange={(e) => setFormThumbnail(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-zinc-700"
                  />
                  <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer border border-zinc-750 flex items-center gap-1 hover:text-white transition-all">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'thumbnail')}
                    />
                  </label>
                </div>
                {thumbUploadProgress && (
                  <div className="text-[10px] text-yellow-500 font-mono mt-0.5">{thumbUploadProgress}</div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-400 font-mono flex justify-between">
                  <span>Destination target link (Database Encrypted) *</span>
                  <span className="text-[10px] text-zinc-500 font-sans italic">(Visit Destination Link)</span>
                </label>
                <input
                  type="url"
                  placeholder={isEditing ? '•••••••••••• (Leave empty to keep current)' : 'https://t.me/your_secret_channel_or_drive'}
                  value={formTargetLink}
                  onChange={(e) => setFormTargetLink(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-zinc-700 font-mono placeholder:text-zinc-600"
                  required={!isEditing}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-400 font-mono flex justify-between">
                  <span>Download File link (Database Encrypted)</span>
                  <span className="text-[10px] text-zinc-500 font-sans italic">(Download File - ঐচ্ছিক)</span>
                </label>
                <input
                  type="url"
                  placeholder={isEditing ? '•••••••••••• (Leave empty to keep current / remove)' : 'https://t.me/download_link'}
                  value={formDownloadLink}
                  onChange={(e) => setFormDownloadLink(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-zinc-700 font-mono placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-400 font-mono flex justify-between">
                  <span>Copy Link URL (Database Encrypted)</span>
                  <span className="text-[10px] text-zinc-500 font-sans italic">(Copy Link - ঐচ্ছিক)</span>
                </label>
                <input
                  type="url"
                  placeholder={isEditing ? '•••••••••••• (Leave empty to keep current / remove)' : 'https://t.me/copy_target_link'}
                  value={formCopyLink}
                  onChange={(e) => setFormCopyLink(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-zinc-700 font-mono placeholder:text-zinc-600"
                />
                <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">
                  সবগুলো লিংকই ডাটাবেজে অত্যন্ত সুরক্ষিতভাবে AES-এনক্রিপ্ট করে সেভ হবে। ফাঁকা রাখলে ডেস্টিনেশন লিংকটিই ডিফল্ট হিসেবে কাজ করবে।
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-400 font-mono">Description</label>
                <textarea
                  rows={3}
                  placeholder="Details about this locked payload..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-zinc-700 resize-none"
                />
              </div>

              {formError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/10 p-2 rounded-lg text-center font-medium">
                  {formError}
                </p>
              )}

              {formSuccess && (
                <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/10 p-2 rounded-lg text-center font-medium">
                  {formSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-700 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/15 cursor-pointer hover:opacity-90 transition-all text-xs"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isEditing ? 'Save Payload Edit' : 'Deploy Encrypted Node'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMNS: Analytics & Video list grid */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ANALYTICS HIGHLIGHTS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase font-mono">Total Streams</span>
              <span className="text-xl font-bold text-zinc-100 font-mono">{stats.totalVideos}</span>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase font-mono">Ad Interactions</span>
              <span className="text-xl font-bold text-yellow-500 font-mono">{stats.totalAdViews}</span>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase font-mono">Decrypted links</span>
              <span className="text-xl font-bold text-emerald-500 font-mono">{stats.totalUnlocks}</span>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase font-mono">Stream Views</span>
              <span className="text-xl font-bold text-zinc-100 font-mono">{stats.totalVideoViews}</span>
            </div>

          </div>

          {/* STREAM NODES DIRECTORY */}
          <div className="bg-zinc-900/90 rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-zinc-200 tracking-wide flex items-center gap-2 pb-4 border-b border-zinc-800">
              <LayoutGrid className="w-4 h-4 text-zinc-500" />
              <span>Registered Nodes Catalog</span>
            </h2>

            {videos.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No active video nodes registered yet. Use the deployment form to create one.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950">
                {videos.map((video) => (
                  <div key={video.id} className="flex items-center gap-4 p-4 hover:bg-zinc-900/50 transition-colors text-xs">
                    
                    {/* Small thumbnail */}
                    {(() => {
                      const getYouTubeId = (url: string): string | null => {
                        if (!url) return null;
                        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                        const match = url.match(regExp);
                        return (match && match[2].length === 11) ? match[2] : null;
                      };
                      const ytId = getYouTubeId(video.videoUrl);
                      const displayThumb = video.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80');
                      return (
                        <img 
                          src={displayThumb} 
                          alt={video.title} 
                          referrerPolicy="no-referrer"
                          className="w-16 h-10 object-cover rounded-lg border border-zinc-800 flex-shrink-0"
                        />
                      );
                    })()}

                    {/* Metadata details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-zinc-200 truncate">{video.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500 font-mono">
                        <span className="px-1.5 py-0.5 bg-zinc-900 rounded text-zinc-400">{video.category}</span>
                        <span>•</span>
                        <span>{video.views} Views</span>
                        <span>•</span>
                        <span className="text-amber-500/90 font-bold">{video.requiredAdsCount} Ads Lock</span>
                      </div>
                    </div>

                    {/* Actions column */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEditClick(video)}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 transition-all cursor-pointer"
                        title="Edit Node Settings"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(video.id)}
                        disabled={loading}
                        className="p-2 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 rounded-lg border border-zinc-800 hover:border-red-900 transition-all cursor-pointer"
                        title="Delete Node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
