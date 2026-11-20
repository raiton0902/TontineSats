import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Share2, ShieldAlert } from 'lucide-react'
import { ROUNDS } from '../lib/demo'
import { CONTRIBUTION, amountPrimary, dayLabel, localeDate, nf, shortNpub } from '../lib/format'
import { verifyReceiptEvent } from '../lib/nostr'
import { useApp } from '../store/AppStore'
import { Button, CopyButton, Pill } from '../components/ui'

export function ReceiptPage() {
  const { t, locale, session, settings, announce, activeCircle, reputation, backendOnline } = useApp()
  const navigate = useNavigate()
  const { round } = useParams()
  const [visible, setVisible] = useState(0)

  const liveFromRep = backendOnline
    ? reputation?.receipts.find((r) => r.id === round || r.nostrReceiptEventId === round)
    : undefined

  const liveFromCircle = (() => {
    if (!backendOnline || !activeCircle) return undefined
    const c = activeCircle.contributions.find(
      (entry) =>
        (entry.id === round || entry.nostrReceiptEventId === round) && entry.status === 'paid',
    )
    if (!c) return undefined
    const r = activeCircle.rounds.find((rnd) => rnd.id === c.roundId)
    if (!r) return undefined
    const ben = activeCircle.members.find((m) => m.npub === r.beneficiaryNpub)
    return {
      id: c.id,
      roundNumber: r.roundNumber,
      beneficiaryName: ben?.displayName ?? shortNpub(r.beneficiaryNpub),
      beneficiaryNpub: r.beneficiaryNpub,
      payerNpub: c.payerNpub,
      amountXof: c.amountXof,
      amountSats: c.amountSats,
      paymentHash: c.paymentHash ?? '',
      paymentPreimage: c.paymentPreimage ?? '',
      paidAt: c.paidAt ?? Date.now(),
      nostrReceiptEventId: c.nostrReceiptEventId ?? '',
      nostrEvent: c.nostrEvent,
      verified: verifyReceiptEvent(c.nostrEvent),
    }
  })()

  const liveReceipt = liveFromRep ?? liveFromCircle
  const roundNumber = Number(round)
  const demoInfo = !liveReceipt && Number.isFinite(roundNumber) ? ROUNDS[roundNumber] : undefined

  const found = Boolean(liveReceipt || demoInfo)

  useEffect(() => {
    if (!found) return
    if (settings.reduceMotion) {
      setVisible(4)
      return
    }
    setVisible(0)
    const timers = [0, 1, 2, 3].map((index) =>
      window.setTimeout(() => setVisible(index + 1), 80 + index * 120),
    )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [found, settings.reduceMotion])

  if (!found) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">{t('rec.notFound')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/app/activity')}>
          {t('common.back')}
        </Button>
      </div>
    )
  }

  const amountXof = liveReceipt?.amountXof ?? CONTRIBUTION
  const beneficiaryName = liveReceipt?.beneficiaryName ?? demoInfo!.beneficiary
  const dateLabel = liveReceipt
    ? dayLabel(new Date(liveReceipt.paidAt), locale, true)
    : demoInfo!.date
  const shortDate = liveReceipt
    ? localeDate(new Date(liveReceipt.paidAt), locale, { day: 'numeric', month: 'short' })
    : demoInfo!.short
  const timeText = liveReceipt
    ? localeDate(new Date(liveReceipt.paidAt), locale, { hour: '2-digit', minute: '2-digit' })
    : demoInfo!.times[1]

  const hashPreview = liveReceipt?.paymentHash
    ? shortNpub(liveReceipt.paymentHash)
    : 'af1c3d…9e7b'
  const preimagePreview = liveReceipt?.paymentPreimage
    ? shortNpub(liveReceipt.paymentPreimage)
    : 'sha256 OK'
  const eventPreview = liveReceipt?.nostrReceiptEventId
    ? `30078:${shortNpub(liveReceipt.nostrReceiptEventId)}`
    : '30078:9f2…c41'
  const payerNpub = liveReceipt?.payerNpub ?? session?.npub ?? ''
  const beneficiaryNpub = liveReceipt?.beneficiaryNpub ?? 'npub1m7…k2cd'
  const isCryptoVerified = liveReceipt ? liveReceipt.verified : true

  const steps = [
    {
      title: t('rec.step1'),
      sub: liveReceipt ? `${shortDate} · ${nf(liveReceipt.amountSats, locale)} sats` : `${shortDate} ${demoInfo!.times[0]}`,
    },
    {
      title: t('rec.step2'),
      sub: `${shortDate} ${timeText} · ${hashPreview}`,
    },
    {
      title: t('rec.step3'),
      sub: `${shortDate} ${timeText} · ${preimagePreview}`,
    },
    {
      title: t('rec.step4'),
      sub: `kind 30078 · ${shortDate} ${timeText}`,
    },
  ]

  const shareText = `Reçu TontineSats · ${amountPrimary(amountXof, locale, 'xof')} · ${dateLabel} · ${eventPreview}`

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <header className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate('/app/activity')}
          className="inline-flex min-h-11 items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </button>
        <Pill tone={isCryptoVerified ? 'success' : 'warning'}>
          {isCryptoVerified ? <Check className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
          {isCryptoVerified ? t('rec.verified') : t('rec.unverified')}
        </Pill>
      </header>

      <h1 className="text-[22px] font-bold tracking-[-0.02em] sm:text-[26px]">{t('rec.title')}</h1>

      <section className="glass-panel mt-4 rounded-[18px] p-5 text-center">
        <p className="text-[11.5px] text-muted-foreground">{t('rec.amountLabel')}</p>
        <p className="mt-1 text-[30px] font-bold tracking-[-0.03em] tabular">
          {amountPrimary(amountXof, locale, 'xof')}
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          {t('rec.by', { name: beneficiaryName, date: dateLabel })}
        </p>
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-[14px] font-semibold tracking-tight">{t('rec.proof')}</h2>
        <ol className="relative">
          <span
            aria-hidden="true"
            className="absolute top-3 bottom-3 left-[11px] w-px bg-border"
          />
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative flex gap-3 py-2 transition-opacity duration-200"
              style={{ opacity: index < visible ? 1 : 0.4 }}
            >
              <span className="relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success text-success-foreground">
                <Check className="h-3 w-3" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium">{step.title}</span>
                <span className="block font-mono text-[11px] text-muted-foreground">{step.sub}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-[14px] font-semibold tracking-tight">{t('rec.breakdown')}</h2>
        <dl className="flex flex-col">
          <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-[12.5px]">
            <dt className="text-muted-foreground">{t('act.due')}</dt>
            <dd className="font-medium tabular">{amountPrimary(amountXof, locale, 'xof')}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-[12.5px]">
            <dt className="text-muted-foreground">{t('rec.fee')}</dt>
            <dd className="font-medium tabular">0 FCFA (P2P)</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2 text-[13.5px] font-semibold">
            <dt>{t('rec.net')}</dt>
            <dd className="tabular">{amountPrimary(amountXof, locale, 'xof')}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-[14px] font-semibold tracking-tight">{t('rec.refs')}</h2>
        <dl className="flex flex-col">
          <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-[12px]">
            <dt className="text-muted-foreground">{t('rec.payer')}</dt>
            <dd className="font-mono text-[11px]">{shortNpub(payerNpub)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-[12px]">
            <dt className="text-muted-foreground">{t('rec.beneficiary')}</dt>
            <dd className="font-mono text-[11px]">{shortNpub(beneficiaryNpub)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-[12px]">
            <dt className="text-muted-foreground">Hash</dt>
            <dd className="font-mono text-[11px]">{hashPreview}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2 text-[12px]">
            <dt className="text-muted-foreground">Event</dt>
            <dd className="font-mono text-[11px]">{eventPreview}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-5 flex gap-2">
        <CopyButton value={shareText} label={t('rec.copy')} variant="field" className="flex-1" />
        <Button
          variant="secondary"
          className="flex-1"
          onClick={async () => {
            if (navigator.share) {
              await navigator.share({ text: shareText }).catch(() => undefined)
              return
            }
            try {
              await navigator.clipboard.writeText(shareText)
              announce(t('live.copied'))
            } catch {
              announce(t('live.copyFail'))
            }
          }}
        >
          <Share2 className="h-4 w-4" />
          {t('rec.share')}
        </Button>
      </div>
    </div>
  )
}
