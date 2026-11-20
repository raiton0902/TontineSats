import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronLeft, KeyRound, ShieldCheck } from 'lucide-react'
import { CIRCLE } from '../lib/demo'
import { useDemoEntry } from '../lib/useDemoEntry'
import { useApp } from '../store/AppStore'
import { BrandMark, Button, ThemeToggle } from '../components/ui'
import { ConsentGate, useConsent } from '../components/ConsentGate'
import { consentRecord } from '../content/legal'

export function Entry() {
  const { session, t, signIn, locale } = useApp()
  const navigate = useNavigate()
  const openDemo = useDemoEntry()
  const [extensionError, setExtensionError] = useState('')
  const consent = useConsent()

  if (session) return <Navigate to="/app" replace />

  const connectExtension = async () => {
    setExtensionError('')
    try {
      const { nip07Login } = await import('../lib/crypto')
      const npub = await nip07Login()
      signIn({
        mode: 'keys',
        npub,
        name: 'Membre',
        locale,
        legalConsent: consentRecord(locale),
        createdAt: Date.now(),
      })
      navigate('/app')
    } catch {
      setExtensionError(t('auth.extensionMissing'))
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-[460px] items-center px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-1 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t('common.back')}
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[460px] px-4 pb-14 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-9 w-9 text-primary" />
            <span className="text-[15px] font-bold tracking-tight">{t('common.app')}</span>
          </div>
          <ThemeToggle className="border-border bg-card text-foreground hover:bg-secondary" />
        </div>

        <div className="animate-rise rounded-[20px] border border-border bg-card p-5 card-shadow sm:p-6">
          <h1 className="text-[24px] font-bold tracking-[-0.02em]">{t('landing.authTitle')}</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {t('landing.authSubtitle')}
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <ConsentGate consent={consent} />

            <Button
              size="lg"
              fullWidth
              disabled={!consent.accepted}
              onClick={() => navigate('/auth?mode=create')}
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {t('landing.create')}
            </Button>
            <Button
              size="lg"
              fullWidth
              variant="secondary"
              disabled={!consent.accepted}
              onClick={() => navigate('/auth?mode=import')}
            >
              {t('landing.import')}
            </Button>
            <Button variant="ghost" size="lg" fullWidth onClick={openDemo}>
              {t('landing.demo')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <p className="text-center text-[10.5px] leading-relaxed text-muted-foreground">
              {t('legal.demoNote')}
            </p>
          </div>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10.5px] tracking-[0.08em] text-muted-foreground uppercase">
              {t('landing.extension')}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="secondary" fullWidth disabled={!consent.accepted} onClick={connectExtension}>
            {t('landing.extCta')}
          </Button>
          {extensionError && (
            <p role="alert" className="mt-2 text-[11.5px] text-destructive">
              {extensionError}
            </p>
          )}

          <p className="mt-4 flex items-center gap-1.5 text-[10.5px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('auth.localOnly')}
          </p>
        </div>

        <p className="mt-6 text-[11.5px] leading-relaxed text-muted-foreground">
          {t('legal.nonCustody')}{' '}
          <Link to="/legal/terms" className="underline underline-offset-2 hover:text-foreground">
            {t('landing.terms')}
          </Link>
          <span aria-hidden="true"> · </span>
          <Link to="/legal/privacy" className="underline underline-offset-2 hover:text-foreground">
            {t('landing.privacy')}
          </Link>
        </p>

        <p className="mt-6 text-center text-[10.5px] text-muted-foreground">
          <Link to={`/join/${CIRCLE.inviteCode}`} className="underline underline-offset-2 hover:text-foreground">
            {t('join.title')} · {CIRCLE.name}
          </Link>
        </p>
      </main>
    </div>
  )
}
