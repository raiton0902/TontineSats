import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  npub: text('npub').primaryKey(),
  displayName: text('display_name').notNull(),
  locale: text('locale').notNull().default('fr'),
  lightningAddress: text('lightning_address'),
  nwcUriEncrypted: text('nwc_uri_encrypted'),
  createdAt: integer('created_at').notNull(),
})

export const circles = sqliteTable('circles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  organizerNpub: text('organizer_npub')
    .notNull()
    .references(() => users.npub),
  amountXof: integer('amount_xof').notNull(),
  frequency: text('frequency').notNull(), // 'weekly' | 'monthly' | 'demo_5min'
  status: text('status').notNull().default('recruiting'), // 'recruiting' | 'active' | 'completed'
  inviteCode: text('invite_code').notNull().unique(),
  createdAt: integer('created_at').notNull(),
})

export const memberships = sqliteTable('memberships', {
  id: text('id').primaryKey(),
  circleId: text('circle_id')
    .notNull()
    .references(() => circles.id, { onDelete: 'cascade' }),
  memberNpub: text('member_npub')
    .notNull()
    .references(() => users.npub),
  payoutOrder: integer('payout_order').notNull(),
  paymentMethod: text('payment_method').notNull().default('manual_qr'), // 'nwc_auto' | 'manual_qr'
  joinedAt: integer('joined_at').notNull(),
})

export const rounds = sqliteTable('rounds', {
  id: text('id').primaryKey(),
  circleId: text('circle_id')
    .notNull()
    .references(() => circles.id, { onDelete: 'cascade' }),
  roundNumber: integer('round_number').notNull(),
  beneficiaryNpub: text('beneficiary_npub')
    .notNull()
    .references(() => users.npub),
  dueAt: integer('due_at').notNull(),
  exchangeRateSatsPerXof: real('exchange_rate_sats_per_xof').notNull(),
  status: text('status').notNull().default('open'), // 'open' | 'settling' | 'completed' | 'overdue'
})

export const contributions = sqliteTable('contributions', {
  id: text('id').primaryKey(),
  roundId: text('round_id')
    .notNull()
    .references(() => rounds.id, { onDelete: 'cascade' }),
  payerNpub: text('payer_npub')
    .notNull()
    .references(() => users.npub),
  amountXof: integer('amount_xof').notNull(),
  amountSats: integer('amount_sats').notNull(),
  bolt11Invoice: text('bolt11_invoice'),
  paymentHash: text('payment_hash'),
  paymentPreimage: text('payment_preimage'),
  status: text('status').notNull().default('pending'), // 'pending' | 'invoiced' | 'paid' | 'late'
  nostrReceiptEventId: text('nostr_receipt_event_id'),
  nostrReceiptJson: text('nostr_receipt_json'),
  paidAt: integer('paid_at'),
})

export const sandboxSecrets = sqliteTable('sandbox_secrets', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})
