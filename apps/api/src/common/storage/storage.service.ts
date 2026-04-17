/**
 * StorageService — provider-agnostic file storage abstraction
 *
 * SCOPE: Images and PDFs ONLY (profile photos, thumbnails, study material PDFs, doubt images).
 * Videos are NEVER uploaded here — they go to YouTube Unlisted via the teacher's YouTube account.
 *
 * Switch provider: set STORAGE_PROVIDER=imagekit | cloudinary in .env
 *
 * IMPORTANT: DB always stores only the file PATH (e.g. "/profiles/abc.jpg"),
 * never the full URL. Call getUrl(path) at runtime to build the full URL.
 * Switching providers = change STORAGE_PROVIDER in env, zero DB migration.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from '@imagekit/nodejs';

export interface UploadResult {
  /** Relative path stored in DB — e.g. "/profiles/user-123.jpg" */
  path: string;
  /** Full CDN URL for immediate use in response */
  url: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: string;
  private imagekit?: ImageKit;
  private readonly imagekitEndpoint: string;

  constructor(private readonly config: ConfigService) {
    this.provider = this.config.get<string>('storage.provider') ?? 'imagekit';
    this.imagekitEndpoint = this.config.get<string>('storage.imagekit.urlEndpoint') ?? '';

    if (this.provider === 'imagekit') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.imagekit = new (ImageKit as any)({
        publicKey: this.config.get<string>('storage.imagekit.publicKey') ?? '',
        privateKey: this.config.get<string>('storage.imagekit.privateKey') ?? '',
        urlEndpoint: this.imagekitEndpoint,
      });
    }
    // Cloudinary client init goes here when switching — same interface
  }

  /**
   * Upload a file buffer. Returns path (for DB) and url (for response).
   */
  async upload(buffer: Buffer, fileName: string, folder: string): Promise<UploadResult> {
    if (this.provider === 'imagekit') {
      return this.uploadImageKit(buffer, fileName, folder);
    }
    // Future: return this.uploadCloudinary(buffer, fileName, folder);
    throw new Error(`Unsupported storage provider: ${this.provider}`);
  }

  /**
   * Build full CDN URL from a stored path.
   * This is the ONLY place where path → URL conversion happens.
   */
  getUrl(path: string): string {
    if (!path) return '';
    if (this.provider === 'imagekit') {
      const base = this.imagekitEndpoint.replace(/\/$/, '');
      const filePath = path.startsWith('/') ? path : `/${path}`;
      return `${base}${filePath}`;
    }
    // Future Cloudinary: `https://res.cloudinary.com/${cloudName}/image/upload${path}`
    return path;
  }

  /**
   * Generate a signed URL for protected files (PDFs, study materials).
   * Accepts either a full CDN URL or a relative path.
   * @param pathOrUrl stored file_url from DB (full URL or path)
   * @param expireSeconds TTL in seconds (default: 1800 = 30 min)
   */
  getSignedUrl(pathOrUrl: string, expireSeconds = 1800): string {
    if (this.provider === 'imagekit' && this.imagekit) {
      // Extract relative path if a full URL was passed
      let filePath = pathOrUrl;
      if (pathOrUrl.startsWith('http')) {
        try {
          const parsed = new URL(pathOrUrl);
          filePath = parsed.pathname; // e.g. "/study-materials/teacher-id/file.pdf"
        } catch {
          filePath = pathOrUrl;
        }
      }
      // If it's a data URL (dev fallback), return as-is — can't sign it
      if (pathOrUrl.startsWith('data:')) return pathOrUrl;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.imagekit as any).url({ path: filePath, signed: true, expireSeconds });
    }
    return this.getUrl(pathOrUrl);
  }

  getThumbnailUrl(path: string, width: number, height: number): string {
    if (this.provider === 'imagekit' && this.imagekit) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.imagekit as any).url({
        path,
        transformation: [{ width, height, crop: 'maintain_ratio' }],
      });
    }
    return this.getUrl(path);
  }

  // ─── Private: ImageKit ────────────────────────────────────────────────────

  private async uploadImageKit(
    buffer: Buffer,
    fileName: string,
    folder: string,
  ): Promise<UploadResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (this.imagekit as any).upload({
      file: buffer,
      fileName,
      folder,
      useUniqueFileName: true,
    });
    return { path: result.filePath, url: this.getUrl(result.filePath) };
  }

  // ─── Future: Cloudinary ───────────────────────────────────────────────────
  // private async uploadCloudinary(buffer, fileName, folder): Promise<UploadResult> {
  //   const result = await cloudinary.uploader.upload_stream({ folder }, ...);
  //   // Store result.public_id as path — getUrl() builds the full URL
  //   return { path: result.public_id, url: result.secure_url };
  // }
}
