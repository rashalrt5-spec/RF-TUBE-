import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, Play, ExternalLink, Copy, Check, Eye, 
  Calendar, ChevronLeft, Award, HelpCircle, RefreshCw, Download,
  ThumbsUp, ThumbsDown, Share2
} from 'lucide-react';
import { Video } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface WatchPageProps {
  video: Video & { isLocked: boolean; adsWatched: number; targetLink: string };
  suggestedVideos: (Video & { isLocked: boolean; adsWatched: number; targetLink: string })[];
  onBack: () => void;
  onSelectVideo: (videoId: string) => void;
  onWatchAd: () => void;
  onGetLink: () => void;
  isWatchingAd: boolean;
}

export default function WatchPage({
  video,
  suggestedVideos,
  onBack,
  onSelectVideo,
  onWatchAd,
  onGetLink,
  isWatchingAd
}: WatchPageProps) {
  const [copied, setCopied] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [likes, setLikes] = useState(Math.floor((video.views || 100) * 0.08) + 42);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showYtDownloadOptions, setShowYtDownloadOptions] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Parse YouTube video ID from various styles of links
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    
    // Check if it is a pure 11-char ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

    // Standard watch URL: youtube.com/watch?v=ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : null;
  };

  const ytId = getYouTubeId(video.videoUrl);

  const handleCopyLink = () => {
    const linkToCopy = video.copyLink || video.targetLink;
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      
      {/* Left section: Player & Main Video Details */}
      <div className="flex-1 lg:max-w-[70%]">
        
        {/* Back navigation button */}
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white mb-4 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        {/* Video Player Frame */}
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-xl border border-zinc-850 relative group">
          {video.isLocked ? (
            // Locked screen inside player: must watch ads first
            <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 text-center">
              {/* Blur background of thumbnail if available */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-xs pointer-events-none" 
                style={{ backgroundImage: `url(${video.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80')})` }} 
              />
              <div className="absolute inset-0 bg-black/60 pointer-events-none" />

              <div className="z-10 space-y-4 max-w-sm px-4">
                <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto text-yellow-500 shadow-lg shadow-yellow-500/5 animate-bounce">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm md:text-base font-bold text-white">Video is Locked (ভিডিওটি লক করা আছে)</h3>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    ভিডিওটি প্লে করতে প্রথমে আপনাকে <span className="text-yellow-500 font-bold">{video.requiredAdsCount}টি স্পন্সর বিজ্ঞাপন</span> দেখতে হবে।
                  </p>
                  <p className="text-[9px] text-yellow-500/80 italic leading-tight">
                    * আনলক হওয়ার ৪ ঘণ্টা পর ভিডিওটি স্বয়ংক্রিয়ভাবে পুনরায় লক হয়ে যাবে।
                  </p>
                </div>

                {/* Ads watched indicator circles */}
                <div className="flex items-center justify-center gap-2.5 py-1">
                  {Array.from({ length: video.requiredAdsCount }).map((_, idx) => {
                    const isWatched = idx < video.adsWatched;
                    return (
                      <div 
                        key={idx} 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono border transition-all ${
                          isWatched 
                            ? 'bg-yellow-500 text-black border-yellow-500 shadow-md shadow-yellow-500/20' 
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        {idx + 1}
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-[10px] text-zinc-500 font-mono">
                  Completed: {video.adsWatched} of {video.requiredAdsCount} Ad Units
                </div>

                <button
                  onClick={onWatchAd}
                  disabled={isWatchingAd}
                  className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10 hover:from-yellow-400 hover:to-amber-500 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Sponsor Ad দেখুন ({video.requiredAdsCount - video.adsWatched} Left)</span>
                </button>
              </div>
            </div>
          ) : ytId ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          ) : video.videoUrl ? (
            <video
              src={video.videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
              poster={video.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80')}
            />
          ) : (
            // Premium simulated stream player if no stream URL exists
            <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-b from-zinc-900 to-black p-6">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10 filter blur-xs" 
                style={{ backgroundImage: `url(${video.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80')})` }} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              
              <div className="z-10 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-red-600/10 border border-red-600/30 flex items-center justify-center mx-auto text-red-500 shadow-xl shadow-red-600/5">
                  <Play className="w-9 h-9 fill-red-600 text-red-600 ml-1 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-zinc-300">TubeAd Premium Player</h4>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">Streaming optimized metadata for telegram network environments.</p>
                </div>
              </div>

              {/* Player UI elements */}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-center text-xs text-zinc-500 font-mono">
                <span>00:00 / Simulated Live</span>
                <span className="px-2 py-0.5 bg-red-600 text-white rounded font-bold text-[10px] uppercase">Live stream</span>
              </div>
            </div>
          )}
        </div>

        {/* YouTube Style Video Metadata */}
        <div className="mt-4 space-y-4">
          <h1 className="text-lg md:text-xl font-bold text-zinc-100 leading-snug">
            {video.title}
          </h1>

          {/* YouTube Style Info & Actions Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1 border-b border-zinc-800/60 pb-4">
            {/* Left: Channel Info & Subscribe */}
            <div className="flex items-center justify-between md:justify-start gap-4">
              <div className="flex items-center gap-3">
                {/* Channel Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-inner uppercase tracking-wider">
                  {video.category ? video.category.slice(0, 2) : 'YT'}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-zinc-100 text-sm hover:text-white transition-colors cursor-pointer">
                      {video.category ? `${video.category} Hub` : 'Creator Tube'}
                    </span>
                    <span className="inline-flex w-3.5 h-3.5 bg-blue-500 text-white rounded-full text-[8px] items-center justify-center font-bold" title="Verified Creator">✓</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium">148K Subscribers</span>
                </div>
              </div>

              {/* Subscribe button */}
              <button
                onClick={() => setSubscribed(!subscribed)}
                className={`ml-3 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  subscribed 
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                    : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>

            {/* Right: Modern Pill Buttons (Like, Share, Download, Clip) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Like / Dislike Pill Group */}
              <div className="flex items-center bg-zinc-800/90 hover:bg-zinc-800 rounded-full p-0.5 border border-zinc-750">
                <button
                  onClick={() => {
                    if (liked) {
                      setLiked(false);
                      setLikes(l => l - 1);
                    } else {
                      setLiked(true);
                      setLikes(l => l + 1);
                      setDisliked(false);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-l-full hover:bg-zinc-700 transition-colors text-xs font-semibold ${liked ? 'text-red-500' : 'text-zinc-200'}`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-red-500' : ''}`} />
                  <span>{likes.toLocaleString()}</span>
                </button>
                <div className="w-[1px] h-4 bg-zinc-700" />
                <button
                  onClick={() => {
                    if (disliked) {
                      setDisliked(false);
                    } else {
                      setDisliked(true);
                      if (liked) {
                        setLiked(false);
                        setLikes(l => l - 1);
                      }
                    }
                  }}
                  className={`px-3 py-1.5 rounded-r-full hover:bg-zinc-700 transition-colors text-xs font-semibold ${disliked ? 'text-zinc-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  <ThumbsDown className={`w-3.5 h-3.5 ${disliked ? 'fill-zinc-400' : ''}`} />
                </button>
              </div>

              {/* Share Pill */}
              <button
                onClick={() => {
                  const watchUrl = `${window.location.origin}/?video=${video.id}`;
                  navigator.clipboard.writeText(watchUrl);
                  setShareSuccess(true);
                  setTimeout(() => setShareSuccess(false), 2000);
                }}
                className="flex items-center gap-1.5 bg-zinc-800/90 hover:bg-zinc-750 border border-zinc-750 px-3.5 py-1.5 rounded-full text-xs font-semibold text-zinc-200 transition-colors cursor-pointer active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>{shareSuccess ? 'Copied!' : 'Share'}</span>
              </button>

              {/* YouTube Downloader Tool Button */}
              {ytId && (
                <button
                  onClick={() => setShowYtDownloadOptions(!showYtDownloadOptions)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    showYtDownloadOptions 
                      ? 'bg-zinc-100 text-black hover:bg-zinc-200' 
                      : 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/10'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download (ডাউনলোড)</span>
                </button>
              )}
            </div>
          </div>

          {/* Inline YouTube Direct Downloader Card */}
          {ytId && showYtDownloadOptions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span className="font-bold text-xs text-zinc-200">
                    Direct Video & Audio Downloader (এখানেই ডাউনলোড হবে)
                  </span>
                </div>
                <button 
                  onClick={() => setShowYtDownloadOptions(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-200"
                >
                  ✕ Close
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                নিচের বক্স থেকে আপনার পছন্দের ফরম্যাট (যেমন: MP3 বা MP4 1080p) সিলেক্ট করে <strong>Download</strong> বাটনে ক্লিক করুন। কনভার্ট হওয়া সম্পন্ন হলে ডাউনলোড শুরু হবে।
              </p>
              
              <div className="w-full h-[280px] rounded-lg bg-zinc-950 overflow-hidden border border-zinc-850 relative">
                <iframe
                  src={`https://loader.to/api/card/?url=https://www.youtube.com/watch?v=${ytId}`}
                  className="w-full h-full border-0"
                  allowFullScreen
                  scrolling="no"
                />
              </div>
            </motion.div>
          )}

          {/* Collapsible Video Description & Stats Box */}
          <div className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-xl text-xs md:text-sm text-zinc-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-zinc-100 font-sans">
              <span>{video.views.toLocaleString()} Views</span>
              <span>•</span>
              <span>{formatDate(video.createdAt)}</span>
            </div>
            
            <p className={isDescExpanded ? 'whitespace-pre-line text-zinc-300' : 'line-clamp-2 text-zinc-400'}>
              {video.description || 'Watch to decrypt destination link.'}
            </p>
            {video.description && video.description.length > 120 && (
              <button 
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="mt-1 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                {isDescExpanded ? 'Show less' : '...more'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Right section: Unlock Controller & Suggested Feed */}
      <div className="w-full lg:max-w-[30%] space-y-6">
        
        {/* LINK UNLOCK BOX */}
        <div className="bg-zinc-900/90 rounded-2xl p-5 border border-zinc-800/80 shadow-xl relative overflow-hidden">
          {/* Subtle design grid overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full filter blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-2 pb-4 border-b border-zinc-800/80 mb-4">
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
              {video.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-200">Decrypt Destination Link</h2>
              <span className="text-[10px] text-zinc-500 font-mono">Status: {video.isLocked ? 'Locked' : 'Unlocked'}</span>
            </div>
          </div>

          {/* Content state */}
          {video.isLocked ? (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                The target link of this video is encrypted on the cloud database. Watch <span className="text-yellow-500 font-bold">{video.requiredAdsCount} ads</span> to decode and claim it.
              </p>

              {/* Visual circles to show progress */}
              <div className="flex items-center justify-center gap-3 py-2">
                {Array.from({ length: video.requiredAdsCount }).map((_, idx) => {
                  const isWatched = idx < video.adsWatched;
                  return (
                    <div 
                      key={idx} 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono border transition-all ${
                        isWatched 
                          ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-500/20' 
                          : 'bg-zinc-850 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>

              <div className="text-center text-[10px] text-zinc-500 font-mono">
                Completed: {video.adsWatched} of {video.requiredAdsCount} ad units
              </div>

              <button
                onClick={onWatchAd}
                disabled={isWatchingAd}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10 hover:from-yellow-400 hover:to-amber-500 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Award className="w-4 h-4" />
                <span>Watch Sponsor Ad ({video.requiredAdsCount - video.adsWatched} Left)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center space-y-1">
                <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">Verification Success</span>
                <p className="text-xs text-zinc-300 font-medium">The secret URL is successfully decrypted!</p>
              </div>

              {/* Decrypted destination url container */}
              <div className="flex items-center gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                <span className="flex-1 text-xs text-zinc-400 font-mono truncate select-all">
                  {video.targetLink || 'Retrieving...'}
                </span>
                
                {video.targetLink ? (
                  <button
                    onClick={handleCopyLink}
                    className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                ) : (
                  <button
                    onClick={onGetLink}
                    className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors animate-spin"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {video.targetLink ? (
                <div className="flex flex-col gap-2">
                  <a
                    href={video.targetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:from-emerald-400 hover:to-green-500 transition-all cursor-pointer"
                  >
                    <span>Visit Destination Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="w-full py-3 bg-gradient-to-r from-zinc-700 to-zinc-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-black/20 hover:from-zinc-600 hover:to-zinc-700 transition-all cursor-pointer"
                  >
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Link (লিংক কপি করুন)'}</span>
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <a
                    href={video.downloadLink || video.targetLink}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer"
                  >
                    <span>Download File (ডাউনলোড অপশন)</span>
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <button
                  onClick={onGetLink}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-all cursor-pointer"
                >
                  <span>Decode Link Payload</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* SUGGESTED FEED (YouTube style) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold tracking-wider text-zinc-500 uppercase font-mono">
            Suggested Stream
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {suggestedVideos.filter(v => v.id !== video.id).slice(0, 5).map((sVideo) => {
              const sYtId = getYouTubeId(sVideo.videoUrl);
              const sDisplayThumb = sVideo.thumbnailUrl || (sYtId ? `https://img.youtube.com/vi/${sYtId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80');
              
              return (
                <div 
                  key={sVideo.id}
                  onClick={() => onSelectVideo(sVideo.id)}
                  className="flex gap-3 bg-zinc-900/20 hover:bg-zinc-900/60 p-2 rounded-xl border border-zinc-850/40 cursor-pointer transition-colors group"
                >
                  {/* Micro thumbnail */}
                  <div className="w-24 h-16 bg-zinc-950 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <img 
                      src={sDisplayThumb} 
                      alt={sVideo.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {sVideo.isLocked ? (
                      <div className="absolute bottom-1 right-1 px-1 bg-black/80 rounded flex items-center text-[8px] text-amber-500 font-bold border border-amber-500/10">
                        <Lock className="w-2 h-2 mr-0.5" /> {sVideo.requiredAdsCount - sVideo.adsWatched}
                      </div>
                    ) : (
                      <div className="absolute bottom-1 right-1 px-1 bg-green-500/90 rounded flex items-center text-[8px] text-white font-bold">
                        <Unlock className="w-2 h-2 mr-0.5" /> Unlocked
                      </div>
                    )}
                  </div>

                  {/* Micro info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-xs font-semibold text-zinc-200 line-clamp-2 leading-tight group-hover:text-white transition-colors">
                      {sVideo.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500 mt-1 font-mono">{sVideo.views} views</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
