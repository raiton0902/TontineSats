import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Check, Users } from 'lucide-react'
import { ApiOfflineError, api } from '../lib/api'
import { CIRCLE } from '../lib/demo'
import { CONTRIBUTION, xof } from '../lib/format'
import type { ApiCircleDetail } from '../lib/types'
import { useApp } from '../store/AppStore'
import { BrandMark, Button, CopyButton, Spinner, cx } from '../components/ui'

export function Join() {
  const { t, locale, session, demo, updateDemo, announce, refreshData } = useApp()
  const navigate = useNavigate()
  const { code } = useParams()
  const normalizedCode = (code ?? '').trim().toUpperCase()
  const [preview, setPreview] = useState<ApiCircleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [offlineFallback, setOfflineFallback] = useState(false)
  const [busy, setBusy] = useState(false)
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .getCircleByInvite(normalizedCode)
      .then((res) => {
        if (!cancelled) {
          setPreview(res)
          setOfflineFallback(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err instanceof ApiOfflineError) {
            setOfflineFallback(true)
          }
          setPreview(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [normalizedCode])

  const validOffline = offlineFallback && normalizedCode === CIRCLE.inviteCode
  const valid = Boolean(preview) || validOffline
  const next = `/join/${normalizedCode || CIRCLE.inviteCode}`

  if (loading) {
    return (
      <div className="app-canvas grid min-h-dvh place-items-center px-4">
        <div className="glass-panel w-full max-w-[440px] rounded-[20px] p-6">
          <div className="skeleton h-44 w-full rounded-[16px]" />
        </div>
      </div>
    )
  }

  if (!valid) {
    return (
      <div className="app-canvas grid min-h-dvh place-items-center px-4">
        <div className="glass-panel w-full max-w-[440px] rounded-[20px] p-6 text-center">
          <BrandMark className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-4 text-sm font-semibold">{t('join.invalid')}</p>
          <Link
            to="/"
            className="mt-3 inline-flex min-h-11 items-center text-[12.5px] text-primary underline-offset-2 hover:underline"
          >
            {t('common.back')}
          </Link>
        </div>
      </div>
    )
  }

  const circleName = preview?.circle.name ?? CIRCLE.name
  const inviteCode = preview?.circle.inviteCode ?? CIRCLE.inviteCode
  const amountXof = preview?.circle.amountXof ?? CONTRIBUTION
  const memberCount = preview?.members.length ?? CIRCLE.rounds
  const roundNum = preview?.currentRound?.roundNumber ?? CIRCLE.round
  const alreadyMember = Boolean(
    preview && session && preview.members.some((m) => m.npub === session.npub),
  )
  const joined = alreadyMember || (!preview && demo.joined)

  const handleJoin = async () => {
    if (!session) return
    if (!preview) {
      updateDemo({ joined: true })
      announce(t('live.joined'))
      navigate('/app/activity')
      return
    }
    setBusy(true)
    setJoinError('')
    try {
      await api.joinCircle(inviteCode, {
        memberNpub: session.npub,
        displayName: session.name,
        lightningAddress: session.lightningAddress,
        nwcUri: session.nwc,
      })
      await refreshData(preview.circle.id)
      announce(t('live.joined'))
      navigate('/app')
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-canvas grid min-h-dvh place-items-center px-4 py-8">
      <div className="w-full max-w-[440px]">
        <Link to="/" className="mb-5 flex items-center justify-center gap-2 text-sm font-semibold">
          <BrandMark className="h-7 w-7 text-primary" />
          {t('common.app')}
        </Link>

        <div className="glass-panel rounded-[20px] p-6">
          <p className="text-[11.5px] text-muted-foreground">{t('join.invited')}</p>
          <h1 className="mt-1 text-[24px] font-bold tracking-[-0.02em]">{circleName}</h1>
          <p className="mt-1 text-[12px] text-muted-foreground tabular">
            {t('join.meta', {
              amount: xof(amountXof, locale),
              members: memberCount,
              round: roundNum,
              total: Math.max(1, memberCount),
            })}
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border bg-secondary px-3 py-2">
            <span className="font-mono text-[16px] font-semibold tracking-[0.16em]">
              {inviteCode}
            </span>
            <span className="ml-auto flex items-center gap-1 text-[10.5px] text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {t('dash.members', { n: memberCount })}
            </span>
            <CopyButton
              value={inviteCode}
              label={t('dash.inviteCopy')}
              onCopied={() => announce(t('live.invite'))}
            />
          </div>

          {joinError && (
            <p role="alert" className="mt-3 text-xs font-medium text-destructive">
              {joinError}
            </p>
          )}

          {joined ? (
            <div className="mt-5 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-success/10 text-success">
                <Check className="h-5 w-5" />
              </span>
              <p className="mt-2 text-[13px] font-medium">{t('join.joined', { circle: circleName })}</p>
              <Button fullWidth className="mt-4" onClick={() => navigate('/app')}>
                {t('act.emptyJoinedCta')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : session ? (
            <Button
              fullWidth
              size="lg"
              className="mt-5"
              disabled={busy}
              onClick={() => void handleJoin()}
            >
              {busy ? <Spinner /> : null}
              {t('join.join')}
            </Button>
          ) : (
            <div className="mt-5 flex flex-col gap-2">
              <Button
                fullWidth
                size="lg"
                onClick={() => navigate(`/auth?mode=create&next=${encodeURIComponent(next)}`)}
              >
                {t('landing.create')}
              </Button>
              <Link
                to={`/auth?mode=import&next=${encodeURIComponent(next)}`}
                className="inline-flex min-h-11 items-center justify-center text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
              >
                {t('landing.import')}
              </Link>
            </div>
          )}

          <p className={cx('mt-4 text-center text-[10.5px] leading-relaxed text-muted-foreground')}>
            {t('join.note')}
          </p>
        </div>
      </div>
    </div>
  )
}
