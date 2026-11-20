import type { Event } from 'nostr-tools/pure'
import type { PortableReceiptSummary } from './nostr'

export type Locale = 'fr' | 'en' | 'wo'
export type PersonaId = 'awa' | 'moussa' | 'fatou'
export type MemberStatus = 'paid' | 'current' | 'waiting' | 'late'
export type ThemeChoice = 'light' | 'dark' | 'system'
export type Frequency = 'weekly' | 'monthly' | 'demo_5min'

export interface Member {
  order: number
  name: string
  initials: string
  status: MemberStatus
  npub: string
  round: number
  contributionId?: string
  receiptRef?: string
}

export interface LegalConsent {
  terms: string
  privacy: string
  acceptedAt: number
  locale: Locale
}

export interface Session {
  mode: 'keys' | 'demo'
  npub: string
  nsec?: string
  mnemonic?: string
  name: string
  locale: Locale
  lightningAddress?: string
  nwc?: string
  legalConsent?: LegalConsent
  createdAt: number
}

export interface Settings {
  theme: ThemeChoice
  reduceMotion: boolean
  demoMode: boolean
  locale: Locale
}

export interface DemoState {
  persona: PersonaId
  paid: boolean
  joined: boolean
  confirmed: number
  calendar: { year: number; month: number; day: number | null }
  receiptRound: number
}

export interface Persona {
  id: PersonaId
  name: string
  initials: string
  city: string
  role: string
  method: 'nwc' | 'qr'
  currency: 'xof' | 'eur'
  stats: { contributions: number; onTime: number; receipts: number; circles: number }
}

export interface RoundInfo {
  beneficiary: string
  date: string
  short: string
  times: [string, string, string, string]
}

export interface Receipt {
  round: number
  iso: string
  label: string
  short: string
  beneficiary: string
}

export interface ExchangeRates {
  btcEur: number
  btcXof: number
  satsPerEur: number
  satsPerXof: number
  xofPerEur: number
  source: 'yadio' | 'coingecko' | 'fallback'
  fetchedAt: number
}

export interface ApiCircleSummary {
  id: string
  name: string
  organizerNpub: string
  amountXof: number
  frequency: Frequency
  status: 'recruiting' | 'active' | 'completed'
  inviteCode: string
  createdAt: number
  memberCount?: number
  currentRoundNumber?: number
}

export interface ApiMember {
  id: string
  npub: string
  displayName: string
  locale: Locale
  lightningAddress: string | null
  hasNwc: boolean
  payoutOrder: number
  paymentMethod: 'nwc_auto' | 'manual_qr'
  joinedAt: number
}

export interface ApiRound {
  id: string
  circleId: string
  roundNumber: number
  beneficiaryNpub: string
  dueAt: number
  exchangeRateSatsPerXof: number
  status: 'open' | 'settling' | 'completed' | 'overdue'
}

export interface ApiContribution {
  id: string
  roundId: string
  payerNpub: string
  amountXof: number
  amountSats: number
  bolt11Invoice: string | null
  paymentHash: string | null
  paymentPreimage: string | null
  status: 'pending' | 'invoiced' | 'paid' | 'late'
  nostrReceiptEventId: string | null
  nostrReceiptJson: string | null
  paidAt: number | null
  nostrEvent: Event | null
}

export interface ApiCircleDetail {
  circle: ApiCircleSummary
  members: ApiMember[]
  rounds: ApiRound[]
  currentRound: ApiRound | null
  contributions: ApiContribution[]
}

export interface ApiInvoice {
  contributionId: string
  amountXof: number
  amountSats: number
  bolt11: string
  paymentHash: string
  isSandbox: boolean
}

export interface ApiReputation {
  npub: string
  user: {
    npub: string
    displayName: string
    locale: string
    lightningAddress: string | null
    hasNwc: boolean
    createdAt: number
  } | null
  totalPaidRounds: number
  onTimeRate: number
  circlesCount: number
  receipts: PortableReceiptSummary[]
}

export interface DemoPersonaRecord {
  id: PersonaId
  name: string
  initials: string
  city: string
  role: string
  npub: string
  nsec: string
  locale: Locale
  lightningAddress: string
  paymentMethod: 'nwc_auto' | 'manual_qr'
  currency: 'xof' | 'eur'
}
