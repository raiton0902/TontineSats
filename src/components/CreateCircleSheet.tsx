import { useState } from 'react'
import { api } from '../lib/api'
import { eur, satsLabel } from '../lib/format'
import type { Frequency } from '../lib/types'
import { useApp } from '../store/AppStore'
import { Button, Field, Segmented, Sheet, Spinner } from './ui'

export function CreateCircleSheet() {
  const {
    t,
    locale,
    session,
    rates,
    createCircleOpen,
    closeCreateCircle,
    refreshData,
    openInvite,
    announce,
  } = useApp()

  const [name, setName] = useState('')
  const [amountInput, setAmountInput] = useState('10000')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const amountXof = Math.max(0, Math.round(Number(amountInput) || 0))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!session) return
    if (!name.trim() || amountXof < 100) {
      setError(t('circle.createError'))
      return
    }
    setError('')
    setBusy(true)
    try {
      const res = await api.createCircle({
        name: name.trim(),
        organizerNpub: session.npub,
        organizerName: session.name,
        amountXof,
        frequency,
      })
      await refreshData(res.circle.id)
      announce(t('live.circleCreated'))
      setName('')
      closeCreateCircle()
      openInvite()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={createCircleOpen} onClose={closeCreateCircle} title={t('circle.createTitle')}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label={t('circle.nameLabel')}
          placeholder={t('circle.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <div>
          <Field
            label={t('circle.amountLabel')}
            type="number"
            min={100}
            step={500}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="tabular"
          />
          {amountXof >= 100 && (
            <p className="mt-1.5 text-xs text-muted-foreground tabular">
              {eur(amountXof, locale)} · {satsLabel(amountXof, locale, rates?.satsPerXof)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-[13px] font-medium text-foreground">
            {t('circle.frequencyLabel')}
          </span>
          <Segmented
            label={t('circle.frequencyLabel')}
            value={frequency}
            onChange={setFrequency}
            options={[
              { value: 'monthly', label: t('circle.freqMonthly') },
              { value: 'weekly', label: t('circle.freqWeekly') },
              { value: 'demo_5min', label: t('circle.freqDemo') },
            ]}
          />
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth size="lg" disabled={busy}>
          {busy ? <Spinner /> : null}
          {t('circle.createCta')}
        </Button>
      </form>
    </Sheet>
  )
}
