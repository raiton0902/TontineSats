import { en } from './en'
import { fr } from './fr'
import type { LegalDocId, LegalLang } from './types'
import type { LegalConsent, Locale } from '../../lib/types'

export const LEGAL_VERSION = '1.0'

export const LEGAL_DATE: Record<LegalLang, string> = {
  fr: '9 novembre 2026',
  en: '9 November 2026',
}

export const LEGAL_TITLES: Record<LegalDocId, Record<LegalLang, string>> = {
  terms: { fr: fr.terms.title, en: en.terms.title },
  privacy: { fr: fr.privacy.title, en: en.privacy.title },
}

export const LEGAL_DOCS: Record<LegalDocId, Record<LegalLang, (typeof fr)['terms']>> = {
  terms: { fr: fr.terms, en: en.terms },
  privacy: { fr: fr.privacy, en: en.privacy },
}

export function consentRecord(locale: Locale): LegalConsent {
  return {
    terms: LEGAL_VERSION,
    privacy: LEGAL_VERSION,
    acceptedAt: Date.now(),
    locale,
  }
}

export function isLegalDocId(value: string | undefined): value is LegalDocId {
  return value === 'terms' || value === 'privacy'
}
