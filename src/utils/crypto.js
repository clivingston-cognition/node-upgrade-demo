const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = 'todo-app-secret-key-for-tokens!!'; // 32 bytes for aes-256

/**
 * Generate a simple API token for a session.
 * Uses crypto.createCipher for lightweight token generation.
 */
function generateSessionToken(sessionId) {
  const timestamp = Date.now().toString();
  const data = `${sessionId}:${timestamp}`;

  // Use createCipher (simpler API, no IV needed)
  const cipher = crypto.createCipher(ALGORITHM, SECRET_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted;
}

/**
 * Validate and decode a session token.
 */
function validateSessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  try {
    const decipher = crypto.createDecipher(ALGORITHM, SECRET_KEY);
    let decrypted = decipher.update(token, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const [sessionId, timestamp] = decrypted.split(':');
    if (!sessionId || !timestamp) return null;

    // Tokens expire after 24 hours
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    if (tokenAge > 24 * 60 * 60 * 1000) return null;

    return { sessionId, timestamp: parseInt(timestamp, 10) };
  } catch {
    return null;
  }
}

/**
 * Generate a hash for content integrity verification.
 */
function hashContent(content) {
  return crypto
    .createHash('sha256')
    .update(new Buffer(String(content)))
    .digest('hex');
}

module.exports = {
  generateSessionToken,
  validateSessionToken,
  hashContent,
};
