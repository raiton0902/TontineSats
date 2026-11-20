import type { Event } from 'nostr-tools/pure'
import type {
  ApiCircleDetail,
  ApiCircleSummary,
  ApiContribution,
  ApiInvoice,
  ApiReputation,
  ApiRound,
  DemoPersonaRecord,
  ExchangeRates,
  Frequency,
  Locale,
} from './types'

export class ApiOfflineError extends Error {
  constructor(message = 'Backend API unreachable') {
    super(message)
  }
}

export class ApiHttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new ApiOfflineError()
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new ApiOfflineError('Non-JSON response (static preview mode)')
  }

  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) {
    throw new ApiHttpError(res.status, data?.error || `HTTP ${res.status}`)
  }
  return data
}

export const api = {
  getRates: () => request<ExchangeRates>('/api/v1/rates'),

  upsertProfile: (payload: {
    npub: string
    displayName: string
    locale: Locale
    lightningAddress?: string
    nwcUri?: string
  }) =>
    request<{ user: ApiReputation['user'] }>('/api/v1/users/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listCircles: (npub?: string) =>
    request<{ circles: ApiCircleSummary[] }>(
      npub ? `/api/v1/circles?npub=${encodeURIComponent(npub)}` : '/api/v1/circles',
    ),

  getCircle: (id: string) => request<ApiCircleDetail>(`/api/v1/circles/${encodeURIComponent(id)}`),

  getCircleByInvite: (code: string) =>
    request<ApiCircleDetail>(`/api/v1/circles/invite/${encodeURIComponent(code)}`),

  createCircle: (payload: {
    name: string
    organizerNpub: string
    organizerName?: string
    amountXof: number
    frequency: Frequency
  }) =>
    request<{ circle: ApiCircleSummary; inviteUrl: string }>('/api/v1/circles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  joinCircle: (
    inviteCode: string,
    payload: {
      memberNpub: string
      displayName: string
      lightningAddress?: string
      nwcUri?: string
    },
  ) =>
    request<{ membership: unknown; circle: ApiCircleSummary }>(
      `/api/v1/circles/${encodeURIComponent(inviteCode)}/join`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),

  startCircle: (
    circleId: string,
    payload: { organizerNpub: string; orderedNpubs: string[] },
  ) =>
    request<{ circle: ApiCircleSummary; activeRound: ApiRound }>(
      `/api/v1/circles/${encodeURIComponent(circleId)}/start`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),

  createInvoice: (roundId: string, payerNpub: string) =>
    request<ApiInvoice>(`/api/v1/rounds/${encodeURIComponent(roundId)}/invoice`, {
      method: 'POST',
      body: JSON.stringify({ payerNpub }),
    }),

  triggerNwc: (roundId: string, payload: { organizerNpub?: string; payerNpub?: string }) =>
    request<{
      results: Array<{
        payerNpub: string
        status: 'paid' | 'failed' | 'already_paid'
        preimage?: string
        receiptEventId?: string
        error?: string
      }>
      roundCompleted: boolean
      nextRound: ApiRound | null
    }>(`/api/v1/rounds/${encodeURIComponent(roundId)}/trigger-nwc`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyContribution: (
    contributionId: string,
    payload: {
      paymentPreimage?: string
      signedNostrEvent?: Event
      simulateSandbox?: boolean
    },
  ) =>
    request<{
      contribution: ApiContribution
      receiptEventId: string
      receiptEvent: Event
      roundCompleted: boolean
      nextRound: ApiRound | null
    }>(`/api/v1/contributions/${encodeURIComponent(contributionId)}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getReputation: (npub: string) =>
    request<ApiReputation>(`/api/v1/users/${encodeURIComponent(npub)}/reputation`),

  seedDemo: (reset = false) =>
    request<{
      circleId: string
      inviteCode: string
      personas: DemoPersonaRecord[]
    }>('/api/v1/demo/seed', {
      method: 'POST',
      body: JSON.stringify({ reset }),
    }),

  markRoundOverdue: (roundId: string) =>
    request<{ ok: boolean; markedLate: number }>(
      `/api/v1/rounds/${encodeURIComponent(roundId)}/mark-overdue`,
      { method: 'POST' },
    ),
}
