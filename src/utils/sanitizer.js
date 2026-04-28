const url = require('url');
const querystring = require('querystring');

/**
 * Sanitize and normalize a search query string.
 * Strips protocol/host if a full URL is accidentally pasted,
 * and decodes any percent-encoded characters.
 */
function sanitizeSearchQuery(input) {
  if (!input || typeof input !== 'string') return '';

  let cleaned = input.trim();

  // If someone pastes a full URL, extract just the search/query portion
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    const parsed = url.parse(cleaned, true);
    cleaned = parsed.query.q || parsed.query.search || parsed.pathname || '';
  }

  // Decode any percent-encoded characters using querystring
  cleaned = querystring.unescape(cleaned);

  // Strip HTML tags for XSS prevention
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Build a cache-safe query string from filter parameters.
 * Used for generating canonical URLs for API responses.
 */
function buildFilterQueryString(filters) {
  const params = {};

  if (filters.completed !== undefined) {
    params.completed = String(filters.completed);
  }
  if (filters.priority) {
    params.priority = filters.priority;
  }
  if (filters.search) {
    params.search = querystring.escape(filters.search);
  }
  if (filters.tag) {
    params.tag = filters.tag;
  }

  return querystring.stringify(params);
}

/**
 * Parse and validate a URL string, returning its components.
 * Used for validating webhook callback URLs in todo metadata.
 */
function parseUrl(urlString) {
  if (!urlString) return null;

  try {
    const parsed = url.parse(urlString);
    if (!parsed.protocol || !parsed.host) {
      return null;
    }
    return {
      protocol: parsed.protocol,
      host: parsed.host,
      pathname: parsed.pathname || '/',
      query: parsed.query || '',
    };
  } catch {
    return null;
  }
}

module.exports = {
  sanitizeSearchQuery,
  buildFilterQueryString,
  parseUrl,
};
