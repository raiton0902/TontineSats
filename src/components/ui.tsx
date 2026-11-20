import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, Moon, Sun, X } from 'lucide-react'
import { copyText } from '../lib/clipboard'
import { useApp } from '../store/AppStore'

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ')

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-[background,transform,border-color,color] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55'

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 text-[13px]',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-[15px]',
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-soft)]',
  secondary:
    'bg-card text-foreground border border-border hover:bg-secondary',
  ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}) {
  return (
    <button
      {...props}
      className={cx(
        buttonBase,
        buttonSizes[size],
        buttonVariants[variant],
        fullWidth && 'w-full',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...props}
      aria-label={label}
      className={cx(
        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground transition hover:bg-secondary active:scale-95',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Pill({
  tone = 'muted',
  children,
  className,
}: {
  tone?: 'success' | 'warning' | 'muted' | 'primary' | 'destructive'
  children: ReactNode
  className?: string
}) {
  const tones = {
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    muted: 'bg-secondary text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    destructive: 'bg-destructive/10 text-destructive',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tabular',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Avatar({
  initials,
  size = 'md',
  accent,
  className,
}: {
  initials: string
  size?: 'sm' | 'md' | 'lg'
  accent?: boolean
  className?: string
}) {
  const sizes = { sm: 'h-9 w-9 text-[11px]', md: 'h-10 w-10 text-xs', lg: 'h-12 w-12 text-sm' }
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full border font-semibold',
        accent
          ? 'border-transparent bg-primary text-primary-foreground'
          : 'border-border bg-secondary text-foreground',
        sizes[size],
        className,
      )}
    >
      {initials}
    </span>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'spinner',
        className,
      )}
    />
  )
}

export function CopyButton({
  value,
  label,
  onCopied,
  variant = 'quiet',
  className,
}: {
  value: string
  label: string
  onCopied?: () => void
  variant?: 'quiet' | 'field'
  className?: string
}) {
  const { announce, t } = useApp()
  const [copied, setCopied] = useState(false)
  const timeout = useRef<number | null>(null)

  useEffect(() => () => {
    if (timeout.current) window.clearTimeout(timeout.current)
  }, [])

  const onClick = async () => {
    try {
      await copyText(value)
      setCopied(true)
      announce(t('live.copied'))
      onCopied?.()
      if (timeout.current) window.clearTimeout(timeout.current)
      timeout.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      announce(t('live.copyFail'))
    }
  }

  const quiet = variant === 'quiet'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition active:scale-95',
        quiet
          ? 'min-h-11 min-w-11 text-muted-foreground hover:bg-secondary hover:text-foreground'
          : 'min-h-11 border border-border bg-secondary px-3 text-xs text-foreground hover:bg-card',
        copied && 'text-success',
        className,
      )}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {!quiet && <span>{copied ? t('live.copied') : label}</span>}
    </button>
  )
}

export function Field({
  label,
  hint,
  error,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
}) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[13px] font-medium text-foreground">
        {label}
      </label>
      <input
        id={inputId}
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cx(
          'min-h-11 w-full rounded-[10px] border bg-card px-3 text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus-visible:border-primary',
          error ? 'border-destructive' : 'border-border',
        )}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-primary' : 'bg-border',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-[var(--paper)] shadow transition-transform duration-200',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-0.5 rounded-xl bg-secondary p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cx(
            'min-h-11 flex-1 rounded-[9px] px-2 text-[12.5px] font-medium transition',
            value === option.value
              ? 'bg-card text-foreground shadow-[var(--shadow-soft)]'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}) {
  const { t } = useApp()
  const panel = useRef<HTMLDivElement | null>(null)
  const headingId = useId()

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const id = window.setTimeout(() => panel.current?.focus(), 40)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      window.clearTimeout(id)
      previous?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={onClose}
        className="scrim absolute inset-0"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className={cx(
          'animate-glass relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none sm:rounded-3xl sm:p-6 glass-chrome',
          size === 'lg' ? 'sm:max-w-xl' : 'sm:max-w-lg',
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={headingId} className="text-[15px] font-semibold tracking-tight">
            {title}
          </h2>
          <IconButton label={t('common.close')} onClick={onClose} className="-mr-2">
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        {children}
        {footer}
      </div>
    </div>,
    document.body,
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, updateSettings, t } = useApp()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => updateSettings({ theme: dark ? 'light' : 'dark' })}
      aria-label={dark ? t('theme.switchToLight') : t('theme.switchToDark')}
      className={cx(
        'grid h-11 w-11 place-items-center rounded-full border transition active:scale-[0.96]',
        className,
      )}
    >
      {dark ? (
        <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
      ) : (
        <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </button>
  )
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cx('h-8 w-8', className)} aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="2.4" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <circle
          key={index}
          cx="16"
          cy="16"
          r="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="3.2 100"
          transform={`rotate(${index * 45} 16 16)`}
          strokeOpacity={index < 5 ? 1 : 0.28}
        />
      ))}
    </svg>
  )
}
