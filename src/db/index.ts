import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema.js'

const databaseUrl = process.env.DATABASE_URL?.trim() || 'file:data/tontinesats.db'

if (databaseUrl.startsWith('file:')) {
  const filePart = databaseUrl.slice(5).replace(/^\/\/\//, '')
  const dir = path.dirname(filePart)
  if (dir && dir !== '.') {
    mkdirSync(dir, { recursive: true })
  }
}

export const client = createClient({
  url: databaseUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN?.trim() || undefined,
})
export const db = drizzle(client, { schema })

let initialized = false

export async function initDb() {
  if (initialized) return
  const statements = [
    `PRAGMA foreign_keys = ON;`,
    `CREATE TABLE IF NOT EXISTS users (
      npub TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'fr',
      lightning_address TEXT,
      nwc_uri_encrypted TEXT,
      created_at INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS circles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      organizer_npub TEXT NOT NULL REFERENCES users(npub),
      amount_xof INTEGER NOT NULL,
      frequency TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'recruiting',
      invite_code TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
      member_npub TEXT NOT NULL REFERENCES users(npub),
      payout_order INTEGER NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'manual_qr',
      joined_at INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS rounds (
      id TEXT PRIMARY KEY,
      circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
      round_number INTEGER NOT NULL,
      beneficiary_npub TEXT NOT NULL REFERENCES users(npub),
      due_at INTEGER NOT NULL,
      exchange_rate_sats_per_xof REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'open'
    );`,
    `CREATE TABLE IF NOT EXISTS contributions (
      id TEXT PRIMARY KEY,
      round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
      payer_npub TEXT NOT NULL REFERENCES users(npub),
      amount_xof INTEGER NOT NULL,
      amount_sats INTEGER NOT NULL,
      bolt11_invoice TEXT,
      payment_hash TEXT,
      payment_preimage TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      nostr_receipt_event_id TEXT,
      nostr_receipt_json TEXT,
      paid_at INTEGER
    );`,
    `CREATE TABLE IF NOT EXISTS sandbox_secrets (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_circle_member ON memberships(circle_id, member_npub);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_rounds_circle_num ON rounds(circle_id, round_number);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_contributions_round_payer ON contributions(round_id, payer_npub);`,
  ]
  for (const sql of statements) {
    await client.execute(sql)
  }
  initialized = true
}
