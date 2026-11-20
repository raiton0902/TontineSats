import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Smartphone, Zap } from 'lucide-react'
import { CIRCLE, MEMBERS } from '../lib/demo'
import { LOCALES } from '../lib/i18n'
import { POT, dayLabel, satsLabel, xof } from '../lib/format'
import type { Locale } from '../lib/types'
import { useDemoEntry } from '../lib/useDemoEntry'
import { useApp } from '../store/AppStore'
import { DotField } from '../components/DotField'
import { BrandMark, ThemeToggle, cx } from '../components/ui'

const dueDate = new Date(2026, 10, 12)

const solidCta =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-hero-ink px-5 text-[15px] font-semibold text-hero-surface transition active:scale-[0.98] hover:bg-hero-ink/90'

const outlineCta =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-hero-line px-5 text-[15px] font-semibold text-hero-ink transition active:scale-[0.98] hover:bg-hero-wash'

const quietCta =
  'inline-flex min-h-12 items-center justify-center gap-1.5 rounded-[10px] px-3 text-[13px] font-semibold text-hero-muted underline decoration-hero-line underline-offset-4 transition hover:text-hero-ink hover:decoration-hero-ink'

const headerButton = 'min-h-11 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-semibold transition'

function LanguageSwitch() {
  const { locale, setLanguage, t } = useApp()

  return (
    <div
      role="group"
      aria-label={t('landing.langLabel')}
      className="flex items-center gap-0.5 rounded-full border border-hero-line bg-hero-wash p-0.5 backdrop-blur-md"
    >
      {LOCALES.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={locale === option.value}
          aria-label={option.label}
          onClick={() => setLanguage(option.value as Locale)}
          className={cx(
            'min-h-11 min-w-11 rounded-full px-3 text-[11.5px] font-semibold tracking-[0.04em] transition',
            locale === option.value
              ? 'bg-hero-ink text-hero-surface'
              : 'text-hero-muted hover:text-hero-ink',
          )}
        >
          {option.short}
        </button>
      ))}
    </div>
  )
}

export function Landing() {
  const { session, locale, t } = useApp()
  const navigate = useNavigate()
  const openDemo = useDemoEntry()

  if (session) return <Navigate to="/app" replace />

  return (
    <div className="landing-canvas relative min-h-dvh overflow-hidden text-hero-ink">
      <DotField />

      <header
        data-dot-damp
        className="relative z-10 mx-auto flex w-full max-w-[1080px] items-center justify-between gap-3 px-5 py-5 sm:px-8 lg:px-10"
      >
        <Link to="/" className="flex items-center gap-2.5" aria-label={t('common.app')}>
          <BrandMark className="h-8 w-8" />
          <span className="text-[15px] font-bold tracking-tight">{t('common.app')}</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle className="border-hero-line text-hero-ink hover:bg-hero-wash" />
          <LanguageSwitch />
          <Link
            to="/auth?mode=create"
            className={cx(headerButton, 'hidden bg-hero-ink text-hero-surface hover:bg-hero-ink/90 md:inline-flex')}
          >
            {t('landing.signUp')}
          </Link>
          <Link
            to="/auth?mode=import"
            className={cx(headerButton, 'hidden border border-hero-line text-hero-ink hover:bg-hero-wash md:inline-flex')}
          >
            {t('landing.signIn')}
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1080px] px-5 pb-12 sm:px-8 lg:px-10">
        <div className="mt-4 grid gap-8 lg:mt-12 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:gap-14">
          <div className="contents lg:block">
            <div data-dot-damp className="order-1 max-w-[560px] lg:order-none">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-hero-soft uppercase">
                {t('landing.overline')}
              </p>
              <h1 className="mt-3 text-[38px] leading-[1.05] font-bold tracking-[-0.035em] sm:text-[50px] lg:text-[60px]">
                {t('landing.title')}
              </h1>
              <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-hero-muted sm:text-[16px]">
                {t('landing.subtitle')}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                <button type="button" onClick={() => navigate('/auth?mode=create')} className={solidCta}>
                  {t('landing.signUp')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <Link to={`/join/${CIRCLE.inviteCode}`} className={outlineCta}>
                  {t('landing.joinCta')}
                </Link>
                <button type="button" onClick={openDemo} className={quietCta}>
                  {t('landing.demoShort')}
                </button>
              </div>

              <p className="mt-2 text-[10.5px] leading-relaxed text-hero-soft">{t('legal.demoNote')}</p>

              <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5 text-[11.5px] leading-relaxed text-hero-soft md:hidden">
                <span>{t('landing.haveIdentity')}</span>
                <button
                  type="button"
                  onClick={() => navigate('/auth?mode=import')}
                  className="font-medium text-hero-ink underline underline-offset-2"
                >
                  {t('landing.signIn')}
                </button>
              </p>

              <p className="mt-3.5 flex items-center gap-1.5 text-[11px] leading-relaxed text-hero-soft">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t('auth.localOnly')}
              </p>
            </div>
          </div>

          <aside
            data-dot-damp
            aria-label={t('landing.previewPot')}
            className="glass-veil order-2 w-full rounded-[22px] p-5 sm:p-6 lg:order-none lg:max-w-[420px] lg:justify-self-end"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10.5px] font-semibold tracking-[0.12em] text-hero-muted uppercase">
                {t('landing.previewPot')}
              </p>
              <span className="max-w-[55%] rounded-full border border-hero-line px-2.5 py-1 text-right text-[10.5px] leading-tight text-hero-muted">
                {t('landing.previewLabel')}
              </span>
            </div>

            <p className="mt-3 text-[32px] leading-none font-bold tracking-[-0.03em] tabular sm:text-[36px]">
              {xof(POT, locale)}
            </p>
            <p className="mt-1.5 text-[11.5px] text-hero-muted tabular">{satsLabel(POT, locale)}</p>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-hero-muted">{t('landing.previewProgress')}</span>
                <span className="text-hero-soft tabular">{dayLabel(dueDate, locale, true)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hero-line">
                <div className="h-full rounded-full bg-hero-ink" style={{ width: '62.5%' }} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {MEMBERS.slice(0, 3).map((member) => (
                    <span
                      key={member.order}
                      className="grid h-8 w-8 place-items-center rounded-full border border-hero-line bg-hero-wash text-[10px] font-semibold"
                    >
                      {member.initials}
                    </span>
                  ))}
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-hero-line bg-hero-wash text-[10px] font-semibold text-hero-muted">
                    +5
                  </span>
                </div>
                <span className="text-[10.5px] text-hero-soft">{CIRCLE.name}</span>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between gap-3 border-t border-hero-line pt-4">
              <div>
                <p className="text-[10.5px] text-hero-soft">{t('landing.previewDue')}</p>
                <p className="mt-0.5 text-[18px] font-semibold tabular">{xof(CIRCLE.amountXof, locale)}</p>
              </div>
              <span
                aria-hidden="true"
                className="rounded-[10px] bg-hero-ink px-3.5 py-2.5 text-[11.5px] font-semibold text-hero-surface"
              >
                {t('landing.previewCta')}
              </span>
            </div>
          </aside>
        </div>

        <ul data-dot-damp className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Zap, title: t('landing.proof1.title'), body: t('landing.proof1.body') },
            { icon: ShieldCheck, title: t('landing.proof2.title'), body: t('landing.proof2.body') },
            { icon: Smartphone, title: t('landing.proof3.title'), body: t('landing.proof3.body') },
          ].map((item) => {
            const Icon = item.icon
            return (
              <li key={item.title} className="glass-veil rounded-[16px] p-4">
                <Icon className="h-4 w-4 text-hero-muted" aria-hidden="true" />
                <p className="mt-2 text-[13px] font-semibold">{item.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-hero-muted">{item.body}</p>
              </li>
            )
          })}
        </ul>

        <div
          data-dot-damp
          className="mt-10 flex flex-col gap-3 border-t border-hero-line pt-5 text-[10.5px] text-hero-soft sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{t('landing.footnote')}</span>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/legal/terms" className="underline underline-offset-2 hover:text-hero-ink">
              {t('landing.terms')}
            </Link>
            <Link to="/legal/privacy" className="underline underline-offset-2 hover:text-hero-ink">
              {t('landing.privacy')}
            </Link>
            <Link
              to={`/join/${CIRCLE.inviteCode}`}
              className="underline underline-offset-2 hover:text-hero-ink"
            >
              {t('landing.joinCta')}
            </Link>
          </nav>
        </div>
      </main>
    </div>
  )
}
