/**
 * Format a number as Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Slugify a string for use in URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate an Indian mobile number (10 digits, starts with 6-9)
 */
export function isValidMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile);
}

/**
 * Validate a YouTube video URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|live\/|embed\/)|youtu\.be\/)[\w-]+/.test(url);
}

/**
 * Calculate watch progress percentage
 */
export function calcWatchProgress(watchTimeSecs: number, durationSecs: number): number {
  if (durationSecs <= 0) return 0;
  return Math.min(100, Math.round((watchTimeSecs / durationSecs) * 100));
}
