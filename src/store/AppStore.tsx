import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ApiOfflineError, api } from '../lib/api'
import { PERSONAS } from '../lib/demo'
import { translate } from '../lib/i18n'
import type {
  ApiCircleDetail,
  ApiCircleSummary,
  ApiReputation,
  DemoPersonaRecord,
  DemoState,
  ExchangeRates,
  Locale,
  Persona,
  PersonaId,
  Session,
  Settings,
} from '../lib/types'

const SESSION_KEY = 'tontinesats.session.v1'
const SETTINGS_KEY = 'tontinesats.settings.v1'
const CIRCLE_KEY = 'tontinesats.circle.v1'
const PERSONAS_KEY = 'tontinesats.personas.v1'

const defaultSettings: Settings = {
  theme: 'light',
  reduceMotion: false,
  demoMode: false,
  locale: 'fr',
}

const defaultDemo: DemoState = {
  persona: 'awa',
  paid: false,
  joined: false,
  confirmed: 5,
  calendar: { year: 2026, month: 10, day: null },
  receiptRound: 3,
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...(JSON.parse(raw) as T) }
  } catch {
    return fallback
  }
}

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed?.npub || !parsed?.name) return null
    return parsed
  } catch {
    return null
  }
}

interface AppContextValue {
  session: Session | null
  settings: Settings
  demo: DemoState
  persona: Persona
  t: (key: string, vars?: Record<string, string | number>) => string
  locale: Locale
  theme: 'light' | 'dark'
  live: string
  paymentOpen: boolean
  memberOrder: number | null
  inviteOpen: boolean
  createCircleOpen: boolean
  startCircleOpen: boolean
  rates: ExchangeRates | null
  backendOnline: boolean
  circles: ApiCircleSummary[]
  activeCircleId: string | null
  activeCircle: ApiCircleDetail | null
  loadingCircle: boolean
  circleError: string | null
  reputation: ApiReputation | null
  loadingReputation: boolean
  demoPersonas: DemoPersonaRecord[]
  signIn: (session: Session) => void
  signOut: () => void
  updateSession: (patch: Partial<Session>) => void
  updateSettings: (patch: Partial<Settings>) => void
  updateDemo: (patch: Partial<DemoState>) => void
  setLanguage: (locale: Locale) => void
  openPayment: () => void
  closePayment: () => void
  openMember: (order: number) => void
  closeMember: () => void
  openInvite: () => void
  closeInvite: () => void
  openCreateCircle: () => void
  closeCreateCircle: () => void
  openStartCircle: () => void
  closeStartCircle: () => void
  selectCircle: (circleId: string) => void
  refreshData: (preferredCircleId?: string) => Promise<void>
  loadSandboxDemo: (reset?: boolean) => Promise<void>
  switchPersona: (id: PersonaId) => Promise<void>
  announce: (message: string) => void
  resetDemo: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession)
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = readStored(SETTINGS_KEY, defaultSettings)
    return {
      ...stored,
      reduceMotion:
        stored.reduceMotion ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    }
  })
  const [demo, setDemo] = useState<DemoState>(defaultDemo)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const [live, setLive] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [memberOrder, setMemberOrder] = useState<number | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [createCircleOpen, setCreateCircleOpen] = useState(false)
  const [startCircleOpen, setStartCircleOpen] = useState(false)

  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [backendOnline, setBackendOnline] = useState(true)
  const [circles, setCircles] = useState<ApiCircleSummary[]>([])
  const [activeCircleId, setActiveCircleId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CIRCLE_KEY)
    } catch {
      return null
    }
  })
  const [activeCircle, setActiveCircle] = useState<ApiCircleDetail | null>(null)
  const [loadingCircle, setLoadingCircle] = useState(false)
  const [circleError, setCircleError] = useState<string | null>(null)
  const [reputation, setReputation] = useState<ApiReputation | null>(null)
  const [loadingReputation, setLoadingReputation] = useState(false)
  const [demoPersonas, setDemoPersonas] = useState<DemoPersonaRecord[]>(() =>
    readArray<DemoPersonaRecord>(PERSONAS_KEY),
  )

  const liveTimer = useRef<number | null>(null)
  const activeCircleIdRef = useRef<string | null>(activeCircleId)
  activeCircleIdRef.current = activeCircleId

  const theme: 'light' | 'dark' =
    settings.theme === 'system' ? (systemDark ? 'dark' : 'light') : settings.theme
  const locale = session?.locale ?? settings.locale

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = locale
  }, [theme, locale])

  useEffect(() => {
    document.documentElement.dataset.reduce = settings.reduceMotion ? 'true' : 'false'
  }, [settings.reduceMotion])

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  }, [session])

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    if (activeCircleId) localStorage.setItem(CIRCLE_KEY, activeCircleId)
    else localStorage.removeItem(CIRCLE_KEY)
  }, [activeCircleId])

  useEffect(() => {
    if (demoPersonas.length > 0) {
      localStorage.setItem(PERSONAS_KEY, JSON.stringify(demoPersonas))
    } else {
      localStorage.removeItem(PERSONAS_KEY)
    }
  }, [demoPersonas])

  useEffect(() => {
    api
      .getRates()
      .then((res) => {
        setRates(res)
        setBackendOnline(true)
      })
      .catch((err) => {
        if (err instanceof ApiOfflineError) setBackendOnline(false)
      })
  }, [])

  useEffect(() => () => {
    if (liveTimer.current) window.clearTimeout(liveTimer.current)
  }, [])

  const announce = useCallback((message: string) => {
    setLive(message)
    if (liveTimer.current) window.clearTimeout(liveTimer.current)
    liveTimer.current = window.setTimeout(() => setLive(''), 2800)
  }, [])

  const refreshData = useCallback(
    async (preferredCircleId?: string) => {
      if (!session) return
      setLoadingCircle(true)
      setLoadingReputation(true)
      setCircleError(null)
      try {
        const [{ circles: list }, rep] = await Promise.all([
          api.listCircles(session.npub),
          api.getReputation(session.npub),
        ])
        setBackendOnline(true)
        setCircles(list)
        setReputation(rep)

        const candidateId =
          preferredCircleId && list.some((c) => c.id === preferredCircleId)
            ? preferredCircleId
            : activeCircleIdRef.current && list.some((c) => c.id === activeCircleIdRef.current)
              ? activeCircleIdRef.current
              : list[0]?.id ?? null

        setActiveCircleId(candidateId)
        if (candidateId) {
          const detail = await api.getCircle(candidateId)
          setActiveCircle(detail)
        } else {
          setActiveCircle(null)
        }
      } catch (err) {
        if (err instanceof ApiOfflineError) {
          setBackendOnline(false)
        } else {
          setCircleError(err instanceof Error ? err.message : 'Error loading data')
        }
      } finally {
        setLoadingCircle(false)
        setLoadingReputation(false)
      }
    },
    [session],
  )

  useEffect(() => {
    if (!session) {
      setCircles([])
      setActiveCircle(null)
      setReputation(null)
      setCircleError(null)
      return
    }

    let cancelled = false
    const syncAndLoad = async () => {
      if (session.mode === 'keys') {
        try {
          await api.upsertProfile({
            npub: session.npub,
            displayName: session.name,
            locale: session.locale,
            lightningAddress: session.lightningAddress,
            nwcUri: session.nwc,
          })
        } catch (err) {
          if (err instanceof ApiOfflineError) {
            if (!cancelled) setBackendOnline(false)
            return
          }
        }
      }
      if (!cancelled) await refreshData()
    }
    void syncAndLoad()
    return () => {
      cancelled = true
    }
  }, [session?.npub, session?.mode, refreshData])

  const selectCircle = useCallback(async (circleId: string) => {
    setActiveCircleId(circleId)
    setLoadingCircle(true)
    setCircleError(null)
    try {
      const detail = await api.getCircle(circleId)
      setActiveCircle(detail)
      setBackendOnline(true)
    } catch (err) {
      if (err instanceof ApiOfflineError) setBackendOnline(false)
      else setCircleError(err instanceof Error ? err.message : 'Error loading circle')
    } finally {
      setLoadingCircle(false)
    }
  }, [])

  const signIn = useCallback((next: Session) => {
    setSession(next)
    setSettings((prev) => ({ ...prev, locale: next.locale }))
  }, [])

  const signOut = useCallback(() => {
    setSession(null)
    setPaymentOpen(false)
    setMemberOrder(null)
    setInviteOpen(false)
    setCreateCircleOpen(false)
    setStartCircleOpen(false)
    setActiveCircle(null)
    setActiveCircleId(null)
    setCircles([])
    setReputation(null)
    setDemoPersonas([])
    setDemo(defaultDemo)
  }, [])

  const updateSession = useCallback((patch: Partial<Session>) => {
    setSession((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const updateDemo = useCallback((patch: Partial<DemoState>) => {
    setDemo((prev) => ({ ...prev, ...patch }))
  }, [])

  const setLanguage = useCallback((next: Locale) => {
    setSettings((prev) => ({ ...prev, locale: next }))
    setSession((prev) => (prev ? { ...prev, locale: next } : prev))
  }, [])

  const loadSandboxDemo = useCallback(
    async (reset = false) => {
      try {
        const seeded = await api.seedDemo(reset)
        setBackendOnline(true)
        setDemoPersonas(seeded.personas)
        const awa = seeded.personas[0]
        setSettings((prev) => ({ ...prev, demoMode: true, locale: awa.locale }))
        setDemo({ ...defaultDemo, persona: awa.id })
        setActiveCircleId(seeded.circleId)
        setSession({
          mode: 'demo',
          npub: awa.npub,
          nsec: awa.nsec,
          name: awa.name,
          locale: awa.locale,
          lightningAddress: awa.lightningAddress,
          createdAt: Date.now(),
        })
        const [detail, rep, listRes] = await Promise.all([
          api.getCircle(seeded.circleId),
          api.getReputation(awa.npub),
          api.listCircles(awa.npub),
        ])
        setCircles(listRes.circles)
        setActiveCircle(detail)
        setReputation(rep)
      } catch (err) {
        if (err instanceof ApiOfflineError) {
          setBackendOnline(false)
          const [{ generateSecretKey, getPublicKey }, { npubEncode }] = await Promise.all([
            import('nostr-tools/pure'),
            import('nostr-tools/nip19'),
          ])
          const secret = generateSecretKey()
          setDemo(defaultDemo)
          setSession({
            mode: 'demo',
            npub: npubEncode(getPublicKey(secret)),
            name: 'Awa Diop',
            locale: settings.locale || 'fr',
            createdAt: Date.now(),
          })
          return
        }
        throw err
      }
    },
    [settings.locale],
  )

  const switchPersona = useCallback(
    async (id: PersonaId) => {
      setDemo((prev) => ({ ...prev, persona: id }))
      if (!backendOnline) return
      let target = demoPersonas.find((p) => p.id === id)
      let circleId = activeCircleIdRef.current
      if (!target) {
        try {
          const seeded = await api.seedDemo(false)
          setDemoPersonas(seeded.personas)
          target = seeded.personas.find((p) => p.id === id)
          circleId = seeded.circleId
        } catch {
          return
        }
      }
      if (!target) return
      setSession({
        mode: 'demo',
        npub: target.npub,
        nsec: target.nsec,
        name: target.name,
        locale: session?.locale ?? target.locale,
        lightningAddress: target.lightningAddress,
        createdAt: Date.now(),
      })
      if (circleId) setActiveCircleId(circleId)
    },
    [backendOnline, demoPersonas, session?.locale],
  )

  const resetDemo = useCallback(() => {
    setDemo(defaultDemo)
    if (backendOnline) {
      void loadSandboxDemo(true).catch(() => undefined)
    }
  }, [backendOnline, loadSandboxDemo])

  const value = useMemo<AppContextValue>(() => {
    const t = (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars)
    return {
      session,
      settings,
      demo,
      persona: PERSONAS[demo.persona],
      t,
      locale,
      theme,
      live,
      paymentOpen,
      memberOrder,
      inviteOpen,
      createCircleOpen,
      startCircleOpen,
      rates,
      backendOnline,
      circles,
      activeCircleId,
      activeCircle,
      loadingCircle,
      circleError,
      reputation,
      loadingReputation,
      demoPersonas,
      signIn,
      signOut,
      updateSession,
      updateSettings,
      updateDemo,
      setLanguage,
      openPayment: () => setPaymentOpen(true),
      closePayment: () => setPaymentOpen(false),
      openMember: setMemberOrder,
      closeMember: () => setMemberOrder(null),
      openInvite: () => setInviteOpen(true),
      closeInvite: () => setInviteOpen(false),
      openCreateCircle: () => setCreateCircleOpen(true),
      closeCreateCircle: () => setCreateCircleOpen(false),
      openStartCircle: () => setStartCircleOpen(true),
      closeStartCircle: () => setStartCircleOpen(false),
      selectCircle,
      refreshData,
      loadSandboxDemo,
      switchPersona,
      announce,
      resetDemo,
    }
  }, [
    session,
    settings,
    demo,
    locale,
    theme,
    live,
    paymentOpen,
    memberOrder,
    inviteOpen,
    createCircleOpen,
    startCircleOpen,
    rates,
    backendOnline,
    circles,
    activeCircleId,
    activeCircle,
    loadingCircle,
    circleError,
    reputation,
    loadingReputation,
    demoPersonas,
    signIn,
    signOut,
    updateSession,
    updateSettings,
    updateDemo,
    setLanguage,
    selectCircle,
    refreshData,
    loadSandboxDemo,
    switchPersona,
    announce,
    resetDemo,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
