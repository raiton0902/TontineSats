import { useNavigate } from 'react-router-dom'
import { LogOut, RefreshCw } from 'lucide-react'
import { LOCALES } from '../lib/i18n'
import { PERSONAS } from '../lib/demo'
import { shortNpub } from '../lib/format'
import type { Locale } from '../lib/types'
import { useApp } from '../store/AppStore'
import { Avatar, Button, CopyButton, Pill, Segmented, Switch, cx } from '../components/ui'

export function SettingsPage() {
  const {
    t,
    locale,
    session,
    settings,
    persona,
    setLanguage,
    updateSettings,
    switchPersona,
    resetDemo,
    signOut,
    announce,
  } = useApp()
  const navigate = useNavigate()

  if (!session) return null

  const initials = session.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  const signOutNow = () => {
    signOut()
    announce(t('live.signedOut'))
    navigate('/')
  }

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-[22px] font-bold tracking-[-0.02em] sm:text-[26px]">{t('set.title')}</h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="flex flex-col gap-4">
          <section className="glass-panel rounded-[18px] p-4 sm:p-5">
            <h2 className="mb-3 text-[14px] font-semibold tracking-tight">{t('set.language')}</h2>
            <Segmented
              label={t('set.language')}
              value={locale}
              onChange={(value) => setLanguage(value as Locale)}
              options={LOCALES.map((option) => ({ value: option.value, label: option.label }))}
            />

            <h2 className="mt-5 mb-3 text-[14px] font-semibold tracking-tight">{t('set.theme')}</h2>
            <Segmented
              label={t('set.theme')}
              value={settings.theme}
              onChange={(value) => updateSettings({ theme: value })}
              options={[
                { value: 'light', label: t('set.light') },
                { value: 'dark', label: t('set.dark') },
                { value: 'system', label: t('set.system') },
              ]}
            />
          </section>

          <section className="glass-panel rounded-[18px] px-4 sm:px-5">
            <div className="flex items-center justify-between gap-4 border-b border-border py-3">
              <div>
                <p className="text-[13.5px] font-medium">{t('set.reduceMotion')}</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  {t('set.reduceMotionSub')}
                </p>
              </div>
              <Switch
                checked={settings.reduceMotion}
                onChange={(checked) => updateSettings({ reduceMotion: checked })}
                label={t('set.reduceMotion')}
              />
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-[13.5px] font-medium">{t('set.demoMode')}</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  {t('set.demoModeSub')}
                </p>
              </div>
              <Switch
                checked={settings.demoMode}
                onChange={(checked) => updateSettings({ demoMode: checked })}
                label={t('set.demoMode')}
              />
            </div>

            {settings.demoMode && (
              <div className="border-t border-border py-3">
                <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  {t('common.demo')}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.values(PERSONAS).map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => void switchPersona(entry.id)}
                      aria-pressed={persona.id === entry.id}
                      className={cx(
                        'min-h-11 rounded-[10px] border px-2 text-[11.5px] font-medium transition',
                        persona.id === entry.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-secondary',
                      )}
                    >
                      {entry.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="glass-panel rounded-[18px] p-4 sm:p-5">
            <h2 className="mb-3 text-[14px] font-semibold tracking-tight">{t('set.identity')}</h2>
            <div className="flex items-center gap-3">
              <Avatar initials={initials} size="lg" accent />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{session.name}</p>
                <p className="truncate font-mono text-[10.5px] text-muted-foreground">
                  {shortNpub(session.npub)}
                </p>
              </div>
              {session.mode === 'demo' && <Pill tone="primary">{t('app.demoBadge')}</Pill>}
            </div>

            <dl className="mt-3 flex flex-col">
              <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-[12px]">
                <dt className="text-muted-foreground">{t('set.npub')}</dt>
                <dd className="flex items-center gap-1 font-mono text-[11px]">
                  {shortNpub(session.npub)}
                  <CopyButton value={session.npub} label={t('pass.copyNpub')} />
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-[12px]">
                <dt className="text-muted-foreground">{t('set.nsec')}</dt>
                <dd className="text-[11px] text-muted-foreground">{t('set.nsecHidden')}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-2 text-[12px]">
                <dt className="text-muted-foreground">{t('set.version')}</dt>
                <dd className="text-[11px]">0.1.0 · {t('set.networkValue')}</dd>
              </div>
            </dl>

            {session.mode === 'keys' && (
              <p className="mt-1 text-[10.5px] leading-relaxed text-warning">
                {t('set.keyWarning')}
              </p>
            )}

            <div className="mt-2">
              <Button variant="secondary" fullWidth onClick={() => navigate('/app')}>
                {t('set.backToCircle')}
              </Button>
            </div>
          </section>

          <section className="glass-panel rounded-[18px] p-4 sm:p-5">
            <h2 className="text-[14px] font-semibold tracking-tight">{t('set.session')}</h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
              {t('set.sessionSub')}
            </p>
            <button
              type="button"
              onClick={signOutNow}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-destructive/40 px-4 text-sm font-semibold text-destructive transition hover:bg-destructive/10 active:scale-[0.99]"
            >
              <LogOut className="h-4 w-4" />
              {t('set.signOut')}
            </button>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          {(settings.demoMode || session.mode === 'demo') && (
            <section className="glass-panel rounded-[18px] p-4 sm:p-5">
              <h2 className="text-[14px] font-semibold tracking-tight">{t('set.replay')}</h2>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                {t('set.note')}
              </p>
              <Button
                variant="secondary"
                fullWidth
                className="mt-3"
                onClick={() => {
                  resetDemo()
                  announce(t('set.replay'))
                }}
              >
                <RefreshCw className="h-4 w-4" />
                {t('set.replay')}
              </Button>
            </section>
          )}

          <section className="glass-panel rounded-[18px] p-4 sm:p-5">
            <h2 className="text-[14px] font-semibold tracking-tight">{t('set.network')}</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">{t('set.networkValue')}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{t('set.note')}</p>
          </section>
        </div>
      </div>
    </div>
  )
}
