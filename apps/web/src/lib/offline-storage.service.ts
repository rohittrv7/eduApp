/**
 * Offline Storage Service — AES-256-GCM encrypted IndexedDB storage
 *
 * Videos are stored as encrypted chunks in IndexedDB — never in the file system,
 * gallery, or Downloads folder. The AES key is derived per-session from the
 * download token and is never persisted to disk.
 *
 * Only active when NEXT_PUBLIC_VIDEO_PROVIDER !== 'youtube'.
 */

const DB_NAME = 'educational-offline-v2';
const DB_VERSION = 1;
const CHUNKS_STORE = 'video-chunks';
const META_STORE = 'video-meta';

export interface OfflineVideoMeta {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  downloadedAt: number;
  enrollmentExpiresAt: string | null; // ISO string or null = no expiry
  sizeBytes: number;
  chunkCount: number;
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'videoId' });
      }
      if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
        // key: `${videoId}:${chunkIndex}`
        db.createObjectStore(CHUNKS_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, store: string, key: IDBValidKey, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbGet<T>(db: IDBDatabase, store: string, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbGetAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(db: IDBDatabase, store: string, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── AES-256-GCM key derivation ───────────────────────────────────────────────

/**
 * Derives an AES-256-GCM key from the download token + videoId.
 * Key is NEVER stored — re-derived on each play session.
 */
async function deriveKey(downloadToken: string, videoId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(downloadToken + videoId),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(videoId), // salt = videoId (public, non-secret)
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ─── Encrypt / Decrypt ────────────────────────────────────────────────────────

async function encryptChunk(key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  // Prepend IV to ciphertext: [12 bytes IV][ciphertext]
  const result = new Uint8Array(12 + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), 12);
  return result.buffer;
}

async function decryptChunk(key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
  const iv = new Uint8Array(data, 0, 12);
  const ciphertext = new Uint8Array(data, 12);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
}

// ─── Expiry check ─────────────────────────────────────────────────────────────

export function isExpired(meta: OfflineVideoMeta): boolean {
  if (!meta.enrollmentExpiresAt) return false;
  return new Date() > new Date(meta.enrollmentExpiresAt);
}

// ─── Public API ───────────────────────────────────────────────────────────────

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks

/**
 * Downloads a video from `videoUrl`, encrypts it in 2MB chunks,
 * and stores everything in IndexedDB.
 *
 * @param downloadToken - The signed token from POST /videos/:id/download-token
 */
export async function downloadAndEncrypt(
  videoId: string,
  videoUrl: string,
  downloadToken: string,
  meta: Omit<OfflineVideoMeta, 'videoId' | 'downloadedAt' | 'sizeBytes' | 'chunkCount'>,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error(`Failed to fetch video: ${response.status}`);

  const totalSize = parseInt(response.headers.get('content-length') ?? '0', 10);
  const reader = response.body!.getReader();
  const key = await deriveKey(downloadToken, videoId);

  const db = await openDB();
  let chunkIndex = 0;
  let totalBytes = 0;
  let buffer = new Uint8Array(0);

  const flushChunk = async (chunk: Uint8Array) => {
    const encrypted = await encryptChunk(key, chunk.buffer as ArrayBuffer);
    await idbPut(db, CHUNKS_STORE, `${videoId}:${chunkIndex}`, encrypted);
    chunkIndex++;
    totalBytes += chunk.byteLength;
    if (totalSize > 0) onProgress?.(Math.round((totalBytes / totalSize) * 100));
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Accumulate into buffer
    const merged = new Uint8Array(buffer.byteLength + value.byteLength);
    merged.set(buffer, 0);
    merged.set(value, buffer.byteLength);
    buffer = merged;

    // Flush complete chunks
    while (buffer.byteLength >= CHUNK_SIZE) {
      await flushChunk(buffer.slice(0, CHUNK_SIZE));
      buffer = buffer.slice(CHUNK_SIZE);
    }
  }

  // Flush remaining bytes
  if (buffer.byteLength > 0) {
    await flushChunk(buffer);
  }

  // Save metadata
  const videoMeta: OfflineVideoMeta = {
    videoId,
    ...meta,
    downloadedAt: Date.now(),
    sizeBytes: totalBytes,
    chunkCount: chunkIndex,
  };
  await idbPut(db, META_STORE, videoId, videoMeta);
  db.close();
}

/**
 * Decrypts all chunks for a video and returns a Blob for playback.
 * Key is re-derived from the token — never stored.
 */
export async function decryptForPlayback(
  videoId: string,
  downloadToken: string,
): Promise<Blob> {
  const db = await openDB();
  const meta = await idbGet<OfflineVideoMeta>(db, META_STORE, videoId);
  if (!meta) throw new Error('Video not found in offline storage');

  // Expiry check — runs even offline
  if (isExpired(meta)) {
    db.close();
    await deleteOfflineVideo(videoId); // auto-delete expired video
    throw new Error('Course access has expired. This video has been removed.');
  }

  const key = await deriveKey(downloadToken, videoId);
  const decryptedChunks: ArrayBuffer[] = [];

  for (let i = 0; i < meta.chunkCount; i++) {
    const encrypted = await idbGet<ArrayBuffer>(db, CHUNKS_STORE, `${videoId}:${i}`);
    if (!encrypted) throw new Error(`Missing chunk ${i} for video ${videoId}`);
    const decrypted = await decryptChunk(key, encrypted);
    decryptedChunks.push(decrypted);
  }

  db.close();
  return new Blob(decryptedChunks, { type: 'video/mp4' });
}

export async function getOfflineVideoMeta(videoId: string): Promise<OfflineVideoMeta | null> {
  const db = await openDB();
  const meta = await idbGet<OfflineVideoMeta>(db, META_STORE, videoId);
  db.close();
  return meta ?? null;
}

export async function getAllOfflineVideos(): Promise<OfflineVideoMeta[]> {
  const db = await openDB();
  const all = await idbGetAll<OfflineVideoMeta>(db, META_STORE);
  db.close();
  return all;
}

export async function isVideoAvailableOffline(videoId: string): Promise<boolean> {
  const meta = await getOfflineVideoMeta(videoId);
  if (!meta) return false;
  if (isExpired(meta)) {
    await deleteOfflineVideo(videoId);
    return false;
  }
  return true;
}

export async function deleteOfflineVideo(videoId: string): Promise<void> {
  const db = await openDB();
  const meta = await idbGet<OfflineVideoMeta>(db, META_STORE, videoId);
  if (meta) {
    for (let i = 0; i < meta.chunkCount; i++) {
      await idbDelete(db, CHUNKS_STORE, `${videoId}:${i}`);
    }
    await idbDelete(db, META_STORE, videoId);
  }
  db.close();
}

export async function getTotalStorageUsed(): Promise<number> {
  const all = await getAllOfflineVideos();
  return all.reduce((sum, m) => sum + m.sizeBytes, 0);
}
