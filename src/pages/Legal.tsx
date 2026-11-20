import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { BrandMark, cx } from '../components/ui'
import { LEGAL_DATE, LEGAL_DOCS, LEGAL_VERSION, isLegalDocId } from '../content/legal'
import type { LegalLang } from '../content/legal/types'

const LANGS: { value: LegalLang; label: string }[] = [
  { value: 'fr', label: 'FR' },
  { value: 'en', label: 'EN' },
]

export function LegalPage() {
  const { doc } = useParams()
  const { locale, t } = useApp()
  const [lang, setLang] = useState<LegalLang>(() => (locale === 'en' ? 'en' : 'fr'))

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [doc])

  if (!isLegalDocId(doc)) return <Navigate to="/" replace />

  const content = LEGAL_DOCS[doc][lang]

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-1 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {t('common.back')}
          </Link>

          <div
            role="group"
            aria-label={t('legal.langLabel')}
            className="flex items-center gap-0.5 rounded-full border border-border bg-secondary p-0.5"
          >
            {LANGS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={lang === option.value}
                aria-label={option.value === 'fr' ? 'Français' : 'English'}
                onClick={() => setLang(option.value)}
                className={cx(
                  'min-h-11 min-w-11 rounded-full px-3 text-[11.5px] font-semibold tracking-[0.04em] transition',
                  lang === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-4 pb-20 sm:px-6">
        <div className="mt-6 flex items-center gap-2.5">
          <BrandMark className="h-8 w-8 text-primary" />
          <span className="text-[14px] font-bold tracking-tight">{t('common.app')}</span>
        </div>

        <h1 className="mt-5 text-[27px] font-bold tracking-[-0.025em] sm:text-[32px]">{content.title}</h1>
        <p className="mt-2 text-[11.5px] text-muted-foreground tabular">
          {t('legal.version', { v: LEGAL_VERSION })} · {t('legal.updated', { date: LEGAL_DATE[lang] })}
        </p>

        {locale === 'wo' && (
          <p className="mt-3 rounded-lg border border-border bg-secondary px-3 py-2 text-[11.5px] leading-relaxed">
            {t('legal.woNote')}
          </p>
        )}

        <p className="mt-5 text-[13.5px] leading-[1.65] text-muted-foreground">{content.intro}</p>

        <div className="mt-7 flex flex-col gap-6">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-[14.5px] font-semibold tracking-tight">{section.heading}</h2>
              <div className="mt-1.5 flex flex-col gap-2">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-[13.5px] leading-[1.65]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
          {t('legal.notice')}
        </p>
      </main>
    </div>
  )
}
