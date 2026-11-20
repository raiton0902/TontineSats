import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, KeyRound, ShieldCheck, Smartphone } from 'lucide-react'
import { LOCALES } from '../lib/i18n'
import type { Locale } from '../lib/types'
import { useApp } from '../store/AppStore'
import { Button, CopyButton, Field, Segmented, Spinner, cx } from '../components/ui'
import { ConsentGate, useConsent } from '../components/ConsentGate'
import { consentRecord } from '../content/legal'

type Mode = 'create' | 'import' | 'extension'
type Step = 'start' | 'words' | 'profile'

interface PendingIdentity {
  npub: string
  nsec?: string
  mnemonic?: string
}

export function Auth() {
  const { session, t, signIn, announce } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/app'
  const [mode, setMode] = useState<Mode>(() => {
    const requested = params.get('mode')
    return requested === 'import' || requested === 'extension' ? requested : 'create'
  })
  const [step, setStep] = useState<Step>('start')
  const [identity, setIdentity] = useState<PendingIdentity | null>(null)
  const [checked, setChecked] = useState(false)
  const [name, setName] = useState('')
  const [locale, setLocale] = useState<Locale>('fr')
  const [lightning, setLightning] = useState('')
  const [nwc, setNwc] = useState('')
  const [importValue, setImportValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const consent = useConsent()

  const stepNumber = useMemo(() => (step === 'start' ? 1 : step === 'words' ? 2 : 3), [step])

  if (session) return <Navigate to={next} replace />

  // Leave the wizard the way you entered it. A direct link has no history to
  // return to, so it falls back to the landing page instead of the empty shell.
  const leave = () => {
    const index = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (index > 0) navigate(-1)
    else navigate('/', { replace: true })
  }

  const reset = () => {
    setIdentity(null)
    setStep('start')
    setChecked(false)
    setError('')
  }

  const switchMode = (value: Mode) => {
    setMode(value)
    reset()
  }

  const startCreate = async () => {
    setError('')
    setBusy(true)
    try {
      const { createIdentity } = await import('../lib/crypto')
      const created = createIdentity()
      setIdentity({ npub: created.npub, nsec: created.nsec, mnemonic: created.mnemonic })
      setStep('words')
    } catch {
      setError(t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const importKey = async () => {
    setError('')
    try {
      const { parseSecret } = await import('../lib/crypto')
      const parsed = parseSecret(importValue)
      setIdentity({ npub: parsed.npub, nsec: parsed.nsec })
      setStep('profile')
      announce(t('live.keyImported'))
    } catch {
      setError(t('auth.importError'))
    }
  }

  const connectExtension = async () => {
    setError('')
    setBusy(true)
    try {
      const { nip07Login } = await import('../lib/crypto')
      const npub = await nip07Login()
      setIdentity({ npub })
      setStep('profile')
    } catch {
      setError(t('auth.extensionMissing'))
    } finally {
      setBusy(false)
    }
  }

  const finish = () => {
    if (!identity) return
    if (!consent.accepted) return
    if (!name.trim()) {
      setError(t('profile.nameError'))
      return
    }
    signIn({
      mode: 'keys',
      npub: identity.npub,
      nsec: identity.nsec,
      mnemonic: identity.mnemonic,
      name: name.trim(),
      locale,
      lightningAddress: lightning.trim() || undefined,
      nwc: nwc.trim() || undefined,
      legalConsent: consentRecord(locale),
      createdAt: Date.now(),
    })
    navigate(next, { replace: true })
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-[620px] items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={leave}
          className="-ml-2 flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold transition hover:bg-secondary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t('common.back')}
        </button>
        <span className="text-[11px] text-muted-foreground">{t('auth.localOnly')}</span>
      </header>

      <main className="mx-auto w-full max-w-[620px] px-4 pb-16 sm:px-6">
        <h1 className="text-[26px] font-bold tracking-[-0.02em]">{t('auth.title')}</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t('auth.subtitle')}</p>

        <div className="mt-5">
          <Segmented
            label={t('auth.title')}
            value={mode}
            onChange={(value) => switchMode(value)}
            options={[
              { value: 'create', label: t('auth.createTab') },
              { value: 'import', label: t('auth.importTab') },
              { value: 'extension', label: t('auth.extensionTab') },
            ]}
          />
        </div>

        <div className="mt-4 rounded-[20px] border border-border bg-card p-5 card-shadow sm:p-6">
          {mode === 'create' && step !== 'start' && (
            <p className="mb-4 text-[11px] text-muted-foreground">
              {t('auth.step', { n: stepNumber, total: 3 })}
            </p>
          )}

          {mode === 'create' && step === 'start' && (
            <div>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <KeyRound className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-[18px] font-semibold tracking-tight">{t('auth.createTitle')}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{t('auth.createBody')}</p>
              <Button fullWidth size="lg" className="mt-5" onClick={startCreate} disabled={busy}>
                {busy ? <Spinner /> : null}
                {t('auth.createCta')}
              </Button>
              <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('auth.localOnly')}
              </p>
            </div>
          )}

          {mode === 'create' && step === 'words' && identity?.mnemonic && (
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight">{t('backup.title')}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t('backup.body')}</p>

              <ol className="mt-4 grid grid-cols-3 gap-2">
                {identity.mnemonic.split(' ').map((word, index) => (
                  <li
                    key={`${word}-${index}`}
                    className="flex items-baseline gap-1.5 rounded-[9px] border border-border bg-secondary px-2 py-2"
                  >
                    <span className="text-[9px] text-muted-foreground tabular">{index + 1}</span>
                    <span className="font-mono text-[12px] font-medium">{word}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[11px] leading-relaxed text-warning">{t('backup.warning')}</p>
                <CopyButton value={identity.mnemonic} label={t('common.copy')} variant="field" />
              </div>

              <label className="mt-4 flex items-start gap-2.5 rounded-xl border border-border p-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => setChecked(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-[12.5px] leading-relaxed">{t('backup.confirm')}</span>
              </label>

              <Button fullWidth size="lg" className="mt-4" disabled={!checked} onClick={() => setStep('profile')}>
                {t('backup.continue')}
              </Button>
            </div>
          )}

          {step === 'profile' && identity && (
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight">{t('profile.title')}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t('profile.body')}</p>

              <div className="mt-4 flex flex-col gap-4">
                <Field
                  label={t('profile.name')}
                  placeholder={t('profile.namePlaceholder')}
                  value={name}
                  autoFocus
                  onChange={(event) => setName(event.target.value)}
                  error={error || undefined}
                />

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium">{t('profile.locale')}</span>
                  <select
                    value={locale}
                    onChange={(event) => setLocale(event.target.value as Locale)}
                    className="min-h-11 rounded-[10px] border border-border bg-card px-3 text-[15px]"
                  >
                    {LOCALES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Field
                  label={`${t('profile.lightning')} · ${t('common.optional')}`}
                  placeholder={t('profile.lightningPlaceholder')}
                  value={lightning}
                  onChange={(event) => setLightning(event.target.value)}
                  hint={t('profile.lightningHint')}
                />

                <Field
                  label={`${t('profile.nwc')} · ${t('common.optional')}`}
                  placeholder={t('profile.nwcPlaceholder')}
                  value={nwc}
                  type="password"
                  autoComplete="off"
                  onChange={(event) => setNwc(event.target.value)}
                  hint={t('profile.nwcHint')}
                />
              </div>

              <div className="mt-4">
                <ConsentGate consent={consent} />
              </div>

              <Button fullWidth size="lg" className="mt-5" disabled={!consent.accepted} onClick={finish}>
                {t('profile.submit')}
              </Button>
              <button
                type="button"
                onClick={() => setStep(identity.mnemonic ? 'words' : 'start')}
                className="mt-2 min-h-11 w-full text-[12px] text-muted-foreground hover:text-foreground"
              >
                {t('common.back')}
              </button>
            </div>
          )}

          {mode === 'import' && step === 'start' && (
            <div>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <KeyRound className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-[18px] font-semibold tracking-tight">{t('auth.importTitle')}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{t('auth.importBody')}</p>
              <textarea
                value={importValue}
                onChange={(event) => setImportValue(event.target.value)}
                placeholder={t('auth.importPlaceholder')}
                spellCheck={false}
                className={cx(
                  'mt-4 min-h-28 w-full resize-y rounded-[10px] border bg-card p-3 font-mono text-[12.5px]',
                  error ? 'border-destructive' : 'border-border',
                )}
              />
              {error && <p className="mt-1 text-[11.5px] text-destructive">{error}</p>}
              <Button fullWidth size="lg" className="mt-3" onClick={importKey}>
                {t('auth.importCta')}
              </Button>
            </div>
          )}

          {mode === 'extension' && step === 'start' && (
            <div>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Smartphone className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-[18px] font-semibold tracking-tight">{t('auth.extensionTitle')}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{t('auth.extensionBody')}</p>
              <Button fullWidth size="lg" className="mt-5" onClick={connectExtension} disabled={busy}>
                {busy ? <Spinner /> : null}
                {t('auth.extensionCta')}
              </Button>
              {error && (
                <p role="alert" className="mt-2 text-[11.5px] text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
