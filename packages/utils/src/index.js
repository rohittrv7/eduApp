"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.slugify = slugify;
exports.isValidMobile = isValidMobile;
exports.isValidYouTubeUrl = isValidYouTubeUrl;
exports.calcWatchProgress = calcWatchProgress;
/**
 * Format a number as Indian Rupees
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}
/**
 * Slugify a string for use in URLs
 */
function slugify(text) {
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
function isValidMobile(mobile) {
    return /^[6-9]\d{9}$/.test(mobile);
}
/**
 * Validate a YouTube video URL
 */
function isValidYouTubeUrl(url) {
    return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/.test(url);
}
/**
 * Calculate watch progress percentage
 */
function calcWatchProgress(watchTimeSecs, durationSecs) {
    if (durationSecs <= 0)
        return 0;
    return Math.min(100, Math.round((watchTimeSecs / durationSecs) * 100));
}
//# sourceMappingURL=index.js.map