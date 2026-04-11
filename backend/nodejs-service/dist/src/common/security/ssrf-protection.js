"use strict";
/**
 * SSRF (Server-Side Request Forgery) Protection
 * Validates URLs before making external requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPrivateHostname = isPrivateHostname;
exports.validateUrl = validateUrl;
exports.safeFetch = safeFetch;
exports.validateServiceUrl = validateServiceUrl;
const url_1 = require("url");
const DEFAULT_OPTIONS = {
    blockPrivateIPs: true,
    blockLocalhost: true,
    timeout: 5000,
    allowedOrigins: []
};
/**
 * Patterns for private/internal IP ranges
 */
const PRIVATE_IP_PATTERNS = [
    /^localhost$/i,
    /^127\.0\.0\.1$/,
    /^127\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/,
    /^::1$/,
    /^::ffff:127\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/,
    /^192\.168\./,
    /^10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^169\.254\./, // Link-local
    /^fc00:/, // IPv6 private
    /^fe80:/ // IPv6 link-local
];
/**
 * Check if hostname is private/internal
 */
function isPrivateHostname(hostname) {
    return PRIVATE_IP_PATTERNS.some(pattern => pattern.test(hostname));
}
/**
 * Validate URL for SSRF safety
 * @throws Error if URL is not safe
 * @returns Validated URL object
 */
function validateUrl(urlString, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    if (!urlString || typeof urlString !== 'string') {
        throw new Error('URL must be a non-empty string');
    }
    let parsed;
    try {
        parsed = new url_1.URL(urlString);
    }
    catch (error) {
        throw new Error(`Invalid URL format: ${urlString}`);
    }
    // Validate hostname
    const hostname = parsed.hostname;
    if (!hostname) {
        throw new Error('URL must contain valid hostname');
    }
    // Block private IP addresses
    if (opts.blockPrivateIPs && isPrivateHostname(hostname)) {
        throw new Error(`Access to private network denied: ${hostname}`);
    }
    // Block localhost
    if (opts.blockLocalhost && /^localhost$/i.test(hostname)) {
        throw new Error('Access to localhost denied');
    }
    // Validate against whitelist
    if (opts.allowedOrigins && opts.allowedOrigins.length > 0) {
        const allowed = opts.allowedOrigins.some(origin => {
            try {
                const allowedUrl = new url_1.URL(origin);
                return parsed.origin === allowedUrl.origin;
            }
            catch {
                return false;
            }
        });
        if (!allowed) {
            throw new Error(`URL not in allowed origins: ${parsed.origin}`);
        }
    }
    // Validate protocol (only http/https)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }
    return parsed;
}
/**
 * Safe fetch wrapper with SSRF protection
 */
async function safeFetch(urlString, options = {}) {
    const { ssrf, ...fetchOptions } = options;
    // Validate URL first
    const validatedUrl = validateUrl(urlString, ssrf);
    // Create abort controller with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ssrf?.timeout || DEFAULT_OPTIONS.timeout);
    try {
        const response = await fetch(validatedUrl.toString(), {
            ...fetchOptions,
            signal: controller.signal,
            // Disable redirect to prevent SSRF via redirects
            redirect: 'error'
        });
        return response;
    }
    finally {
        clearTimeout(timeout);
    }
}
/**
 * Validate service URL for internal service communication
 */
function validateServiceUrl(urlString, allowedServiceUrls) {
    const validated = validateUrl(urlString, {
        blockPrivateIPs: false, // Allow private IPs for internal services
        allowedOrigins: allowedServiceUrls
    });
    return validated;
}
