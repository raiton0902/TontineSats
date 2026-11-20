import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Check, ExternalLink, Info, Lock, QrCode, Wallet, Zap } from 'lucide-react'
import { api } from '../lib/api'
import { ROUNDS } from '../lib/demo'
import { CONTRIBUTION, amountPrimary, nf, satsLabel } from '../lib/format'
import type { ApiInvoice } from '../lib/types'
import { useApp } from '../store/AppStore'
import { Confetti } from './Confetti'
import { QrCode as QrCodeSvg } from './QrCode'
import { Button, CopyButton, Field, Pill, Sheet, Spinner, cx } from './ui'

type Step = 'form' | 'processing' | 'paid' | 'qr' | 'qr-error'
type Method = 'nwc' | 'qr'

export function PaymentSheet() {
  const {
    t,
    locale,
    session,
    paymentOpen,
    closePayment,
    persona,
    updateDemo,
    announce,
    settings,
    activeCircle,
    backendOnline,
    rates,
    refreshData,
  } = useApp()
  const [step, setStep] = useState<Step>('form')
  const [method, setMethod] = useState<Method>(persona.method)
  const [currency, setCurrency] = useState<'xof' | 'eur'>(persona.currency)
  const [stage, setStage] = useState(0)
  const [confetti, setConfetti] = useState(0)
  const [invoice, setInvoice] = useState<ApiInvoice | null>(null)
  const [preimageInput, setPreimageInput] = useState('')
  const [busyAction, setBusyAction] = useState(false)
  const [nwcError, setNwcError] = useState('')
  const [qrError, setQrError] = useState('')
  const [receiptRouteId, setReceiptRouteId] = useState('3')
  const timers = useRef<number[]>([])
  const navigate = useNavigate()

  const currentRound = backendOnline ? activeCircle?.currentRound ?? null : null
  const isLiveApi = Boolean(backendOnline && activeCircle && currentRound && session)

  const amountXof = isLiveApi ? activeCircle!.circle.amountXof : CONTRIBUTION
  const satsPerXof = isLiveApi ? currentRound!.exchangeRateSatsPerXof : rates?.satsPerXof
  const beneficiaryMember = isLiveApi
    ? activeCircle!.members.find((m) => m.npub === currentRound!.beneficiaryNpub)
    : null
  const beneficiary = beneficiaryMember?.displayName ?? ROUNDS[3].beneficiary
  const roundNumber = currentRound?.roundNumber ?? 3
  const currentMember = isLiveApi
    ? activeCircle!.members.find((m) => m.npub === session!.npub)
    : null
  const preferredMethod: Method = isLiveApi
    ? currentMember?.paymentMethod === 'nwc_auto'
      ? 'nwc'
      : 'qr'
    : persona.method

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  useEffect(() => {
    if (!paymentOpen) return
    setStep('form')
    setMethod(preferredMethod)
    setCurrency(persona.currency)
    setStage(0)
    setInvoice(null)
    setPreimageInput('')
    setNwcError('')
    setQrError('')
    setBusyAction(false)
    return clearTimers
  }, [paymentOpen, preferredMethod, persona.currency])

  useEffect(() => () => clearTimers(), [])

  const openQrFlow = async () => {
    setNwcError('')
    setQrError('')
    if (!isLiveApi) {
      setStep('qr')
      const expiry = window.setTimeout(() => setStep('qr-error'), 12_000)
      timers.current.push(expiry)
      return
    }
    setBusyAction(true)
    try {
      const created = await api.createInvoice(currentRound!.id, session!.npub)
      setInvoice(created)
      setReceiptRouteId(created.contributionId)
      setStep('qr')
    } catch (err) {
      setNwcError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setBusyAction(false)
    }
  }

  const start = async () => {
    if (method === 'qr') {
      await openQrFlow()
      return
    }

    setNwcError('')
    if (!isLiveApi) {
      setStep('processing')
      setStage(0)
      const delay = settings.reduceMotion ? 140 : 780
      for (let index = 0; index < 3; index += 1) {
        timers.current.push(
          window.setTimeout(() => setStage(index + 1), delay * (index + 1)),
        )
      }
      timers.current.push(
        window.setTimeout(
          () => {
            setReceiptRouteId('3')
            setStep('paid')
            updateDemo({ paid: true, confirmed: 6 })
            announce(t('live.paid'))
            setConfetti((value) => value + 1)
          },
          delay * 3 + (settings.reduceMotion ? 60 : 220),
        ),
      )
      return
    }

    setStep('processing')
    setStage(1)
    try {
      const delay = settings.reduceMotion ? 80 : 320
      const res = await api.triggerNwc(currentRound!.id, { payerNpub: session!.npub })
      const first = res.results[0]
      if (!first || first.status === 'failed') {
        setStep('form')
        setNwcError(first?.error || t('pay.nwcErrorTitle'))
        return
      }
      setStage(2)
      await new Promise((resolve) => setTimeout(resolve, delay))
      setStage(3)
      await new Promise((resolve) => setTimeout(resolve, delay))

      const myContrib = activeCircle!.contributions.find(
        (c) => c.roundId === currentRound!.id && c.payerNpub === session!.npub,
      )
      setReceiptRouteId(myContrib?.id || first.receiptEventId || String(roundNumber))
      await refreshData(activeCircle!.circle.id)
      setStep('paid')
      announce(t('live.paid'))
      setConfetti((value) => value + 1)
    } catch (err) {
      setStep('form')
      setNwcError(err instanceof Error ? err.message : t('pay.nwcErrorTitle'))
    }
  }

  const verifyQrPayment = async (opts: { simulateSandbox?: boolean; paymentPreimage?: string }) => {
    setQrError('')
    if (!isLiveApi) {
      clearTimers()
      setReceiptRouteId('3')
      setStep('paid')
      updateDemo({ paid: true, confirmed: 6 })
      announce(t('live.paid'))
      setConfetti((value) => value + 1)
      return
    }
    if (!invoice) return
    setBusyAction(true)
    try {
      const res = await api.verifyContribution(invoice.contributionId, opts)
      setReceiptRouteId(res.contribution.id)
      await refreshData(activeCircle!.circle.id)
      setStep('paid')
      announce(t('live.paid'))
      setConfetti((value) => value + 1)
    } catch (err) {
      setQrError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setBusyAction(false)
    }
  }

  const amount = amountPrimary(amountXof, locale, currency)
  const stageLabels = [t('pay.stage1'), t('pay.stage2'), t('pay.stage3')]
  const satsPerEurDisplay = Math.round(rates?.satsPerEur ?? 1100)

  return (
    <>
      <Confetti fire={confetti} />
      <Sheet open={paymentOpen} onClose={closePayment} title={t('pay.title', { round: roundNumber })}>
        {step === 'form' && (
          <div>
            <div className="pb-4 text-center">
              <p className="text-[32px] font-bold tracking-[-0.03em] tabular">{amount}</p>
              <p className="mt-0.5 text-xs text-muted-foreground tabular">
                {satsLabel(amountXof, locale, satsPerXof)}
              </p>
              <button
                type="button"
                onClick={() => setCurrency((value) => (value === 'xof' ? 'eur' : 'xof'))}
                aria-label={t('pay.changeCurrency')}
                className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-secondary px-3 text-[11px] text-muted-foreground transition hover:bg-border"
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="tabular">{t('pay.rate', { sats: nf(satsPerEurDisplay, locale) })}</span>
              </button>
            </div>

            {nwcError && (
              <div
                role="alert"
                className="mb-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-left"
              >
                <div className="flex items-start gap-2 text-xs font-semibold text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p>{t('pay.nwcErrorTitle')}</p>
                    <p className="mt-0.5 font-normal text-foreground">{nwcError}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  className="mt-2.5"
                  onClick={() => {
                    setMethod('qr')
                    void openQrFlow()
                  }}
                >
                  <QrCode className="h-4 w-4" />
                  {t('pay.nwcFallbackQr')}
                </Button>
              </div>
            )}

            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">{t('pay.auto')}</legend>
              {(
                [
                  {
                    id: 'nwc',
                    icon: Wallet,
                    title: t('pay.auto'),
                    sub: t('pay.autoSub'),
                    tag: t('pay.recommended'),
                  },
                  {
                    id: 'qr',
                    icon: QrCode,
                    title: t('pay.qr'),
                    sub: t('pay.qrSub'),
                    tag: null,
                  },
                ] as const
              ).map((option) => {
                const Icon = option.icon
                const selected = method === option.id
                return (
                  <label
                    key={option.id}
                    className={cx(
                      'relative flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 transition active:scale-[0.995]',
                      selected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:bg-secondary',
                    )}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={option.id}
                      checked={selected}
                      onChange={() => setMethod(option.id)}
                      className="sr-only"
                    />
                    <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-border bg-card text-foreground">
                      <Icon className={cx('h-5 w-5', selected && 'text-primary')} />
                      <span
                        aria-hidden="true"
                        className={cx(
                          'absolute -right-1 -bottom-1 grid h-[18px] w-[18px] place-items-center rounded-full bg-primary text-primary-foreground transition',
                          selected ? 'scale-100 opacity-100' : 'scale-[0.3] opacity-0',
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold">{option.title}</span>
                      <span className="block text-[11px] text-muted-foreground">{option.sub}</span>
                    </span>
                    {option.tag && <Pill tone="muted">{option.tag}</Pill>}
                  </label>
                )
              })}
            </fieldset>

            <p className="flex items-center gap-1.5 pt-3 pb-1 text-[11.5px] text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              {t('pay.fee')}
            </p>

            <Button fullWidth size="lg" onClick={start} disabled={busyAction} className="mt-2">
              {busyAction ? <Spinner /> : <Zap className="h-4 w-4" />}
              {`${t('pay.cta')} ${amount}`}
            </Button>
            <p className="mt-2 text-center text-[10.5px] leading-relaxed text-muted-foreground">
              {t('pay.trust', { name: beneficiary })}
            </p>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-6">
            <p className="mb-5 text-center text-sm font-semibold">{t('pay.processing')}</p>
            <ol className="flex flex-col">
              {stageLabels.map((label, index) => {
                const done = index < stage
                const active = index === stage
                return (
                  <li
                    key={label}
                    className={cx(
                      'flex items-center gap-2.5 border-b border-border px-1 py-3 last:border-b-0',
                      index > stage && 'opacity-45',
                    )}
                  >
                    <span
                      className={cx(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-full',
                        done ? 'bg-success text-success-foreground' : 'bg-secondary',
                      )}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : active ? (
                        <Spinner className="h-3.5 w-3.5" />
                      ) : null}
                    </span>
                    <span className={cx('text-[13px] font-medium', done && 'text-muted-foreground')}>
                      {label}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {step === 'paid' && (
          <div className="py-2 text-center">
            <svg viewBox="0 0 52 52" className="mx-auto h-16 w-16 text-success" aria-hidden="true">
              <circle
                cx="26"
                cy="26"
                r="23"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="check-draw-circle"
              />
              <path
                d="M15 27l7 7 15-15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="check-draw-path"
              />
            </svg>
            <p className="mt-2 text-base font-semibold">{t('pay.success')}</p>
            <p className="text-[30px] font-bold tracking-[-0.03em] tabular">{amount}</p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              {t('pay.successSub', { name: beneficiary })}
            </p>
            <div className="mt-5 flex flex-col gap-1.5">
              <Button
                fullWidth
                onClick={() => {
                  closePayment()
                  navigate(`/app/receipt/${receiptRouteId}`)
                }}
              >
                {t('pay.seeReceipt')}
              </Button>
              <Button variant="ghost" fullWidth onClick={closePayment}>
                {t('pay.close')}
              </Button>
            </div>
          </div>
        )}

        {step === 'qr' && (
          <div className="text-center">
            <QrCodeSvg
              value={invoice?.bolt11 ?? 'lntbs240000n1p3demo0tontinesats'}
              label={t('pay.demoQr')}
            />
            <p className="mt-2 text-xs font-medium text-muted-foreground tabular">
              {amount} · {satsLabel(amountXof, locale, satsPerXof)}
            </p>
            <p className="mt-2 mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-warning" />
              {t('pay.waiting')}
            </p>

            {invoice && (
              <div className="mb-3 flex flex-col gap-2 text-left">
                <div className="rounded-xl border border-border bg-secondary px-3 py-2">
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {invoice.bolt11}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <CopyButton
                    value={invoice.bolt11}
                    label={t('pay.copyInvoice')}
                    variant="field"
                  />
                  <a
                    href={`lightning:${invoice.bolt11}`}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[10px] border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:bg-secondary"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('pay.openWallet')}
                  </a>
                </div>
              </div>
            )}

            {qrError && (
              <p role="alert" className="mb-3 text-xs font-medium text-destructive">
                {qrError}
              </p>
            )}

            {isLiveApi && !invoice?.isSandbox && (
              <div className="mb-3 flex flex-col gap-2 text-left">
                <Field
                  label={t('pay.preimageLabel')}
                  value={preimageInput}
                  onChange={(e) => setPreimageInput(e.target.value)}
                  placeholder="64 hex..."
                  className="font-mono text-xs"
                />
                <Button
                  fullWidth
                  disabled={busyAction || !preimageInput.trim()}
                  onClick={() => void verifyQrPayment({ paymentPreimage: preimageInput.trim() })}
                >
                  {busyAction ? <Spinner /> : null}
                  {t('pay.verifyPreimage')}
                </Button>
              </div>
            )}

            {(!isLiveApi || invoice?.isSandbox) && (
              <Button
                variant="secondary"
                fullWidth
                disabled={busyAction}
                onClick={() => void verifyQrPayment({ simulateSandbox: true })}
              >
                {busyAction ? <Spinner /> : null}
                {t('pay.simulate')}
              </Button>
            )}
          </div>
        )}

        {step === 'qr-error' && (
          <div className="py-6 text-center">
            <p className="text-sm font-semibold text-destructive">{t('pay.expired')}</p>
            <p className="mx-auto mt-1 mb-4 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
              {t('pay.expiredSub')}
            </p>
            <Button
              fullWidth
              onClick={() => {
                clearTimers()
                setStep('form')
              }}
            >
              {t('pay.retry')}
            </Button>
          </div>
        )}
      </Sheet>
    </>
  )
}
