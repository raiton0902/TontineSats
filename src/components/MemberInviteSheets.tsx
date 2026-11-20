import { Check, Copy, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CIRCLE, MEMBERS, ROUNDS } from '../lib/demo'
import { CONTRIBUTION, amountPrimary, initialsOf, shortNpub } from '../lib/format'
import type { MemberStatus } from '../lib/types'
import { useApp } from '../store/AppStore'
import { Button, CopyButton, Pill, Sheet } from './ui'

export function MemberSheet() {
  const {
    t,
    locale,
    session,
    memberOrder,
    closeMember,
    openPayment,
    announce,
    activeCircle,
    backendOnline,
  } = useApp()
  const navigate = useNavigate()

  if (memberOrder === null) return null

  const currentRound = activeCircle?.currentRound
  const apiMember =
    backendOnline && activeCircle
      ? activeCircle.members.find((m) => m.payoutOrder === memberOrder)
      : undefined
  const demoMember = !backendOnline ? MEMBERS.find((entry) => entry.order === memberOrder) : undefined

  const member = apiMember
    ? (() => {
        const contribution = currentRound
          ? activeCircle!.contributions.find(
              (c) => c.roundId === currentRound.id && c.payerNpub === apiMember.npub,
            )
          : undefined
        const isCurrentBeneficiary = currentRound?.beneficiaryNpub === apiMember.npub
        let status: MemberStatus = 'waiting'
        if (isCurrentBeneficiary) status = 'current'
        else if (contribution?.status === 'paid') status = 'paid'
        else if (contribution?.status === 'late') status = 'late'
        return {
          order: apiMember.payoutOrder,
          name: apiMember.displayName,
          initials: initialsOf(apiMember.displayName),
          status,
          npub: apiMember.npub,
          round: currentRound?.roundNumber ?? apiMember.payoutOrder,
          contributionId: contribution?.id,
          isSelf: session?.npub === apiMember.npub,
        }
      })()
    : demoMember
      ? { ...demoMember, isSelf: false, contributionId: undefined }
      : null

  if (!member) return null

  const circleName = activeCircle?.circle.name ?? CIRCLE.name
  const amountXof = activeCircle?.circle.amountXof ?? CONTRIBUTION

  const statusLabel =
    member.status === 'paid'
      ? t('dash.status.paid')
      : member.status === 'current'
        ? t('dash.status.current')
        : member.status === 'late'
          ? t('dash.status.late')
          : t('dash.status.waiting')

  const reminderText =
    member.status === 'late'
      ? t('mem.overdueReminderText', {
          amount: amountPrimary(amountXof, locale, 'xof'),
          circle: circleName,
          round: member.round,
        })
      : t('mem.reminderText', {
          amount: amountPrimary(amountXof, locale, 'xof'),
          circle: circleName,
          round: member.round,
        })

  const whatsappReminderUrl = `https://wa.me/?text=${encodeURIComponent(reminderText)}`

  const action = () => {
    if (member.status === 'paid') {
      closeMember()
      navigate(`/app/receipt/${member.contributionId ?? member.round}`)
      return
    }
    if (member.status === 'current' || member.isSelf) {
      closeMember()
      openPayment()
      return
    }
    navigator.clipboard?.writeText(reminderText).then(
      () => announce(t('live.reminder')),
      () => announce(t('live.copyFail')),
    )
  }

  return (
    <Sheet open={memberOrder !== null} onClose={closeMember} title={t('mem.title')}>
      <div className="mb-4 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-12 w-12 place-items-center rounded-full border border-border bg-secondary text-sm font-semibold"
        >
          {member.initials}
        </span>
        <div>
          <p className="text-[17px] font-semibold tracking-tight">{member.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            R{member.order} · {statusLabel}
          </p>
        </div>
      </div>

      <dl className="flex flex-col">
        <div className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-[12.5px]">
          <dt className="text-muted-foreground">{t('mem.order')}</dt>
          <dd className="font-medium">R{member.order}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-[12.5px]">
          <dt className="text-muted-foreground">{t('mem.status')}</dt>
          <dd>
            <Pill
              tone={
                member.status === 'paid'
                  ? 'success'
                  : member.status === 'current'
                    ? 'warning'
                    : member.status === 'late'
                      ? 'destructive'
                      : 'muted'
              }
            >
              {statusLabel}
            </Pill>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-2.5 text-[12.5px]">
          <dt className="text-muted-foreground">npub</dt>
          <dd className="flex items-center gap-1 font-mono text-[11px]">
            {shortNpub(member.npub)}
            <CopyButton value={member.npub} label={t('pass.copyNpub')} />
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-2">
        <Button fullWidth onClick={action}>
          {member.status === 'paid' ? (
            <>
              <Check className="h-4 w-4" />
              {t('mem.receipt')}
            </>
          ) : member.status === 'current' || member.isSelf ? (
            t('mem.pay')
          ) : (
            <>
              <Copy className="h-4 w-4" />
              {t('mem.reminder')}
            </>
          )}
        </Button>

        {(member.status === 'waiting' || member.status === 'late') && !member.isSelf && (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => window.open(whatsappReminderUrl, '_blank', 'noopener')}
          >
            <MessageCircle className="h-4 w-4" />
            {t('mem.whatsapp')}
          </Button>
        )}
      </div>

      {member.status === 'paid' && !activeCircle && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          {ROUNDS[member.round]?.beneficiary}
        </p>
      )}
    </Sheet>
  )
}

export function InviteSheet() {
  const { t, inviteOpen, closeInvite, announce, session, activeCircle } = useApp()
  const code = activeCircle?.circle.inviteCode ?? CIRCLE.inviteCode
  const circleName = activeCircle?.circle.name ?? CIRCLE.name
  const shareUrl = `${window.location.origin}/join/${code}`
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `${t('join.invited')} ${circleName} · ${shareUrl}`,
  )}`

  return (
    <Sheet open={inviteOpen} onClose={closeInvite} title={t('dash.inviteTitle')}>
      <p className="text-sm leading-relaxed text-muted-foreground">{t('dash.inviteBody')}</p>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-secondary px-3 py-2">
        <span className="font-mono text-[17px] font-semibold tracking-[0.18em]">{code}</span>
        <CopyButton value={code} label={t('dash.inviteCopy')} onCopied={() => announce(t('live.invite'))} />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Button variant="secondary" fullWidth onClick={() => window.open(whatsapp, '_blank', 'noopener')}>
          <MessageCircle className="h-4 w-4" />
          {t('dash.inviteWhatsapp')}
        </Button>
        <CopyButton
          value={shareUrl}
          label={t('common.copy')}
          variant="field"
          className="w-full"
          onCopied={() => announce(t('live.invite'))}
        />
      </div>
      {session?.mode === 'demo' && (
        <p className="mt-3 text-center text-[10.5px] text-muted-foreground">
          {t('landing.footnote')}
        </p>
      )}
    </Sheet>
  )
}
