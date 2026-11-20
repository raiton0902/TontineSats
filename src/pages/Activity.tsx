import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Zap } from 'lucide-react'
import { Calendar } from '../components/Calendar'
import {
  CONTRIBUTION,
  amountPrimary,
  dayLabel,
  isoOf,
  localeDate,
  monthLabel,
} from '../lib/format'
import { PAYOUT_DAYS, RECEIPTS, ROUNDS } from '../lib/demo'
import { useApp } from '../store/AppStore'
import { Button, cx } from '../components/ui'

function toIsoDate(ms: number) {
  const d = new Date(ms)
  return isoOf(d.getFullYear(), d.getMonth(), d.getDate())
}

export function ActivityPage() {
  const {
    t,
    locale,
    session,
    demo,
    updateDemo,
    openPayment,
    activeCircle,
    backendOnline,
  } = useApp()
  const navigate = useNavigate()
  const { year, month, day } = demo.calendar
  const selectedIso = day ? isoOf(year, month, day) : null
  const monthKey = isoOf(year, month, 1).slice(0, 7)
  const monthName = monthLabel(year, month, locale)
  const monthInline = monthName.charAt(0).toLowerCase() + monthName.slice(1)

  const isLive = Boolean(backendOnline && activeCircle && session)

  const liveReceipts = useMemo(() => {
    if (!isLive) return []
    const roundsMap = new Map(activeCircle!.rounds.map((r) => [r.id, r]))
    const membersMap = new Map(activeCircle!.members.map((m) => [m.npub, m.displayName]))
    return activeCircle!.contributions
      .filter((c) => c.status === 'paid' && c.paidAt)
      .map((c) => {
        const rnd = roundsMap.get(c.roundId)
        const benName = rnd ? (membersMap.get(rnd.beneficiaryNpub) ?? 'Membre') : 'Membre'
        const paidAt = c.paidAt ?? Date.now()
        return {
          id: c.id,
          round: rnd?.roundNumber ?? 1,
          iso: toIsoDate(paidAt),
          label: dayLabel(new Date(paidAt), locale, true),
          short: localeDate(new Date(paidAt), locale, { day: 'numeric', month: 'short' }),
          beneficiary: benName,
          amountXof: c.amountXof,
        }
      })
      .sort((a, b) => b.round - a.round)
  }, [isLive, activeCircle, locale])

  const offlineReceipts = useMemo(() => {
    const base = RECEIPTS.map((r) => ({ ...r, id: String(r.round), amountXof: CONTRIBUTION }))
    if (demo.paid) {
      base.unshift({
        id: '3',
        round: 3,
        iso: '2026-11-12',
        label: '12 nov. 2026',
        short: '12 nov.',
        beneficiary: 'Mariama Sow',
        amountXof: CONTRIBUTION,
      })
    }
    return base
  }, [demo.paid])

  const receipts = isLive ? liveReceipts : offlineReceipts

  const currentRound = isLive ? activeCircle!.currentRound : null
  const myDueContribution =
    isLive && currentRound
      ? activeCircle!.contributions.find(
          (c) =>
            c.roundId === currentRound.id &&
            c.payerNpub === session!.npub &&
            c.status !== 'paid',
        )
      : null

  const dueIso =
    isLive && currentRound ? toIsoDate(currentRound.dueAt) : '2026-11-12'

  const events = useMemo(() => {
    if (!isLive) return PAYOUT_DAYS
    const set = new Set<string>()
    for (const r of activeCircle!.rounds) {
      set.add(toIsoDate(r.dueAt))
    }
    for (const rec of liveReceipts) {
      set.add(rec.iso)
    }
    return set
  }, [isLive, activeCircle, liveReceipts])

  const visibleReceipts = selectedIso
    ? receipts.filter((receipt) => receipt.iso === selectedIso)
    : receipts.filter((receipt) => receipt.iso.startsWith(monthKey))

  const dueVisible = isLive
    ? Boolean(myDueContribution) &&
      dueIso.startsWith(monthKey) &&
      (!selectedIso || selectedIso === dueIso)
    : !demo.paid &&
      !demo.joined &&
      monthKey === '2026-11' &&
      (!selectedIso || selectedIso === '2026-11-12')

  const emptyDay = Boolean(selectedIso) && visibleReceipts.length === 0 && !dueVisible
  const emptyMonth =
    (isLive ? true : !demo.joined) &&
    !selectedIso &&
    visibleReceipts.length === 0 &&
    !dueVisible

  const dueIsLate = isLive && myDueContribution?.status === 'late'
  const dueRoundNum = isLive ? (currentRound?.roundNumber ?? 1) : 3
  const dueAmount = isLive ? activeCircle!.circle.amountXof : CONTRIBUTION

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-[22px] font-bold tracking-[-0.02em] sm:text-[26px]">{t('act.title')}</h1>
      </header>

      {!isLive && demo.joined ? (
        <div className="glass-panel rounded-[18px] p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
            <Check className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold">{t('act.emptyJoinedTitle')}</p>
          <p className="mx-auto mt-1 max-w-[300px] text-[12px] leading-relaxed text-muted-foreground">
            {t('act.emptyJoinedBody')}
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/app')}>
            {t('act.emptyJoinedCta')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[380px_1fr] lg:items-start lg:gap-6">
          <div className="lg:sticky lg:top-8">
            <Calendar
              year={year}
              month={month}
              day={day}
              events={events}
              dueIso={dueIso}
              locale={locale}
              onSelect={(value) =>
                updateDemo({
                  calendar: { ...demo.calendar, day: day === value ? null : value },
                })
              }
              onMonth={(delta) => {
                const next = new Date(year, month + delta, 1)
                updateDemo({
                  calendar: { year: next.getFullYear(), month: next.getMonth(), day: null },
                })
              }}
              onJump={(nextYear, nextMonth) =>
                updateDemo({
                  calendar: { year: nextYear, month: nextMonth, day: null },
                })
              }
            />
            <p className="mt-2 text-center text-[10.5px] leading-relaxed text-muted-foreground">
              {selectedIso
                ? t('act.filteredHint', { date: dayLabel(new Date(year, month, day ?? 1), locale) })
                : t('act.filterHint')}
            </p>
            {selectedIso && (
              <button
                type="button"
                onClick={() => updateDemo({ calendar: { ...demo.calendar, day: null } })}
                className="mx-auto mt-1 block min-h-11 text-[11.5px] font-medium text-primary underline-offset-2 hover:underline"
              >
                {t('act.clear')}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-5">
            {dueVisible && (
              <section aria-labelledby="due-title">
                <h2 id="due-title" className="mb-3 text-[14px] font-semibold tracking-tight">
                  {t('act.due')}
                </h2>
                <button
                  type="button"
                  onClick={openPayment}
                  className={cx(
                    'grid w-full grid-cols-[36px_1fr_auto] items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left transition active:scale-[0.995] hover:brightness-[1.03]',
                    dueIsLate ? 'border border-destructive/40 bg-destructive/10' : 'glass-flat',
                  )}
                >
                  <span
                    className={cx(
                      'grid h-9 w-9 place-items-center rounded-[10px]',
                      dueIsLate ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning',
                    )}
                  >
                    <Zap className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium">
                      {t('act.contributionTitle', { round: dueRoundNum })}
                    </span>
                    <span
                      className={cx(
                        'block text-[11px]',
                        dueIsLate ? 'text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {dueIsLate ? t('act.lateSub') : t('act.dueSub')}
                    </span>
                  </span>
                  <span className="text-[13px] font-semibold tabular">
                    {amountPrimary(dueAmount, locale, 'xof')}
                  </span>
                </button>
              </section>
            )}

            {visibleReceipts.length > 0 && (
              <section aria-labelledby="history-title">
                <h2 id="history-title" className="mb-3 text-[14px] font-semibold tracking-tight">
                  {t('act.history')}
                </h2>
                <ul className="flex flex-col gap-2">
                  {visibleReceipts.map((receipt) => (
                    <li key={receipt.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/app/receipt/${receipt.id}`)}
                        className="glass-flat grid w-full grid-cols-[36px_1fr_auto] items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left transition active:scale-[0.995] hover:brightness-[1.03]"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-success/10 text-success">
                          <Check className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">
                            {t('act.receiptTitle', { round: receipt.round })}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {receipt.label} ·{' '}
                            {isLive
                              ? receipt.beneficiary
                              : ROUNDS[receipt.round]?.beneficiary ?? receipt.beneficiary}
                          </span>
                        </span>
                        <span className="text-[13px] font-semibold text-success tabular">
                          {amountPrimary(receipt.amountXof, locale, 'xof')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  {t('act.note')}
                </p>
              </section>
            )}

            {emptyDay && (
              <div className={cx('glass-panel rounded-[16px] p-8 text-center')}>
                <p className="text-[12.5px] text-muted-foreground">{t('act.emptyDay')}</p>
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => updateDemo({ calendar: { ...demo.calendar, day: null } })}
                >
                  {t('act.clear')}
                </Button>
              </div>
            )}

            {emptyMonth && (
              <div className="glass-panel rounded-[16px] p-8 text-center">
                <p className="text-sm font-semibold">{t('act.emptyMonthTitle')}</p>
                <p className="mx-auto mt-1 max-w-[280px] text-[12px] leading-relaxed text-muted-foreground">
                  {t('act.emptyMonthBody', { month: monthInline })}
                </p>
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => {
                    const targetDate = isLive && currentRound ? new Date(currentRound.dueAt) : new Date(2026, 10, 1)
                    updateDemo({
                      calendar: {
                        year: targetDate.getFullYear(),
                        month: targetDate.getMonth(),
                        day: null,
                      },
                    })
                  }}
                >
                  {t('act.emptyMonthCta')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
