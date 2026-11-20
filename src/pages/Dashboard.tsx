import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  Clock,
  Eye,
  EyeOff,
  Play,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react'
import { api } from '../lib/api'
import { CIRCLE, MEMBERS, PERSONAS, ROUNDS } from '../lib/demo'
import {
  CONTRIBUTION,
  amountPrimary,
  amountValue,
  currencyUnit,
  dayLabel,
  initialsOf,
  satsLabel,
  shortNpub,
} from '../lib/format'
import type { Member, PersonaId } from '../lib/types'
import { useApp } from '../store/AppStore'
import { PotRing } from '../components/PotRing'
import { useProgress } from '../hooks/useProgress'
import { Avatar, Button, CopyButton, Pill, cx } from '../components/ui'

function DashboardSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <div className="skeleton h-20 w-full rounded-[22px]" />
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="skeleton h-[380px] w-full rounded-[24px]" />
        <div className="flex flex-col gap-4">
          <div className="skeleton h-44 w-full rounded-[18px]" />
          <div className="skeleton h-32 w-full rounded-[18px]" />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="skeleton h-16 w-full rounded-[12px]" />
        <div className="skeleton h-16 w-full rounded-[12px]" />
      </div>
    </div>
  )
}

export function Dashboard() {
  const {
    t,
    locale,
    session,
    settings,
    persona,
    demo,
    rates,
    backendOnline,
    circles,
    activeCircle,
    loadingCircle,
    circleError,
    reputation,
    openPayment,
    openInvite,
    openMember,
    openCreateCircle,
    openStartCircle,
    selectCircle,
    refreshData,
    loadSandboxDemo,
    switchPersona,
    announce,
  } = useApp()
  const navigate = useNavigate()
  const [hidden, setHidden] = useState(false)
  const [judgeBusy, setJudgeBusy] = useState(false)

  const isLive = Boolean(backendOnline && activeCircle)
  const currentRound = isLive ? activeCircle!.currentRound : null
  const totalMembers = isLive ? activeCircle!.members.length : MEMBERS.length
  const contributionAmount = isLive ? activeCircle!.circle.amountXof : CONTRIBUTION
  const potAmount = contributionAmount * Math.max(1, totalMembers)
  const satsPerXof = currentRound?.exchangeRateSatsPerXof ?? rates?.satsPerXof

  const roundContributions =
    isLive && currentRound
      ? activeCircle!.contributions.filter((c) => c.roundId === currentRound.id)
      : []

  // Confirmed count: beneficiary + paid payers so ring completes cleanly at N/N
  const paidPayersCount = roundContributions.filter((c) => c.status === 'paid').length
  const confirmed = isLive
    ? currentRound
      ? Math.min(totalMembers, paidPayersCount + 1)
      : 0
    : demo.paid
      ? 6
      : demo.confirmed

  const progress = useProgress(700, confirmed || 1)
  const animatedPot = potAmount * (confirmed > 0 ? progress : 1)

  if (!session) return null

  if (backendOnline && loadingCircle && !activeCircle) {
    return (
      <div>
        <h1 className="sr-only">{t('nav.dashboard')}</h1>
        <DashboardSkeleton />
      </div>
    )
  }

  if (backendOnline && circleError && !activeCircle) {
    return (
      <div className="glass-panel rounded-[20px] p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
        <h1 className="mt-3 text-base font-semibold text-destructive">{t('dash.errorTitle')}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{circleError}</p>
        <Button className="mt-4" onClick={() => void refreshData()}>
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  if (backendOnline && !loadingCircle && !activeCircle) {
    return (
      <div className="glass-panel mx-auto max-w-[540px] rounded-[22px] p-6 text-center sm:p-8">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Users className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-[20px] font-bold tracking-tight">{t('dash.emptyTitle')}</h1>
        <p className="mx-auto mt-1.5 max-w-[360px] text-sm leading-relaxed text-muted-foreground">
          {t('dash.emptyBody')}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={openCreateCircle}>
            <Plus className="h-4 w-4" />
            {t('dash.emptyCreate')}
          </Button>
          <Button
            variant="secondary"
            disabled={judgeBusy}
            onClick={async () => {
              setJudgeBusy(true)
              try {
                await loadSandboxDemo(false)
              } finally {
                setJudgeBusy(false)
              }
            }}
          >
            <Play className="h-4 w-4" />
            {t('dash.emptyLoadDemo')}
          </Button>
        </div>
      </div>
    )
  }

  const beneficiaryMember =
    isLive && currentRound
      ? activeCircle!.members.find((m) => m.npub === currentRound.beneficiaryNpub)
      : null
  const beneficiary = beneficiaryMember?.displayName ?? ROUNDS[3].beneficiary
  const displayRound = currentRound?.roundNumber ?? 3
  const totalRounds = isLive ? Math.max(1, totalMembers) : CIRCLE.rounds

  const myContribution =
    isLive && currentRound
      ? roundContributions.find((c) => c.payerNpub === session.npub) ?? null
      : null
  const isSelfBeneficiary = isLive && currentRound?.beneficiaryNpub === session.npub
  const isPaid = isLive ? myContribution?.status === 'paid' : demo.paid
  const isLate = isLive ? myContribution?.status === 'late' : false

  const displayCurrency = session.mode === 'demo' ? persona.currency : 'xof'
  const money = (value: number) =>
    hidden ? '••••' : amountPrimary(value, locale, displayCurrency)

  const onTimePct = isLive ? (reputation?.onTimeRate ?? 100) : persona.stats.onTime
  const receiptsCount = isLive ? (reputation?.totalPaidRounds ?? 0) : persona.stats.receipts
  const memberSinceText = isLive
    ? dayLabel(new Date(session.createdAt || Date.now()), locale)
    : ROUNDS[2].date

  const rotationMembers: Member[] = isLive
    ? activeCircle!.members.map((m) => {
        const c = roundContributions.find((entry) => entry.payerNpub === m.npub)
        const isCurrent = currentRound?.beneficiaryNpub === m.npub
        let status: Member['status'] = 'waiting'
        if (isCurrent) status = 'current'
        else if (c?.status === 'paid') status = 'paid'
        else if (c?.status === 'late') status = 'late'
        return {
          order: m.payoutOrder,
          name: m.displayName,
          initials: initialsOf(m.displayName),
          status,
          npub: m.npub,
          round: currentRound?.roundNumber ?? m.payoutOrder,
          contributionId: c?.id,
        }
      })
    : MEMBERS

  const frequencyLabel =
    activeCircle?.circle.frequency === 'weekly'
      ? t('dash.perWeek')
      : activeCircle?.circle.frequency === 'demo_5min'
        ? t('dash.per5min')
        : t('dash.perMonth')

  const goPay = () => {
    if (isPaid) {
      navigate(`/app/receipt/${myContribution?.id ?? displayRound}`)
    } else {
      openPayment()
    }
  }

  const runJudgeAutoPay = async () => {
    if (!currentRound || !activeCircle) return
    setJudgeBusy(true)
    try {
      await api.triggerNwc(currentRound.id, {})
      await refreshData(activeCircle.circle.id)
      announce(t('live.paid'))
    } finally {
      setJudgeBusy(false)
    }
  }

  const runJudgeOverdue = async () => {
    if (!currentRound || !activeCircle) return
    setJudgeBusy(true)
    try {
      await api.markRoundOverdue(currentRound.id)
      await refreshData(activeCircle.circle.id)
    } finally {
      setJudgeBusy(false)
    }
  }

  const isOrganizer = isLive && activeCircle!.circle.organizerNpub === session.npub
  const isRecruiting = isLive && activeCircle!.circle.status === 'recruiting'
  const isCompleted = isLive && activeCircle!.circle.status === 'completed'

  return (
    <div>
      <h1 className="sr-only">{isLive ? activeCircle!.circle.name : CIRCLE.name}</h1>

      {backendOnline && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {circles.map((circle) => (
              <button
                key={circle.id}
                type="button"
                onClick={() => void selectCircle(circle.id)}
                className={cx(
                  'min-h-11 rounded-full border px-3.5 text-xs font-semibold transition',
                  circle.id === activeCircle?.circle.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'glass-flat text-foreground hover:bg-secondary',
                )}
              >
                {circle.name}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={openCreateCircle}>
            <Plus className="h-4 w-4" />
            {t('dash.newCircle')}
          </Button>
        </div>
      )}

      {(session.mode === 'demo' || settings.demoMode) && (
        <section
          aria-label={t('dash.judgeBar')}
          className="glass-panel mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[18px] p-3"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              {t('dash.judgeBar')}
            </span>
            {(Object.values(PERSONAS) as Array<(typeof PERSONAS)[PersonaId]>).map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={persona.id === entry.id}
                onClick={() => void switchPersona(entry.id)}
                className={cx(
                  'min-h-11 rounded-full border px-3 text-xs font-medium transition',
                  persona.id === entry.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary',
                )}
              >
                {entry.name.split(' ')[0]} · {entry.city}
              </button>
            ))}
          </div>

          {isLive && currentRound && currentRound.status !== 'completed' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={judgeBusy}
                onClick={() => void runJudgeAutoPay()}
              >
                <Zap className="h-3.5 w-3.5" />
                {t('dash.judgeAutoPay')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={judgeBusy}
                onClick={() => void runJudgeOverdue()}
              >
                <Clock className="h-3.5 w-3.5" />
                {t('dash.judgeOverdue')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={judgeBusy}
                onClick={() => void loadSandboxDemo(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t('dash.judgeReset')}
              </Button>
            </div>
          )}
        </section>
      )}

      <section
        aria-label={t('dash.memberCard')}
        className="glass-panel rounded-[22px] p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar initials={initialsOf(session.name)} size="lg" accent />
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold tracking-tight">{session.name}</p>
              <div className="flex items-center gap-0.5">
                <p className="truncate font-mono text-[10.5px] text-muted-foreground">
                  {shortNpub(session.npub)}
                </p>
                <CopyButton value={session.npub} label={t('pass.copyNpub')} />
              </div>
              <p className="text-[10.5px] text-muted-foreground">
                {t('dash.memberSince', { date: memberSinceText })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
            <Pill tone="success">
              <ShieldCheck className="h-3 w-3" />
              {t('pass.verified')}
            </Pill>
            <Pill tone="muted">{t('dash.onTime', { pct: onTimePct })}</Pill>
            <Pill tone="muted">{t('dash.receiptsShort', { n: receiptsCount })}</Pill>
            <Button variant="secondary" className="rounded-full" onClick={openInvite}>
              <Share2 className="h-4 w-4" />
              {t('dash.invite')}
            </Button>
          </div>
        </div>
      </section>

      {isRecruiting && (
        <section className="glass-panel mt-4 flex flex-col gap-3 rounded-[18px] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">{t('dash.recruitingTitle')}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('dash.recruitingBody', { n: totalMembers })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={openInvite}>
              <Share2 className="h-4 w-4" />
              {t('dash.invite')}
            </Button>
            {isOrganizer && (
              <Button onClick={openStartCircle} disabled={totalMembers < 2}>
                <Play className="h-4 w-4" />
                {t('dash.startCircle')}
              </Button>
            )}
          </div>
        </section>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <section
          aria-label={t('dash.tourShort', { round: displayRound, total: totalRounds })}
          className="relative overflow-hidden rounded-[24px] bg-[var(--hero-surface)] p-4 text-[var(--hero-ink)] ring-1 ring-[color-mix(in_srgb,var(--hero-ink)_18%,transparent)] sm:p-5"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--hero-ink)_16%,transparent),transparent_65%)]"
          />
          <div className="relative flex items-center justify-between gap-3">
            <p className="text-[12px] font-medium text-[color-mix(in_srgb,var(--hero-ink)_75%,transparent)] tabular">
              {t('dash.tourShort', { round: displayRound, total: totalRounds })}
            </p>
            <button
              type="button"
              aria-label={hidden ? t('action.showAmounts') : t('action.hideAmounts')}
              onClick={() => setHidden((value) => !value)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[var(--hero-ink)] transition hover:bg-[color-mix(in_srgb,var(--hero-ink)_12%,transparent)] active:scale-95"
            >
              {hidden ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>

          <div className="relative mt-1 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-[color-mix(in_srgb,var(--hero-ink)_18%,transparent)] bg-[color-mix(in_srgb,var(--hero-ink)_10%,transparent)] px-2.5 py-1.5 text-[11px] text-[color-mix(in_srgb,var(--hero-ink)_80%,transparent)] tabular">
              {money(contributionAmount)} {frequencyLabel}
            </span>
            <span className="rounded-full border border-[color-mix(in_srgb,var(--hero-ink)_18%,transparent)] bg-[color-mix(in_srgb,var(--hero-ink)_10%,transparent)] px-2.5 py-1.5 text-[11px] text-[color-mix(in_srgb,var(--hero-ink)_80%,transparent)]">
              {t('dash.members', { n: totalMembers })}
            </span>
          </div>

          <div className="relative mt-1">
            <PotRing confirmed={confirmed} total={totalMembers} progress={progress}>
              <p className="flex items-baseline justify-center gap-1.5">
                <span className="text-[30px] leading-none font-bold tracking-[-0.03em] tabular sm:text-[34px]">
                  {hidden ? '••••' : amountValue(animatedPot, locale, displayCurrency)}
                </span>
                {!hidden && (
                  <span className="text-[12px] font-semibold text-[color-mix(in_srgb,var(--hero-ink)_75%,transparent)]">
                    {currencyUnit(displayCurrency)}
                  </span>
                )}
              </p>
              <p className="mt-1 text-[12px] text-[color-mix(in_srgb,var(--hero-ink)_70%,transparent)] tabular">
                {hidden ? '' : satsLabel(potAmount, locale, satsPerXof)}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--hero-ink)_10%,transparent)] px-2.5 py-1.5 text-[10.5px] font-medium text-[color-mix(in_srgb,var(--hero-ink)_90%,transparent)]">
                <Users className="h-3 w-3" />
                {t('dash.receives', { name: beneficiary })}
              </p>
            </PotRing>
          </div>

          <div className="relative mt-1 flex items-baseline justify-center gap-1.5 border-t border-[color-mix(in_srgb,var(--hero-ink)_10%,transparent)] pt-3">
            <span className="text-[13px] font-semibold tabular">{confirmed}</span>
            <span className="text-[11.5px] text-[color-mix(in_srgb,var(--hero-ink)_70%,transparent)]">
              / {totalMembers}
            </span>
            <span className="text-[11.5px] text-[color-mix(in_srgb,var(--hero-ink)_70%,transparent)]">
              {t('dash.confirmed')}
            </span>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="glass-panel rounded-[18px] p-4">
            {isCompleted ? (
              <div className="py-2">
                <Pill tone="success">{t('dash.completedTitle')}</Pill>
                <p className="mt-2 text-sm font-semibold">{t('dash.completedTitle')}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t('dash.completedBody')}
                </p>
              </div>
            ) : isSelfBeneficiary ? (
              <div className="py-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-[12px] font-medium text-muted-foreground">
                      {t('dash.tourShort', { round: displayRound, total: totalRounds })}
                    </h2>
                    <p className="mt-0.5 text-[24px] font-bold tracking-[-0.02em] tabular">
                      {money(potAmount)}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground tabular">
                      {hidden ? '' : satsLabel(potAmount, locale, satsPerXof)}
                    </p>
                  </div>
                  <Pill tone="success">{t('dash.status.current')}</Pill>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {t('dash.beneficiaryBanner')}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-[12px] font-medium text-muted-foreground">
                      {isPaid ? t('dash.paidTitle') : t('dash.yourContribution')}
                    </h2>
                    <p className="mt-0.5 text-[24px] font-bold tracking-[-0.02em] tabular">
                      {money(contributionAmount)}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground tabular">
                      {hidden ? '' : satsLabel(contributionAmount, locale, satsPerXof)}
                    </p>
                  </div>
                  <Pill tone={isPaid ? 'success' : isLate ? 'destructive' : 'warning'}>
                    {isPaid
                      ? t('dash.status.paid')
                      : isLate
                        ? t('dash.status.late')
                        : t('dash.today')}
                  </Pill>
                </div>
                <p className="mt-2 text-[12px] text-muted-foreground">
                  {isPaid
                    ? myContribution?.paidAt
                      ? t('dash.paidMetaAt', {
                          date: dayLabel(new Date(myContribution.paidAt), locale),
                        })
                      : t('dash.paidMeta')
                    : isLive && currentRound
                      ? t('dash.dueDate', {
                          date: dayLabel(new Date(currentRound.dueAt), locale),
                        })
                      : t('dash.dueToday')}
                </p>
                {!isRecruiting && (
                  <Button fullWidth className="mt-3" onClick={goPay}>
                    {isPaid ? (
                      <>
                        <Check className="h-4 w-4" />
                        {t('dash.viewReceipt')}
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        {t('dash.payNow', { amount: money(contributionAmount) })}
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </section>

          <section className="glass-panel rounded-[18px] p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-semibold">{t('dash.progress')}</h2>
              <span className="text-[11.5px] text-muted-foreground tabular">
                {confirmed} / {totalMembers}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={totalMembers}
              aria-valuenow={confirmed}
              aria-label={t('dash.progress')}
              className="mt-3 grid gap-1"
              style={{ gridTemplateColumns: `repeat(${totalMembers}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: totalMembers }, (_, index) => (
                <span
                  key={index}
                  className={cx(
                    'h-1.5 rounded-full transition-colors duration-200',
                    index < confirmed
                      ? 'bg-success'
                      : 'bg-[color-mix(in_srgb,var(--foreground)_14%,transparent)]',
                  )}
                />
              ))}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
              {t('dash.footnote')}
            </p>
          </section>
        </div>
      </div>

      <section className="mt-6" aria-labelledby="rotation-title">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="rotation-title" className="text-[14px] font-semibold tracking-tight">
            {t('dash.rotation')}
          </h2>
          <span className="text-[12px] text-muted-foreground">
            {t('dash.members', { n: rotationMembers.length })}
          </span>
        </div>

        <ul className="grid gap-2 sm:grid-cols-2">
          {rotationMembers.map((member) => {
            const status =
              member.status === 'paid'
                ? t('dash.status.paid')
                : member.status === 'current'
                  ? t('dash.status.current')
                  : member.status === 'late'
                    ? t('dash.status.late')
                    : t('dash.status.waiting')

            const sub =
              member.status === 'paid'
                ? isLive
                  ? t('dash.sub.paidDate', {
                      date: dayLabel(
                        new Date(
                          roundContributions.find((c) => c.payerNpub === member.npub)?.paidAt ??
                            Date.now(),
                        ),
                        locale,
                      ),
                    })
                  : t('dash.sub.paid')
                : member.status === 'current'
                  ? t('dash.sub.current', { amount: money(potAmount) })
                  : member.status === 'late'
                    ? t('dash.sub.late')
                    : isLive
                      ? t('dash.sub.waitingDate')
                      : t('dash.sub.waiting')

            const tone =
              member.status === 'paid'
                ? 'success'
                : member.status === 'current'
                  ? 'warning'
                  : member.status === 'late'
                    ? 'destructive'
                    : 'muted'

            return (
              <li key={member.order}>
                <button
                  type="button"
                  onClick={() => openMember(member.order)}
                  aria-label={`${member.name}, R${member.order}, ${status}`}
                  className={cx(
                    'grid w-full grid-cols-[26px_40px_1fr_auto] items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left transition active:scale-[0.995]',
                    member.status === 'current'
                      ? 'border border-warning/40 bg-warning/10'
                      : member.status === 'late'
                        ? 'border border-destructive/40 bg-destructive/10'
                        : 'glass-flat hover:brightness-[1.03]',
                  )}
                >
                  <span className="text-[11px] font-semibold text-muted-foreground tabular">
                    R{member.order}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cx(
                      'grid h-10 w-10 place-items-center rounded-full border text-[11px] font-semibold',
                      member.status === 'current'
                        ? 'border-transparent bg-primary text-primary-foreground'
                        : 'border-border bg-secondary text-foreground',
                    )}
                  >
                    {member.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium">{member.name}</span>
                    <span
                      className={cx(
                        'block truncate text-[11.5px] tabular',
                        member.status === 'current'
                          ? 'text-warning'
                          : member.status === 'late'
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                      )}
                    >
                      {sub}
                    </span>
                  </span>
                  <Pill tone={tone}>
                    {member.status === 'paid' && <Check className="h-3 w-3" />}
                    {status}
                  </Pill>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
