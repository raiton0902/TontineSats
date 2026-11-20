import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { api } from '../lib/api'
import { initialsOf } from '../lib/format'
import type { ApiMember } from '../lib/types'
import { useApp } from '../store/AppStore'
import { Avatar, Button, IconButton, Sheet, Spinner } from './ui'

export function StartCircleSheet() {
  const {
    t,
    session,
    activeCircle,
    startCircleOpen,
    closeStartCircle,
    refreshData,
    announce,
  } = useApp()

  const [ordered, setOrdered] = useState<ApiMember[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (startCircleOpen && activeCircle) {
      setOrdered([...activeCircle.members].sort((a, b) => a.payoutOrder - b.payoutOrder))
      setError('')
    }
  }, [startCircleOpen, activeCircle])

  if (!activeCircle || !session) return null

  const move = (index: number, delta: -1 | 1) => {
    const nextIdx = index + delta
    if (nextIdx < 0 || nextIdx >= ordered.length) return
    const copy = [...ordered]
    const [item] = copy.splice(index, 1)
    copy.splice(nextIdx, 0, item)
    setOrdered(copy)
  }

  const startNow = async () => {
    if (ordered.length < 2) {
      setError(t('circle.needTwo'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.startCircle(activeCircle.circle.id, {
        organizerNpub: session.npub,
        orderedNpubs: ordered.map((m) => m.npub),
      })
      await refreshData(activeCircle.circle.id)
      announce(t('live.circleStarted'))
      closeStartCircle()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={startCircleOpen} onClose={closeStartCircle} title={t('circle.startTitle')}>
      <p className="text-sm leading-relaxed text-muted-foreground">{t('circle.startBody')}</p>

      <ul className="mt-4 flex flex-col gap-2">
        {ordered.map((member, index) => (
          <li
            key={member.npub}
            className="glass-flat flex items-center justify-between gap-2 rounded-[12px] px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="w-6 text-xs font-semibold text-muted-foreground tabular">
                R{index + 1}
              </span>
              <Avatar initials={initialsOf(member.displayName)} size="sm" />
              <span className="truncate text-[13.5px] font-medium">{member.displayName}</span>
            </div>
            <div className="flex items-center gap-1">
              <IconButton
                label={t('circle.moveUp', { name: member.displayName })}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={t('circle.moveDown', { name: member.displayName })}
                disabled={index === ordered.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="mt-3 text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      <Button
        fullWidth
        size="lg"
        className="mt-4"
        disabled={busy || ordered.length < 2}
        onClick={startNow}
      >
        {busy ? <Spinner /> : null}
        {t('circle.startConfirm')}
      </Button>
    </Sheet>
  )
}
