export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string; // YouTube embed or watch URL
  encryptedTargetLink: string;
  encryptedDownloadLink?: string;
  encryptedCopyLink?: string;
  requiredAdsCount: number; // e.g., 3
  views: number;
  category: string;
  createdAt: string;
  targetLink?: string;
  downloadLink?: string;
  copyLink?: string;
}

export interface UnlockProgress {
  id?: string;
  userId: string;
  videoId: string;
  adsWatched: number;
  unlocked: boolean;
  updatedAt: string;
}

export interface TelegramUser {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}
