import express from 'express';
import path from 'path';
import fileUpload from 'express-fileupload';
import { createServer as createViteServer } from 'vite';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocFromServer,
  increment
} from 'firebase/firestore';
import { db } from './src/lib/firebase.js';
import { encryptLink, decryptLink } from './src/lib/crypto.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON bodies
  app.use(express.json());

  // File upload middleware with 150MB limit
  app.use(fileUpload({
    limits: { fileSize: 150 * 1024 * 1024 },
    createParentPath: true,
  }));

  // Serve uploads statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // 1. Validate Connection to Firestore on boot (as required by Firebase skill)
  async function testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log('Firebase connection validated successfully.');
    } catch (error) {
      console.warn("Firebase connection check failed. Please verify firebase configuration:", error);
    }
  }
  await testConnection();

  // --- API ROUTES START ---

  // Admin middleware verification helper
  const verifyAdmin = (password: string | undefined): boolean => {
    return password === 'Rashal117';
  };

  // GET: Get all videos with unlocking progress for a given user
  app.get('/api/videos', async (req, res) => {
    try {
      const { userId } = req.query;
      
      // Fetch all videos
      const videosSnapshot = await getDocs(collection(db, 'videos'));
      const videosList: any[] = [];
      videosSnapshot.forEach((doc) => {
        const data = doc.data();
        videosList.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          thumbnailUrl: data.thumbnailUrl || '',
          videoUrl: data.videoUrl || '',
          requiredAdsCount: data.requiredAdsCount || 3,
          views: data.views || 0,
          category: data.category || 'Other',
          createdAt: data.createdAt || new Date().toISOString()
        });
      });

      // Sort videos by creation date descending
      videosList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // If user ID is provided, fetch their unlock progress
      if (userId && typeof userId === 'string') {
        const unlocksQuery = query(collection(db, 'unlocks'), where('userId', '==', userId));
        const unlocksSnapshot = await getDocs(unlocksQuery);
        const unlocksMap: Record<string, any> = {};
        
        unlocksSnapshot.forEach((doc) => {
          const data = doc.data();
          unlocksMap[data.videoId] = {
            id: doc.id,
            adsWatched: data.adsWatched || 0,
            unlocked: data.unlocked || false,
            unlockedAt: data.unlockedAt || null
          };
        });

        // 4 Hours constant in milliseconds
        const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

        // Enrich video data with user-specific unlock progress
        const enrichedVideos = videosList.map((video) => {
          const progress = unlocksMap[video.id];
          let isUnlocked = progress ? progress.unlocked : false;
          let adsWatched = progress ? progress.adsWatched : 0;
          const unlockedAt = progress ? progress.unlockedAt : null;

          // Check if unlock has expired
          if (isUnlocked && unlockedAt) {
            const elapsed = Date.now() - new Date(unlockedAt).getTime();
            if (elapsed > FOUR_HOURS_MS) {
              isUnlocked = false;
              adsWatched = 0;
            }
          }
          
          // Re-fetch encrypted link from Firestore snapshot if unlocked to decrypt it
          let decryptedLink = '';
          let decryptedDownloadLink = '';
          let decryptedCopyLink = '';
          if (isUnlocked) {
            const videoDoc = videosSnapshot.docs.find(d => d.id === video.id);
            if (videoDoc) {
              const vData = videoDoc.data();
              decryptedLink = decryptLink(vData.encryptedTargetLink || '');
              decryptedDownloadLink = vData.encryptedDownloadLink ? decryptLink(vData.encryptedDownloadLink) : '';
              decryptedCopyLink = vData.encryptedCopyLink ? decryptLink(vData.encryptedCopyLink) : '';
            }
          }

          return {
            ...video,
            isLocked: !isUnlocked,
            adsWatched,
            targetLink: decryptedLink,
            downloadLink: decryptedDownloadLink,
            copyLink: decryptedCopyLink
          };
        });

        res.json({ success: true, videos: enrichedVideos });
      } else {
        // No userId provided, everything is locked and no target links returned
        const lockedVideos = videosList.map((video) => ({
          ...video,
          isLocked: true,
          adsWatched: 0,
          targetLink: '',
          downloadLink: '',
          copyLink: ''
        }));
        res.json({ success: true, videos: lockedVideos });
      }
    } catch (error: any) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET: Get a single video's details & progress
  app.get('/api/videos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      const videoDoc = await getDoc(doc(db, 'videos', id));
      if (!videoDoc.exists()) {
        res.status(404).json({ success: false, error: 'Video not found' });
        return;
      }

      const videoData = videoDoc.data();
      const video = {
        id: videoDoc.id,
        title: videoData.title || '',
        description: videoData.description || '',
        thumbnailUrl: videoData.thumbnailUrl || '',
        videoUrl: videoData.videoUrl || '',
        requiredAdsCount: videoData.requiredAdsCount || 3,
        views: videoData.views || 0,
        category: videoData.category || 'Other',
        createdAt: videoData.createdAt || new Date().toISOString()
      };

      let adsWatched = 0;
      let isUnlocked = false;
      let decryptedLink = '';
      let decryptedDownloadLink = '';
      let decryptedCopyLink = '';

      if (userId && typeof userId === 'string') {
        const progressQuery = query(
          collection(db, 'unlocks'), 
          where('userId', '==', userId), 
          where('videoId', '==', id)
        );
        const progressSnapshot = await getDocs(progressQuery);
        
        if (!progressSnapshot.empty) {
          const progressData = progressSnapshot.docs[0].data();
          adsWatched = progressData.adsWatched || 0;
          isUnlocked = progressData.unlocked || false;
          const unlockedAt = progressData.unlockedAt || null;

          // Check if unlock has expired
          const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
          if (isUnlocked && unlockedAt) {
            const elapsed = Date.now() - new Date(unlockedAt).getTime();
            if (elapsed > FOUR_HOURS_MS) {
              isUnlocked = false;
              adsWatched = 0;
            }
          }

          if (isUnlocked) {
            decryptedLink = decryptLink(videoData.encryptedTargetLink || '');
            decryptedDownloadLink = videoData.encryptedDownloadLink ? decryptLink(videoData.encryptedDownloadLink) : '';
            decryptedCopyLink = videoData.encryptedCopyLink ? decryptLink(videoData.encryptedCopyLink) : '';
          }
        }
      }

      res.json({
        success: true,
        video: {
          ...video,
          isLocked: !isUnlocked,
          adsWatched,
          targetLink: decryptedLink,
          downloadLink: decryptedDownloadLink,
          copyLink: decryptedCopyLink
        }
      });
    } catch (error: any) {
      console.error('Error fetching video details:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST: Record an ad watch and update progress
  app.post('/api/watch-ad', async (req, res) => {
    try {
      const { userId, videoId } = req.body;

      if (!userId || !videoId) {
        res.status(400).json({ success: false, error: 'userId and videoId are required' });
        return;
      }

      // Fetch the target video to get its requiredAdsCount
      const videoDoc = await getDoc(doc(db, 'videos', videoId));
      if (!videoDoc.exists()) {
        res.status(404).json({ success: false, error: 'Video not found' });
        return;
      }

      const videoData = videoDoc.data();
      const requiredAds = videoData.requiredAdsCount || 3;

      // Query if progress document already exists
      const progressQuery = query(
        collection(db, 'unlocks'), 
        where('userId', '==', userId), 
        where('videoId', '==', videoId)
      );
      const progressSnapshot = await getDocs(progressQuery);

      let adsWatched = 0;
      let isUnlocked = false;
      let progressDocId = '';
      let unlockedAt: string | null = null;

      const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

      if (progressSnapshot.empty) {
        // Create new progress record
        adsWatched = 1;
        isUnlocked = adsWatched >= requiredAds;
        unlockedAt = isUnlocked ? new Date().toISOString() : null;
        
        const newDoc = await addDoc(collection(db, 'unlocks'), {
          userId,
          videoId,
          adsWatched,
          unlocked: isUnlocked,
          unlockedAt,
          updatedAt: new Date().toISOString()
        });
        progressDocId = newDoc.id;
      } else {
        // Update existing record
        const docRef = progressSnapshot.docs[0];
        progressDocId = docRef.id;
        const currentData = docRef.data();
        
        const currentAdsWatched = currentData.adsWatched || 0;
        const wasUnlocked = currentData.unlocked || false;
        const currentUnlockedAt = currentData.unlockedAt || null;

        // Check if the previous unlock has expired
        const isExpired = wasUnlocked && currentUnlockedAt && (Date.now() - new Date(currentUnlockedAt).getTime() > FOUR_HOURS_MS);

        if (isExpired) {
          // Reset progress and start fresh from 1 watched ad
          adsWatched = 1;
          isUnlocked = adsWatched >= requiredAds;
          unlockedAt = isUnlocked ? new Date().toISOString() : null;
        } else {
          adsWatched = currentAdsWatched + 1;
          if (adsWatched > requiredAds) {
            adsWatched = requiredAds;
          }
          isUnlocked = adsWatched >= requiredAds;
          if (isUnlocked) {
            // Keep existing unlockedAt or set a new one if it was locked
            unlockedAt = currentUnlockedAt || new Date().toISOString();
          } else {
            unlockedAt = null;
          }
        }

        await updateDoc(doc(db, 'unlocks', progressDocId), {
          adsWatched,
          unlocked: isUnlocked,
          unlockedAt,
          updatedAt: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        adsWatched,
        requiredAdsCount: requiredAds,
        unlocked: isUnlocked
      });
    } catch (error: any) {
      console.error('Error tracking ad watch:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST: Retrieve and decrypt target link (verifies ad requirement met)
  app.post('/api/get-link', async (req, res) => {
    try {
      const { userId, videoId } = req.body;

      if (!userId || !videoId) {
        res.status(400).json({ success: false, error: 'userId and videoId are required' });
        return;
      }

      // Verify progress in DB
      const progressQuery = query(
        collection(db, 'unlocks'), 
        where('userId', '==', userId), 
        where('videoId', '==', videoId)
      );
      const progressSnapshot = await getDocs(progressQuery);

      if (progressSnapshot.empty) {
        res.status(403).json({ success: false, error: 'Link is locked. Please watch all required ads first.' });
        return;
      }

      const progressData = progressSnapshot.docs[0].data();
      let isUnlocked = progressData.unlocked || false;
      const unlockedAt = progressData.unlockedAt || null;

      // Check if unlock has expired
      const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
      if (isUnlocked && unlockedAt) {
        const elapsed = Date.now() - new Date(unlockedAt).getTime();
        if (elapsed > FOUR_HOURS_MS) {
          isUnlocked = false;
        }
      }

      if (!isUnlocked) {
        res.status(403).json({ success: false, error: 'Unlock has expired (৪ ঘণ্টা পার হয়ে গেছে). Please watch ads again.' });
        return;
      }

      // Fetch the video to decrypt
      const videoDoc = await getDoc(doc(db, 'videos', videoId));
      if (!videoDoc.exists()) {
        res.status(404).json({ success: false, error: 'Video not found' });
        return;
      }

      const videoData = videoDoc.data();
      const decryptedLink = decryptLink(videoData.encryptedTargetLink || '');
      const decryptedDownloadLink = videoData.encryptedDownloadLink ? decryptLink(videoData.encryptedDownloadLink) : '';
      const decryptedCopyLink = videoData.encryptedCopyLink ? decryptLink(videoData.encryptedCopyLink) : '';

      // Increment video views
      await updateDoc(doc(db, 'videos', videoId), {
        views: increment(1)
      });

      res.json({
        success: true,
        targetLink: decryptedLink,
        downloadLink: decryptedDownloadLink,
        copyLink: decryptedCopyLink
      });
    } catch (error: any) {
      console.error('Error delivering unlocked link:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // --- ADMIN API ROUTES ---

  // POST: Verify admin password
  app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    if (verifyAdmin(password)) {
      res.json({ success: true, message: 'Authenticated successfully' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  });

  // POST: Upload a file (video or thumbnail)
  app.post('/api/admin/upload', (req, res) => {
    try {
      const { password } = req.query;
      if (!password || !verifyAdmin(password as string)) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).json({ success: false, error: 'No files were uploaded.' });
        return;
      }

      const file = req.files.file;
      if (Array.isArray(file)) {
        res.status(400).json({ success: false, error: 'Please upload only one file at a time.' });
        return;
      }

      const fileExt = path.extname(file.name);
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}${fileExt}`;
      const uploadPath = path.join(process.cwd(), 'uploads', uniqueName);

      file.mv(uploadPath, (err) => {
        if (err) {
          console.error('File save error:', err);
          return res.status(500).json({ success: false, error: 'Failed to save uploaded file.' });
        }

        res.json({
          success: true,
          url: `/uploads/${uniqueName}`
        });
      });
    } catch (e: any) {
      console.error('Upload exception:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // POST: Create a new video with database encryption
  app.post('/api/admin/videos', async (req, res) => {
    try {
      const { 
        password, 
        title, 
        description, 
        thumbnailUrl, 
        videoUrl, 
        targetLink, 
        downloadLink,
        copyLink,
        requiredAdsCount, 
        category 
      } = req.body;

      if (!verifyAdmin(password)) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (!title || !thumbnailUrl || !targetLink) {
        res.status(400).json({ success: false, error: 'Title, Thumbnail, and Target Link are required.' });
        return;
      }

      // Encrypt the target link before database storage
      const encryptedLink = encryptLink(targetLink);
      const encryptedDownloadLink = downloadLink ? encryptLink(downloadLink) : '';
      const encryptedCopyLink = copyLink ? encryptLink(copyLink) : '';

      const videoDoc = await addDoc(collection(db, 'videos'), {
        title,
        description: description || '',
        thumbnailUrl,
        videoUrl: videoUrl || '',
        encryptedTargetLink: encryptedLink,
        encryptedDownloadLink,
        encryptedCopyLink,
        requiredAdsCount: Number(requiredAdsCount) || 3,
        views: 0,
        category: category || 'Other',
        createdAt: new Date().toISOString()
      });

      res.json({ success: true, id: videoDoc.id, message: 'Video added with secure link encryption' });
    } catch (error: any) {
      console.error('Error adding video:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT: Update video
  app.put('/api/admin/videos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        password, 
        title, 
        description, 
        thumbnailUrl, 
        videoUrl, 
        targetLink, 
        downloadLink,
        copyLink,
        requiredAdsCount, 
        category 
      } = req.body;

      if (!verifyAdmin(password)) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const videoDocRef = doc(db, 'videos', id);
      const videoDocSnapshot = await getDoc(videoDocRef);
      if (!videoDocSnapshot.exists()) {
        res.status(404).json({ success: false, error: 'Video not found' });
        return;
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
      if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
      if (requiredAdsCount !== undefined) updateData.requiredAdsCount = Number(requiredAdsCount);
      if (category !== undefined) updateData.category = category;

      // Encrypt target link if updated
      if (targetLink !== undefined && targetLink !== '') {
        updateData.encryptedTargetLink = encryptLink(targetLink);
      }
      if (downloadLink !== undefined) {
        updateData.encryptedDownloadLink = downloadLink ? encryptLink(downloadLink) : '';
      }
      if (copyLink !== undefined) {
        updateData.encryptedCopyLink = copyLink ? encryptLink(copyLink) : '';
      }

      await updateDoc(videoDocRef, updateData);

      res.json({ success: true, message: 'Video updated successfully' });
    } catch (error: any) {
      console.error('Error updating video:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // DELETE: Delete video
  app.delete('/api/admin/videos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body; // Sent in body for safety

      if (!verifyAdmin(password)) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await deleteDoc(doc(db, 'videos', id));

      res.json({ success: true, message: 'Video deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting video:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST: Admin panel statistics
  app.post('/api/admin/stats', async (req, res) => {
    try {
      const { password } = req.body;

      if (!verifyAdmin(password)) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const videosSnapshot = await getDocs(collection(db, 'videos'));
      const unlocksSnapshot = await getDocs(collection(db, 'unlocks'));

      const totalVideos = videosSnapshot.size;
      
      let totalAdViews = 0;
      let totalUnlocks = 0;
      unlocksSnapshot.forEach((doc) => {
        const data = doc.data();
        totalAdViews += data.adsWatched || 0;
        if (data.unlocked) {
          totalUnlocks += 1;
        }
      });

      let totalVideoViews = 0;
      videosSnapshot.forEach((doc) => {
        const data = doc.data();
        totalVideoViews += data.views || 0;
      });

      res.json({
        success: true,
        stats: {
          totalVideos,
          totalAdViews,
          totalUnlocks,
          totalVideoViews
        }
      });
    } catch (error: any) {
      console.error('Error gathering stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // --- API ROUTES END ---

  // Vite development vs production asset handling
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
