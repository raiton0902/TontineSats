import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppStore'

export interface ConsentValue {
  terms: boolean
  privacy: boolean
  accepted: boolean
  set: (which: 'terms' | 'privacy') => (value: boolean) => void
}

export function useConsent(): ConsentValue {
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)

  const set = useCallback(
    (which: 'terms' | 'privacy') => (value: boolean) => {
      if (which === 'terms') setTerms(value)
      else setPrivacy(value)
    },
    [],
  )

  return { terms, privacy, accepted: terms && privacy, set }
}

const linkClass = 'font-medium text-foreground underline underline-offset-2 hover:text-primary'

export function ConsentGate({ consent }: { consent: ConsentValue }) {
  const { t } = useApp()

  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-3">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={consent.terms}
          onChange={(event) => consent.set('terms')(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
        />
        <span className="text-[12px] leading-relaxed">
          {t('legal.acceptTermsLead')}{' '}
          <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className={linkClass}>
            {t('legal.termsName')}
          </Link>{' '}
          {t('legal.acceptTermsTail')}
        </span>
      </label>

      <label className="mt-2 flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={consent.privacy}
          onChange={(event) => consent.set('privacy')(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
        />
        <span className="text-[12px] leading-relaxed">
          {t('legal.privacyLead')}{' '}
          <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
            {t('legal.privacyName')}
          </Link>
          {t('legal.privacyTail')}
        </span>
      </label>

      {!consent.accepted && (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{t('legal.gate')}</p>
      )}
    </div>
  )
}
