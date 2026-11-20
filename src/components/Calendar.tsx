import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { dayLabel, isoOf, localeDate, monthLabel } from '../lib/format'
import type { Locale } from '../lib/types'
import { useApp } from '../store/AppStore'
import { cx, IconButton } from './ui'

const YEARS = Array.from({ length: 21 }, (_, index) => 2015 + index)
const MONTHS = Array.from({ length: 12 }, (_, index) => index)

export function Calendar({
  year,
  month,
  day,
  events,
  dueIso,
  locale,
  onSelect,
  onMonth,
  onJump,
}: {
  year: number
  month: number
  day: number | null
  events: Set<string>
  dueIso?: string
  locale: Locale
  onSelect: (day: number) => void
  onMonth: (delta: number) => void
  onJump: (year: number, month: number) => void
}) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)

  const weekdays =
    locale === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (panel.current?.contains(target) || trigger.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    const selected = panel.current?.querySelector<HTMLElement>('[data-selected-year="true"]')
    if (panel.current && selected) panel.current.scrollTop = selected.offsetTop - 8
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (nextYear: number, nextMonth: number) => {
    onJump(nextYear, nextMonth)
    setOpen(false)
    trigger.current?.focus()
  }

  return (
    <section
      aria-label={monthLabel(year, month, locale)}
      className="glass-panel relative rounded-[16px] p-2 sm:p-3"
    >
      <div className="flex min-h-11 items-center justify-between gap-1">
        <IconButton label={t('act.prevMonth')} onClick={() => onMonth(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </IconButton>
        <button
          ref={trigger}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-2 text-[13px] font-semibold tracking-tight transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {monthLabel(year, month, locale)}
          <ChevronDown
            className={cx('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
        <IconButton label={t('act.nextMonth')} onClick={() => onMonth(1)}>
          <ChevronRight className="h-5 w-5" />
        </IconButton>
      </div>

      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-label={t('cal.pick')}
          className="absolute inset-x-1 top-[52px] z-30 max-h-[300px] overflow-y-auto overscroll-contain rounded-[14px] border border-border bg-card p-2 shadow-[var(--shadow-lift)]"
        >
          {YEARS.map((entryYear) => (
            <div
              key={entryYear}
              data-selected-year={entryYear === year ? 'true' : undefined}
            >
              <p className="sticky top-0 z-10 bg-card px-2 py-1.5 text-[10.5px] font-semibold tracking-[0.08em] text-muted-foreground tabular uppercase">
                {entryYear}
              </p>
              <div className="grid grid-cols-4 gap-1">
                {MONTHS.map((entryMonth) => {
                  const selected = entryYear === year && entryMonth === month
                  return (
                    <button
                      key={entryMonth}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => choose(entryYear, entryMonth)}
                      className={cx(
                        'min-h-11 rounded-[8px] text-[12px] capitalize transition',
                        selected
                          ? 'bg-primary font-semibold text-primary-foreground'
                          : 'text-foreground hover:bg-secondary',
                      )}
                    >
                      {localeDate(new Date(entryYear, entryMonth, 1), locale, {
                        month: 'short',
                      }).replace('.', '')}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-1 grid grid-cols-7 gap-px" aria-hidden="true">
        {weekdays.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="grid h-5 place-items-center text-[10px] text-muted-foreground"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5" role="group" aria-label={monthLabel(year, month, locale)}>
        {Array.from({ length: offset }, (_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" />
        ))}
        {Array.from({ length: days }, (_, index) => {
          const date = index + 1
          const iso = isoOf(year, month, date)
          const selected = day === date
          const isDue = iso === dueIso
          const hasEvent = events.has(iso)
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === date
          return (
            <button
              key={iso}
              type="button"
              aria-pressed={selected}
              aria-label={`${dayLabel(new Date(year, month, date), locale, true)}${
                isDue ? `, ${t('act.due')}` : ''
              }`}
              onClick={() => onSelect(date)}
              className={cx(
                'relative mx-auto grid h-11 w-11 place-items-center rounded-full bg-secondary/40 text-[12.5px] tabular transition-colors',
                selected && 'bg-primary font-bold text-primary-foreground',
                !selected && 'hover:bg-secondary',
                !selected && isDue && 'text-warning ring-1 ring-warning/40 ring-inset',
                !selected && !isDue && isToday && 'font-semibold text-primary ring-1 ring-primary/30 ring-inset',
                !selected && !isDue && !isToday && 'text-foreground',
              )}
            >
              {date}
              {hasEvent && (
                <span
                  aria-hidden="true"
                  className={cx(
                    'absolute bottom-1.5 h-1 w-1 rounded-full',
                    selected ? 'bg-primary-foreground' : isDue ? 'bg-warning' : 'bg-success',
                  )}
                />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
