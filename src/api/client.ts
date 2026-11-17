import type { Problem } from './types'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

/** How long a request may take before we tell the shopper the free server is waking up. */
const SLOW_AFTER_MS = 4000

export class ApiError extends Error {
  readonly status: number
  readonly problem: Problem | undefined

  constructor(status: number, message: string, problem?: Problem) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }

  /** Field-level messages from a 400 validation error, if there were any. */
  get fieldErrors(): Record<string, string> {
    return this.problem?.errors ?? {}
  }
}

let token: string | null = null
let onUnauthorized: (() => void) | null = null

export function setToken(value: string | null) {
  token = value
}

/** Called when the server rejects our token, so the app can log out instead of failing quietly. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

// The free Render instance sleeps when idle and needs up to a minute to wake.
// Any slow request flips this flag so the layout can explain the wait.
type SlowListener = (slow: boolean) => void
const slowListeners = new Set<SlowListener>()
let slowRequests = 0

export function subscribeSlow(listener: SlowListener): () => void {
  slowListeners.add(listener)
  return () => slowListeners.delete(listener)
}

function changeSlow(delta: number) {
  slowRequests += delta
  slowListeners.forEach((listener) => listener(slowRequests > 0))
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | undefined | null>
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(BASE_URL + path)
  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let markedSlow = false
  const timer = setTimeout(() => {
    markedSlow = true
    changeSlow(1)
  }, SLOW_AFTER_MS)

  let response: Response
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError(0, 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại nhé.')
  } finally {
    clearTimeout(timer)
    if (markedSlow) {
      changeSlow(-1)
    }
  }

  if (response.status === 204) {
    return undefined as T
  }

  const isJson = response.headers.get('content-type')?.includes('json') ?? false
  const data: unknown = isJson ? await response.json() : undefined

  if (!response.ok) {
    const problem = (data ?? {}) as Problem
    if (response.status === 401 && token) {
      onUnauthorized?.()
    }
    throw new ApiError(response.status, problem.detail ?? problem.title ?? `Lỗi ${response.status}`, problem)
  }
  return data as T
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return 'Đã có lỗi xảy ra. Thử lại sau nhé.'
}
