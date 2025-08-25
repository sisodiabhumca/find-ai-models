 import fs from 'fs';
 import path from 'path';
 import { fileURLToPath } from 'url';
 import { Low } from 'lowdb';
 import { JSONFile } from 'lowdb/node';

 const __filename = fileURLToPath(import.meta.url);
 const __dirname = path.dirname(__filename);

 const dataDir = path.join(__dirname, '..', 'data');
 const dbPath = path.join(dataDir, 'db.json');
 if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

 let db;

 export async function initDb() {
   if (db) return db;
   const adapter = new JSONFile(dbPath);
   db = new Low(adapter, { models: [], bookmarks: [] });
   await db.read();
   db.data ||= { models: [], bookmarks: [] };
   await db.write();
   return db;
 }

 export function getDb() {
   if (!db) throw new Error('DB not initialized. Call initDb() first.');
   return db;
 }
