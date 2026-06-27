import React from 'react';
import { Play, Unlock, Lock, Eye, Calendar, Award } from 'lucide-react';
import { Video } from '../types';

interface VideoCardProps {
  video: Video & { isLocked: boolean; adsWatched: number; targetLink: string };
  onSelect: () => void;
  key?: React.Key;
}

export default function VideoCard({ video, onSelect }: VideoCardProps) {
  // Extract YouTube ID if it's a watch or embed URL to show higher quality thumbnail if desired
  // otherwise, we use the custom thumbnailUrl provided by the admin.
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const ytId = getYouTubeId(video.videoUrl);
  const displayThumbnail = video.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80');

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div 
      onClick={onSelect}
      className="group flex flex-col bg-zinc-900/40 rounded-2xl overflow-hidden border border-zinc-800/40 hover:border-zinc-700/60 hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer shadow-lg shadow-black/10"
    >
      {/* Thumbnail container */}
      <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
        <img 
          src={displayThumbnail} 
          alt={video.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Floating play indicator overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Ad Requirement and Unlock Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          {video.isLocked ? (
            <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase bg-black/80 backdrop-blur-md text-amber-500 rounded-lg border border-amber-500/20 shadow-md">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>{video.requiredAdsCount - video.adsWatched} Ads Left</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase bg-emerald-500/90 text-white rounded-lg shadow-md animate-pulse">
              <Unlock className="w-3 h-3 text-white" />
              <span>Unlocked</span>
            </span>
          )}
        </div>

        {/* Category Pill */}
        <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[10px] font-medium bg-black/75 backdrop-blur-md text-zinc-300 rounded-md border border-zinc-800/50">
          {video.category}
        </span>
      </div>

      {/* Content Details */}
      <div className="p-4 flex gap-3 flex-1">
        {/* Visual avatar symbol */}
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center border border-zinc-700/50 text-xs font-bold text-zinc-300">
            {video.category.substring(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Title, description & stats */}
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white leading-snug line-clamp-2 transition-colors">
            {video.title}
          </h3>
          
          <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
            {video.description || 'Watch to decrypt destination link.'}
          </p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 pt-2 border-t border-zinc-800/50 text-[11px] text-zinc-500 font-mono">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-zinc-500" />
              <span>{video.views} views</span>
            </span>
            <span className="text-zinc-700">•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>{formatDate(video.createdAt)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
