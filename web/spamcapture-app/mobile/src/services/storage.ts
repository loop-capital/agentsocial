/**
 * Storage Service
 * Handle local storage for offline capabilities
 */

import * as SQLite from 'expo-sqlite';

interface LocalReport {
  id: string;
  phoneNumber: string;
  callerId?: string;
  type: 'sms' | 'call';
  content?: string;
  category?: string;
  timestamp: string;
  synced: boolean;
  createdAt: number;
}

class StorageService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('spamcapture.db');
      
      await this.db.execAsync(`
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS local_reports (
          id TEXT PRIMARY KEY,
          phoneNumber TEXT NOT NULL,
          callerId TEXT,
          type TEXT NOT NULL CHECK(type IN ('sms', 'call')),
          content TEXT,
          category TEXT,
          timestamp TEXT NOT NULL,
          synced BOOLEAN DEFAULT 0,
          createdAt INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_local_reports_synced ON local_reports(synced);
        CREATE INDEX IF NOT EXISTS idx_local_reports_timestamp ON local_reports(timestamp DESC);
      `);
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  async saveOfflineReport(report: Omit<LocalReport, 'id' | 'synced' | 'createdAt'>): Promise<string> {
    if (!this.db) await this.init();
    
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    await this.db.runAsync(
      `INSERT INTO local_reports (id, phoneNumber, callerId, type, content, category, timestamp, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        report.phoneNumber,
        report.callerId || null,
        report.type,
        report.content || null,
        report.category || null,
        report.timestamp,
        now,
      ]
    );
    
    return id;
  }

  async getUnsyncedReports(): Promise<LocalReport[]> {
    if (!this.db) await this.init();
    
    const rows = await this.db.getAllAsync(
      `SELECT * FROM local_reports WHERE synced = 0 ORDER BY createdAt ASC`
    );
    
    return rows.map((row) => ({
      id: row.id as string,
      phoneNumber: row.phoneNumber as string,
      callerId: row.callerId as string | undefined,
      type: row.type as 'sms' | 'call',
      content: row.content as string | undefined,
      category: row.category as string | undefined,
      timestamp: row.timestamp as string,
      synced: !!row.synced,
      createdAt: row.createdAt as number,
    }));
  }

  async markAsSynced(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    await this.db.runAsync(
      `UPDATE local_reports SET synced = 1 WHERE id = ?`,
      [id]
    );
  }

  async clearSyncedReports(): Promise<void> {
    if (!this.db) await this.init();
    
    await this.db.runAsync(
      `DELETE FROM local_reports WHERE synced = 1`
    );
  }
}

export const storageService = new StorageService();
