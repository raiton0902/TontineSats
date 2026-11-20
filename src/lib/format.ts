import type { Locale } from './types'

export const XOF_PER_EUR = 655.957
export const SATS_PER_EUR = 1100
export const CONTRIBUTION = 24_000
export const MEMBER_COUNT = 8
export const POT = CONTRIBUTION * MEMBER_COUNT

const localeTag = (locale: Locale) => (locale === 'en' ? 'en-US' : 'fr-FR')

export const nf = (value: number, locale: Locale, digits = 0) =>
  new Intl.NumberFormat(localeTag(locale), {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)

export const xof = (value: number, locale: Locale) => `${nf(value, locale)} FCFA`

export const eur = (value: number, locale: Locale) =>
  new Intl.NumberFormat(localeTag(locale), { style: 'currency', currency: 'EUR' }).format(
    value / XOF_PER_EUR,
  )

export const amountPrimary = (value: number, locale: Locale, currency: 'xof' | 'eur') =>
  currency === 'eur' ? eur(value, locale) : xof(value, locale)

export const amountValue = (value: number, locale: Locale, currency: 'xof' | 'eur') =>
  currency === 'eur' ? nf(value / XOF_PER_EUR, locale, 2) : nf(value, locale)

export const currencyUnit = (currency: 'xof' | 'eur') => (currency === 'eur' ? '€' : 'FCFA')

export const satsOf = (value: number, satsPerXof?: number) => {
  if (satsPerXof && satsPerXof > 0) {
    return Math.max(1, Math.round(value * satsPerXof))
  }
  return Math.round(((value / XOF_PER_EUR) * SATS_PER_EUR) / 10) * 10
}

export const satsLabel = (value: number, locale: Locale, satsPerXof?: number) =>
  `≈ ${nf(satsOf(value, satsPerXof), locale)} sats`

export const shortNpub = (npub: string) =>
  npub.length > 16 ? `${npub.slice(0, 10)}…${npub.slice(-5)}` : npub

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'TS'

export const localeDate = (date: Date, locale: Locale, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(localeTag(locale), opts).format(date)

export const isoOf = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

export const monthLabel = (year: number, month: number, locale: Locale) => {
  const raw = localeDate(new Date(year, month, 1), locale, { month: 'long', year: 'numeric' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export const dayLabel = (date: Date, locale: Locale, withYear = false) =>
  localeDate(date, locale, {
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  })
