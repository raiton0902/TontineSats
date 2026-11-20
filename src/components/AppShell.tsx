import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  Activity,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Share2,
} from 'lucide-react'
import { CIRCLE } from '../lib/demo'
import { initialsOf } from '../lib/format'
import { useApp } from '../store/AppStore'
import { CreateCircleSheet } from './CreateCircleSheet'
import { InviteSheet, MemberSheet } from './MemberInviteSheets'
import { PaymentSheet } from './PaymentSheet'
import { StartCircleSheet } from './StartCircleSheet'
import { Avatar, BrandMark, IconButton, cx } from './ui'

const navItems = [
  { to: '/app', end: true, labelKey: 'nav.dashboard', icon: Home },
  { to: '/app/activity', labelKey: 'nav.activity', icon: Activity },
  { to: '/app/passport', labelKey: 'nav.passport', icon: ShieldCheck },
  { to: '/app/settings', labelKey: 'nav.settings', icon: Settings },
]

const WIDTH_KEY = 'tontinesats.sidebar.width.v1'
const COLLAPSED_KEY = 'tontinesats.sidebar.collapsed.v1'
const MIN_WIDTH = 208
const MAX_WIDTH = 344
const DEFAULT_WIDTH = 248
const RAIL_WIDTH = 72

function readWidth() {
  try {
    const value = Number(localStorage.getItem(WIDTH_KEY))
    return Number.isFinite(value) && value >= MIN_WIDTH && value <= MAX_WIDTH
      ? value
      : DEFAULT_WIDTH
  } catch {
    return DEFAULT_WIDTH
  }
}

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export function AppShell() {
  const { session, t, live, openInvite, activeCircle, backendOnline } = useApp()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [width, setWidth] = useState(readWidth)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ x: number; width: number } | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0')
    } catch {
      // Storage can be unavailable in private modes; the state still works for this session.
    }
  }, [collapsed])

  if (!session) return <Navigate to="/" replace />

  const initials = initialsOf(session.name)
  const circleSubtitle = backendOnline
    ? (activeCircle?.circle.name ?? t('common.app'))
    : CIRCLE.name

  const clampWidth = (value: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value))

  const commitWidth = (value: number) => {
    const next = clampWidth(value)
    setWidth(next)
    try {
      localStorage.setItem(WIDTH_KEY, String(next))
    } catch {
      // Ignore storage failures.
    }
  }

  const beginResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (collapsed) return
    event.preventDefault()
    drag.current = { x: event.clientX, width }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    setWidth(clampWidth(drag.current.width + event.clientX - drag.current.x))
  }

  const endResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = drag.current
    if (!active) return
    drag.current = null
    setDragging(false)
    commitWidth(active.width + event.clientX - active.x)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      data-dragging={dragging}
      style={{ '--sidebar-w': `${collapsed ? RAIL_WIDTH : width}px` } as CSSProperties}
      className="app-canvas min-h-dvh"
    >
      <aside className="app-sidebar glass-chrome fixed inset-y-0 left-0 z-30 hidden flex-col lg:flex">
        <div
          className={cx(
            'flex items-center gap-2 px-3 py-4',
            collapsed ? 'flex-col' : 'justify-between',
          )}
        >
          <div className={cx('flex min-w-0 items-center gap-2.5', collapsed ? 'justify-center' : 'px-1')}>
            <BrandMark className="h-8 w-8 shrink-0 text-primary" />
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[15px] font-bold tracking-tight">{t('common.app')}</p>
                <p className="truncate text-[10.5px] text-muted-foreground">{circleSubtitle}</p>
              </div>
            )}
          </div>
          <IconButton
            label={collapsed ? t('app.expandSidebar') : t('app.collapseSidebar')}
            onClick={() => setCollapsed((value) => !value)}
            className={collapsed ? '' : '-mr-1'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeftClose className="h-[18px] w-[18px]" />
            )}
          </IconButton>
        </div>

        <nav className={cx('flex flex-col gap-0.5 py-2', collapsed ? 'px-2' : 'px-3')}>
          {navItems.map((item) => {
            const Icon = item.icon
            const label = t(item.labelKey)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={label}
                aria-label={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cx(
                    'flex min-h-11 items-center rounded-[10px] text-[13.5px] font-medium transition',
                    collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                  )
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {!collapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={t('app.resizeSidebar')}
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={MAX_WIDTH}
            aria-valuenow={width}
            tabIndex={0}
            onPointerDown={beginResize}
            onPointerMove={moveResize}
            onPointerUp={endResize}
            onPointerCancel={endResize}
            onDoubleClick={() => commitWidth(DEFAULT_WIDTH)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault()
                commitWidth(width + (event.key === 'ArrowLeft' ? -8 : 8))
              }
              if (event.key === 'Home') {
                event.preventDefault()
                commitWidth(MIN_WIDTH)
              }
              if (event.key === 'End') {
                event.preventDefault()
                commitWidth(MAX_WIDTH)
              }
            }}
            className="absolute inset-y-0 -right-1.5 z-40 w-3 cursor-col-resize touch-none rounded-full focus-visible:bg-primary/20 focus-visible:outline-none"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border/70"
            />
          </div>
        )}
      </aside>

      <div className="app-content">
        <header className="glass-chrome sticky top-0 z-20 flex min-h-14 items-center justify-between gap-2 px-4 lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <BrandMark className="h-7 w-7 text-primary" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-semibold">{t('common.app')}</p>
              <p className="truncate text-[10px] text-muted-foreground">{circleSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <IconButton label={t('dash.invite')} onClick={openInvite}>
              <Share2 className="h-[18px] w-[18px]" />
            </IconButton>
            <NavLink
              to="/app/settings"
              aria-label={t('nav.settings')}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full"
            >
              <Avatar initials={initials} size="sm" />
            </NavLink>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1080px] px-4 pt-5 pb-24 sm:px-6 lg:px-8 lg:pt-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label={t('nav.dashboard')}
        className="glass-chrome fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="h-[21px] w-[21px]" />
              {t(item.labelKey)}
            </NavLink>
          )
        })}
      </nav>

      <PaymentSheet />
      <MemberSheet />
      <InviteSheet />
      <CreateCircleSheet />
      <StartCircleSheet />
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </div>
  )
}
