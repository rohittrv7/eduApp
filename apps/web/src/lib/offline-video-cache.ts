const VIDEO_CACHE_NAME = 'offline-videos-v1';
const VIDEO_META_DB = 'educational-offline';
const VIDEO_META_STORE = 'video-metadata';
const DB_VERSION = 1;

export interface OfflineVideoMeta {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  cachedAt: number;
  sizeBytes: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(VIDEO_META_DB, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(VIDEO_META_STORE)) {
        db.createObjectStore(VIDEO_META_STORE, { keyPath: 'videoId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getStorageLimit(): Promise<number> {
  // Default 500MB; Admin-configured limit would come from API/localStorage
  const stored = localStorage.getItem('offline_storage_limit_bytes');
  return stored ? parseInt(stored, 10) : 500 * 1024 * 1024;
}

async function getCurrentUsage(): Promise<number> {
  const db = await openDB();
  const metas = await getAllVideoMeta(db);
  db.close();
  return metas.reduce((sum, m) => sum + m.sizeBytes, 0);
}

function getAllVideoMeta(db: IDBDatabase): Promise<OfflineVideoMeta[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_META_STORE, 'readonly');
    const req = tx.objectStore(VIDEO_META_STORE).getAll();
    req.onsuccess = () => resolve(req.result as OfflineVideoMeta[]);
    req.onerror = () => reject(req.error);
  });
}

export async function downloadVideoForOffline(
  videoId: string,
  videoUrl: string,
  meta: Omit<OfflineVideoMeta, 'videoId' | 'cachedAt' | 'sizeBytes'>
): Promise<void> {
  const limit = await getStorageLimit();
  const usage = await getCurrentUsage();

  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error(`Failed to fetch video: ${response.status}`);

  const blob = await response.blob();
  const sizeBytes = blob.size;

  if (usage + sizeBytes > limit) {
    throw new Error('Offline storage limit reached. Delete some videos to free space.');
  }

  const cache = await caches.open(VIDEO_CACHE_NAME);
  await cache.put(`/offline-video/${videoId}`, new Response(blob, {
    headers: { 'Content-Type': blob.type },
  }));

  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(VIDEO_META_STORE, 'readwrite');
    tx.objectStore(VIDEO_META_STORE).put({
      videoId,
      ...meta,
      cachedAt: Date.now(),
      sizeBytes,
    } satisfies OfflineVideoMeta);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function deleteOfflineVideo(videoId: string): Promise<void> {
  const cache = await caches.open(VIDEO_CACHE_NAME);
  await cache.delete(`/offline-video/${videoId}`);

  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(VIDEO_META_STORE, 'readwrite');
    tx.objectStore(VIDEO_META_STORE).delete(videoId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getOfflineVideos(): Promise<OfflineVideoMeta[]> {
  const db = await openDB();
  const metas = await getAllVideoMeta(db);
  db.close();
  return metas;
}

export async function isVideoAvailableOffline(videoId: string): Promise<boolean> {
  const cache = await caches.open(VIDEO_CACHE_NAME);
  const match = await cache.match(`/offline-video/${videoId}`);
  return !!match;
}

export async function getOfflineVideoBlob(videoId: string): Promise<Blob | null> {
  const cache = await caches.open(VIDEO_CACHE_NAME);
  const response = await cache.match(`/offline-video/${videoId}`);
  if (!response) return null;
  return response.blob();
}
