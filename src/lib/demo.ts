import type { Member, Persona, Receipt, RoundInfo } from './types'

export const CIRCLE = {
  name: 'Tontine Sandaga',
  city: 'Dakar',
  amountXof: 24_000,
  frequency: 'monthly' as const,
  inviteCode: 'SNDG24',
  round: 3,
  rounds: 8,
  dueIso: '2026-11-12',
}

export const ROUNDS: Record<number, RoundInfo> = {
  3: {
    beneficiary: 'Mariama Sow',
    date: '12 nov. 2026',
    short: '12 nov.',
    times: ['16:02', '18:04', '18:04', '18:05'],
  },
  2: {
    beneficiary: 'Moussa Diallo',
    date: '12 oct. 2026',
    short: '12 oct.',
    times: ['16:10', '17:52', '17:52', '17:53'],
  },
  1: {
    beneficiary: 'Awa Diop',
    date: '12 sept. 2026',
    short: '12 sept.',
    times: ['15:48', '18:20', '18:20', '18:21'],
  },
}

export const MEMBERS: Member[] = [
  { order: 1, name: 'Awa Diop', initials: 'AD', status: 'paid', round: 1, npub: 'npub1t9…4m2q' },
  { order: 2, name: 'Moussa Diallo', initials: 'MD', status: 'paid', round: 2, npub: 'npub1q8…7x3v' },
  { order: 3, name: 'Mariama Sow', initials: 'MS', status: 'current', round: 3, npub: 'npub1m7…k2cd' },
  { order: 4, name: 'Fatou Ndiaye', initials: 'FN', status: 'waiting', round: 4, npub: 'npub1k2…5p9r' },
  { order: 5, name: 'Ibrahima Fall', initials: 'IF', status: 'waiting', round: 5, npub: 'npub1a4…9df1' },
  { order: 6, name: 'Aïssatou Ba', initials: 'AB', status: 'waiting', round: 6, npub: 'npub1z6…2gh8' },
  { order: 7, name: 'Ousmane Sarr', initials: 'OS', status: 'waiting', round: 7, npub: 'npub1p8…4kl2' },
  { order: 8, name: 'Khady Ndiaye', initials: 'KN', status: 'waiting', round: 8, npub: 'npub1r3…7mn5' },
]

export const RECEIPTS: Receipt[] = [
  { round: 2, iso: '2026-10-12', label: '12 oct. 2026', short: '12 oct.', beneficiary: 'Moussa Diallo' },
  { round: 1, iso: '2026-09-12', label: '12 sept. 2026', short: '12 sept.', beneficiary: 'Awa Diop' },
]

export const PAYOUT_DAYS = new Set(['2026-11-12', '2026-10-12', '2026-09-12'])

export const PERSONAS: Record<string, Persona> = {
  awa: {
    id: 'awa',
    name: 'Awa Diop',
    initials: 'AD',
    city: 'Dakar',
    role: 'Organisatrice',
    method: 'nwc',
    currency: 'xof',
    stats: { contributions: 12, onTime: 100, receipts: 12, circles: 3 },
  },
  moussa: {
    id: 'moussa',
    name: 'Moussa Diallo',
    initials: 'MD',
    city: 'Paris',
    role: 'Diaspora',
    method: 'nwc',
    currency: 'eur',
    stats: { contributions: 8, onTime: 100, receipts: 8, circles: 2 },
  },
  fatou: {
    id: 'fatou',
    name: 'Fatou Ndiaye',
    initials: 'FN',
    city: 'Thiès',
    role: 'Membre',
    method: 'qr',
    currency: 'xof',
    stats: { contributions: 5, onTime: 80, receipts: 4, circles: 1 },
  },
}
