/**
 * SQLite database manager for Loti local-first architecture.
 * Opens the database, runs migrations, seeds initial data.
 *
 * On native (iOS): uses @capacitor-community/sqlite
 * On web (dev): falls back to localStorage-backed shim for development
 */

import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'
import { MIGRATION_001, MIGRATION_002 } from './migrations'
import { SEED_FOODS, generateStoreProductInserts } from './seeds'
import { OXXO_SEED_PRODUCTS } from '@/data/oxxoProducts'
import { SEVEN_ELEVEN_SEED_PRODUCTS } from '@/data/sevenElevenProducts'

const DB_NAME = 'loti_db'
const sqlite = new SQLiteConnection(CapacitorSQLite)
let db: SQLiteDBConnection | null = null

export async function initDatabase(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await initNativeDatabase()
  } else {
    await initWebDatabase()
  }
}

async function initNativeDatabase(): Promise<void> {
  db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)
  await db.open()
  await runMigrations()
}

async function initWebDatabase(): Promise<void> {
  // On web, use jeep-sqlite web component if available, otherwise skip SQLite
  // and let hooks fall back to localStorage (existing behavior for dev)
  try {
    // Check if jeep-sqlite is registered
    const jeepEl = document.querySelector('jeep-sqlite')
    if (jeepEl) {
      await sqlite.initWebStore()
      db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)
      await db.open()
      await runMigrations()
    } else {
      console.warn('[Loti DB] No jeep-sqlite element found — running in web fallback mode (localStorage)')
      db = null
    }
  } catch (err) {
    console.warn('[Loti DB] Web SQLite init failed, using localStorage fallback:', err)
    db = null
  }
}

export function getDb(): SQLiteDBConnection | null {
  return db
}

export function isDbAvailable(): boolean {
  return db !== null
}

// ─── Migration runner ─────────────────────────────────────────

async function runMigrations(): Promise<void> {
  if (!db) return

  const version = await getDbVersion()

  if (version < 1) {
    // Run DDL — execute each statement separately for reliability
    await db.execute(MIGRATION_001)

    // Seed foods
    await db.execute(SEED_FOODS)

    // Seed store products from existing TypeScript arrays
    const oxxoInserts = generateStoreProductInserts(OXXO_SEED_PRODUCTS)
    const sevenElevenInserts = generateStoreProductInserts(SEVEN_ELEVEN_SEED_PRODUCTS)

    for (const { statement, values } of [...oxxoInserts, ...sevenElevenInserts]) {
      await db.run(statement, values as any[])
    }

    await setDbVersion(1)
  }

  if (version < 2) {
    await db.execute(MIGRATION_002)
    await setDbVersion(2)
  }
}

async function getDbVersion(): Promise<number> {
  if (!db) return 0
  try {
    const result = await db.query("SELECT value FROM app_meta WHERE key = 'db_version'")
    return result.values?.[0]?.value ? parseInt(result.values[0].value) : 0
  } catch {
    return 0
  }
}

async function setDbVersion(v: number): Promise<void> {
  if (!db) return
  await db.run(
    "INSERT OR REPLACE INTO app_meta (key, value) VALUES ('db_version', ?)",
    [v.toString()],
  )
}
