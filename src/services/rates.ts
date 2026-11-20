export const XOF_PER_EUR = 655.957
export const FALLBACK_SATS_PER_EUR = 1100
export const FALLBACK_SATS_PER_XOF = FALLBACK_SATS_PER_EUR / XOF_PER_EUR

export interface ExchangeRates {
  btcEur: number
  btcXof: number
  satsPerEur: number
  satsPerXof: number
  xofPerEur: number
  source: 'yadio' | 'coingecko' | 'fallback'
  fetchedAt: number
}

const CACHE_TTL_MS = 5 * 60 * 1000
let cached: ExchangeRates | null = null

export function xofToSats(amountXof: number, satsPerXof: number): number {
  return Math.max(1, Math.round(amountXof * satsPerXof))
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 4000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

export async function getExchangeRates(force = false): Promise<ExchangeRates> {
  const now = Date.now()
  if (!force && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached
  }

  if (process.env.DISABLE_EXTERNAL_RATES === '1') {
    const fallback: ExchangeRates = {
      btcEur: Math.round(100_000_000 / FALLBACK_SATS_PER_EUR),
      btcXof: Math.round((100_000_000 / FALLBACK_SATS_PER_EUR) * XOF_PER_EUR),
      satsPerEur: FALLBACK_SATS_PER_EUR,
      satsPerXof: FALLBACK_SATS_PER_XOF,
      xofPerEur: XOF_PER_EUR,
      source: 'fallback',
      fetchedAt: now,
    }
    cached = fallback
    return fallback
  }

  try {
    const data = await fetchJsonWithTimeout<{ BTC?: { EUR?: number; XOF?: number } }>(
      'https://api.yadio.io/exrates/BTC',
    )
    const btcEur = data.BTC?.EUR
    const btcXof = data.BTC?.XOF ?? (btcEur ? btcEur * XOF_PER_EUR : undefined)
    if (btcEur && btcEur > 0 && btcXof && btcXof > 0) {
      const rate: ExchangeRates = {
        btcEur,
        btcXof,
        satsPerEur: 100_000_000 / btcEur,
        satsPerXof: 100_000_000 / btcXof,
        xofPerEur: XOF_PER_EUR,
        source: 'yadio',
        fetchedAt: now,
      }
      cached = rate
      return rate
    }
  } catch {
    // Fall through to CoinGecko
  }

  try {
    const data = await fetchJsonWithTimeout<{ bitcoin?: { eur?: number; xof?: number } }>(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur,xof',
    )
    const btcEur = data.bitcoin?.eur
    const btcXof = data.bitcoin?.xof ?? (btcEur ? btcEur * XOF_PER_EUR : undefined)
    if (btcEur && btcEur > 0 && btcXof && btcXof > 0) {
      const rate: ExchangeRates = {
        btcEur,
        btcXof,
        satsPerEur: 100_000_000 / btcEur,
        satsPerXof: 100_000_000 / btcXof,
        xofPerEur: XOF_PER_EUR,
        source: 'coingecko',
        fetchedAt: now,
      }
      cached = rate
      return rate
    }
  } catch {
    // Fall through to deterministic fallback
  }

  const fallback: ExchangeRates = {
    btcEur: Math.round(100_000_000 / FALLBACK_SATS_PER_EUR),
    btcXof: Math.round((100_000_000 / FALLBACK_SATS_PER_EUR) * XOF_PER_EUR),
    satsPerEur: FALLBACK_SATS_PER_EUR,
    satsPerXof: FALLBACK_SATS_PER_XOF,
    xofPerEur: XOF_PER_EUR,
    source: 'fallback',
    fetchedAt: now,
  }
  cached = fallback
  return fallback
}
