/**
 * Simple Authentication for Potomac Presenter
 * 
 * This is a basic session-based authentication system.
 * For production, consider using NextAuth.js with proper OAuth providers.
 */

import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Simple user database (stored in SQLite via db.ts)
import db from './db';

// Session duration
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Initialize user table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
`);

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user' | 'viewer';
  created_at: string;
  last_login?: string;
}

export interface Session {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  user?: User;
}

/**
 * Hash a password using SHA-256 with salt
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || randomUUID();
  const hash = crypto
    .createHash('sha256')
    .update(password + actualSalt)
    .digest('hex');
  return { hash, salt: actualSalt };
}

/**
 * Verify a password
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = hashPassword(password, salt);
  return result.hash === hash;
}

/**
 * Create a new user
 */
export function createUser(email: string, password: string, name?: string, role: string = 'user'): User | null {
  try {
    const { hash, salt } = hashPassword(password);
    const id = randomUUID();
    const passwordHash = `${salt}:${hash}`;
    
    const stmt = db.prepare(`
      INSERT INTO users (id, email, name, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, email.toLowerCase(), name || null, passwordHash, role);
    
    return getUserById(id);
  } catch (error) {
    console.error('Failed to create user:', error);
    return null;
  }
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | null {
  const stmt = db.prepare('SELECT id, email, name, role, created_at, last_login FROM users WHERE id = ?');
  const row = stmt.get(id) as any;
  return row || null;
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | null {
  const stmt = db.prepare('SELECT id, email, name, role, created_at, last_login FROM users WHERE email = ?');
  const row = stmt.get(email.toLowerCase()) as any;
  return row || null;
}

/**
 * Authenticate user with email and password
 */
export function authenticateUser(email: string, password: string): { user: User; session: Session } | null {
  const stmt = db.prepare('SELECT id, email, name, password_hash, role, created_at, last_login FROM users WHERE email = ?');
  const row = stmt.get(email.toLowerCase()) as any;
  
  if (!row) return null;
  
  const [salt, hash] = row.password_hash.split(':');
  if (!verifyPassword(password, hash, salt)) return null;
  
  // Update last login
  const updateStmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
  updateStmt.run(row.id);
  
  // Create session
  const session = createSession(row.id);
  
  return {
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      created_at: row.created_at,
      last_login: row.last_login,
    },
    session,
  };
}

/**
 * Create a new session
 */
export function createSession(userId: string): Session {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `);
  
  stmt.run(id, userId, expiresAt);
  
  return {
    id,
    user_id: userId,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
  };
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): Session | null {
  // Clean up expired sessions
  db.prepare('DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP').run();
  
  const stmt = db.prepare(`
    SELECT s.id, s.user_id, s.created_at, s.expires_at,
           u.email, u.name, u.role, u.created_at as user_created_at, u.last_login
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP
  `);
  
  const row = stmt.get(sessionId) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    user_id: row.user_id,
    created_at: row.created_at,
    expires_at: row.expires_at,
    user: {
      id: row.user_id,
      email: row.email,
      name: row.name,
      role: row.role,
      created_at: row.user_created_at,
      last_login: row.last_login,
    },
  };
}

/**
 * Delete session (logout)
 */
export function deleteSession(sessionId: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

/**
 * Get current user from cookies (server-side)
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  
  if (!sessionId) return null;
  
  const session = getSession(sessionId);
  return session?.user || null;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, requiredRole: 'admin' | 'user' | 'viewer'): boolean {
  if (!user) return false;
  
  const roleHierarchy = { admin: 3, user: 2, viewer: 1 };
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Initialize default admin user if none exists
 */
export function initializeDefaultUser(): void {
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
  
  if (!adminExists) {
    // Create default admin
    createUser('admin@potomac.com', 'admin123', 'Admin', 'admin');
    console.log('Created default admin user: admin@potomac.com / admin123');
  }
}

// Run initialization
initializeDefaultUser();

export default {
  createUser,
  getUserById,
  getUserByEmail,
  authenticateUser,
  createSession,
  getSession,
  deleteSession,
  getCurrentUser,
  hasRole,
};