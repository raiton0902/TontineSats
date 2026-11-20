import { useNavigate } from 'react-router-dom'
import { Check, Share2, ShieldCheck } from 'lucide-react'
import { RECEIPTS, ROUNDS } from '../lib/demo'
import { CONTRIBUTION, amountPrimary, dayLabel, initialsOf, shortNpub } from '../lib/format'
import { useApp } from '../store/AppStore'
import { useProgress } from '../hooks/useProgress'
import { Avatar, Button, CopyButton, Pill } from '../components/ui'

const RADIUS = 92
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function Passport() {
  const {
    t,
    locale,
    session,
    persona,
    demo,
    announce,
    backendOnline,
    reputation,
    loadingReputation,
  } = useApp()
  const navigate = useNavigate()

  const isLive = Boolean(backendOnline && reputation)
  const onTime = isLive ? reputation!.onTimeRate : persona.stats.onTime
  const progress = useProgress(700, onTime || 1)

  const offset = CIRCUMFERENCE - (onTime / 100) * CIRCUMFERENCE * (onTime > 0 ? progress : 0)
  const shownOnTime = Math.round(onTime * (onTime > 0 ? progress : 1))
  const initials = initialsOf(session?.name ?? '')

  const receipts = isLive
    ? reputation!.receipts.map((r) => ({
        id: r.id,
        round: r.roundNumber,
        label: `${r.circleName} · ${dayLabel(new Date(r.paidAt), locale)}`,
        verified: r.verified,
      }))
    : (demo.paid
        ? [
            { id: '3', round: 3, label: '12 nov. 2026', verified: true },
            ...RECEIPTS.map((receipt) => ({
              id: String(receipt.round),
              round: receipt.round,
              label: receipt.label,
              verified: true,
            })),
          ]
        : RECEIPTS.map((receipt) => ({
            id: String(receipt.round),
            round: receipt.round,
            label: receipt.label,
            verified: true,
          })))

  const totalContributions = isLive ? reputation!.totalPaidRounds : persona.stats.contributions
  const totalReceipts = isLive ? reputation!.receipts.length : persona.stats.receipts
  const totalCircles = isLive ? reputation!.circlesCount : persona.stats.circles

  const share = async () => {
    const text = `${session?.name} · ${onTime} % ${t('pass.onTime')} · ${session?.npub}`
    if (navigator.share) {
      await navigator.share({ text }).catch(() => undefined)
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      announce(t('live.copied'))
    } catch {
      announce(t('live.copyFail'))
    }
  }

  if (!session) return null

  return (
    <div>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold tracking-[-0.02em] sm:text-[26px]">{t('pass.title')}</h1>
        <Button variant="secondary" size="sm" onClick={share}>
          <Share2 className="h-4 w-4" />
          {t('pass.share')}
        </Button>
      </header>

      {backendOnline && loadingReputation && !reputation ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="skeleton h-[420px] rounded-[20px]" />
          <div className="skeleton h-[320px] rounded-[20px]" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <section className="glass-panel rounded-[20px] p-5">
            <div className="flex items-center gap-3">
              <Avatar initials={initials} size="lg" accent />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[17px] font-semibold tracking-tight">{session.name}</h2>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {shortNpub(session.npub)}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="inline-flex rotate-[-6deg] items-center gap-1 rounded-[7px] border-2 border-success px-2 py-1 text-[9.5px] font-bold tracking-[0.06em] text-success uppercase"
              >
                <ShieldCheck className="h-3 w-3" />
                {t('pass.verified')}
              </span>
              <CopyButton value={session.npub} label={t('pass.copyNpub')} />
            </div>

            <div className="relative mx-auto mt-4 aspect-square w-full max-w-[250px]">
              <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="12" />
                <circle
                  cx="110"
                  cy="110"
                  r={RADIUS}
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth="12"
                  strokeLinecap="butt"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[38px] leading-none font-bold tracking-[-0.03em] tabular">
                  {shownOnTime} %
                </p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">{t('pass.onTime')}</p>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
              {[
                [t('pass.contributions'), totalContributions],
                [t('pass.receipts'), totalReceipts],
                [t('pass.circles'), totalCircles],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-[10.5px] leading-tight text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 text-[18px] font-bold tracking-[-0.02em] tabular">{value}</dd>
                </div>
              ))}
            </dl>

            {session.mode === 'demo' && (
              <p className="mt-3 text-[10.5px] text-muted-foreground">{t('landing.footnote')}</p>
            )}
          </section>

          <section className="glass-panel rounded-[20px] p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-[14px] font-semibold tracking-tight">{t('pass.proofs')}</h2>
              <Pill tone="success">{t('pass.portable')}</Pill>
            </div>

            {receipts.length === 0 ? (
              <p className="py-6 text-center text-xs leading-relaxed text-muted-foreground">
                {t('pass.emptyProofs')}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {receipts.map((receipt) => (
                  <li key={receipt.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/app/receipt/${receipt.id}`)}
                      className="glass-flat grid w-full grid-cols-[36px_1fr_auto] items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left transition hover:brightness-[1.03] active:scale-[0.995]"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-success/10 text-success">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium">
                          {t('act.receiptTitle', { round: receipt.round })}
                        </span>
                        <span className="block truncate font-mono text-[10.5px] text-muted-foreground">
                          kind 30078 · {receipt.label}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-success">
                        <Check className="h-3 w-3" />
                        {t('common.signed')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{t('pass.note')}</p>
            {!isLive && (
              <p className="mt-2 text-[10.5px] text-muted-foreground">
                {ROUNDS[3].beneficiary} · {amountPrimary(CONTRIBUTION, locale, 'xof')}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
