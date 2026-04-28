const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = 'todo-app-secret-key-for-tokens!!'; // 32 bytes for aes-256
const KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);

/**
 * Generate a simple API token for a session.
 * Uses crypto.createCipheriv with a random IV for secure token generation.
 */
function generateSessionToken(sessionId) {
  const timestamp = Date.now().toString();
  const data = `${sessionId}:${timestamp}`;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Validate and decode a session token.
 */
function validateSessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  try {
    const separatorIndex = token.indexOf(':');
    if (separatorIndex === -1) return null;

    const ivHex = token.substring(0, separatorIndex);
    const encryptedData = token.substring(separatorIndex + 1);

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
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
    .update(Buffer.from(String(content)))
    .digest('hex');
}

module.exports = {
  generateSessionToken,
  validateSessionToken,
  hashContent,
};
