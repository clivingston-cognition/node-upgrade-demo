const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

let db = null;

function getDbPath() {
  if (process.env.NODE_ENV === 'test') {
    return config.db.testPath;
  }
  return config.db.path;
}

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getConnection() {
  if (db) return db;

  const dbPath = getDbPath();
  ensureDirectoryExists(dbPath);

  db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
  });

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  return db;
}

function closeConnection() {
  if (db) {
    db.close();
    db = null;
  }
}

function resetConnection() {
  closeConnection();
  return getConnection();
}

module.exports = {
  getConnection,
  closeConnection,
  resetConnection,
  getDbPath,
};
