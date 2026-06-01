import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  DashboardAsset, AssetDetail, RiskScore,
  Alert, ResearchReport, CompareResult
} from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || ''

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Query Keys ─────────────────────────────────────────────────────────────

export const QK = {
  assets: ['assets'] as const,
  asset: (id: string) => ['asset', id] as const,
  riskScores: ['risk-scores'] as const,
  riskScore: (id: string) => ['risk-score', id] as const,
  alerts: (unreadOnly = false) => ['alerts', unreadOnly] as const,
  alertCount: ['alert-count'] as const,
  reports: ['research-reports'] as const,
  report: (id: string) => ['research-report', id] as const,
  compare: (a: string, b: string) => ['compare', a, b] as const,
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useAssets(limit = 20) {
  return useQuery({
    queryKey: QK.assets,
    queryFn: () => apiFetch<DashboardAsset[]>(`/assets/?limit=${limit}`),
    refetchInterval: 60_000, // refresh every minute
    staleTime: 30_000,
  })
}

export function useAsset(coingeckoId: string) {
  return useQuery({
    queryKey: QK.asset(coingeckoId),
    queryFn: () => apiFetch<AssetDetail>(`/assets/${coingeckoId}`),
    enabled: !!coingeckoId,
    staleTime: 30_000,
  })
}

export function useRiskScores() {
  return useQuery({
    queryKey: QK.riskScores,
    queryFn: () => apiFetch<RiskScore[]>('/risk-scores/'),
    staleTime: 60_000,
  })
}

export function useRiskScore(coingeckoId: string) {
  return useQuery({
    queryKey: QK.riskScore(coingeckoId),
    queryFn: () => apiFetch<RiskScore>(`/risk-scores/${coingeckoId}`),
    enabled: !!coingeckoId,
    staleTime: 60_000,
  })
}

export function useAlerts(unreadOnly = false) {
  return useQuery({
    queryKey: QK.alerts(unreadOnly),
    queryFn: () => apiFetch<Alert[]>(`/alerts/?unread_only=${unreadOnly}`),
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

export function useAlertCount() {
  return useQuery({
    queryKey: QK.alertCount,
    queryFn: () => apiFetch<{ unread_count: number }>('/alerts/unread-count'),
    refetchInterval: 30_000,
  })
}

export function useMarkAlertRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/alerts/${id}/read`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: QK.alertCount })
    },
  })
}

export function useResearchReports() {
  return useQuery({
    queryKey: QK.reports,
    queryFn: () => apiFetch<ResearchReport[]>('/research/reports'),
    staleTime: 300_000,
  })
}

export function useResearchReport(coingeckoId: string) {
  return useQuery({
    queryKey: QK.report(coingeckoId),
    queryFn: () => apiFetch<ResearchReport>(`/research/reports/${coingeckoId}`),
    enabled: !!coingeckoId,
    staleTime: 300_000,
    retry: false,
  })
}

export function useGenerateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ asset_id, force_refresh = false }: { asset_id: number; force_refresh?: boolean }) =>
      apiFetch<ResearchReport>('/research/generate', {
        method: 'POST',
        body: JSON.stringify({ asset_id, force_refresh }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.reports })
    },
  })
}

export function useCompare(assetA: string, assetB: string) {
  return useQuery({
    queryKey: QK.compare(assetA, assetB),
    queryFn: () =>
      apiFetch<CompareResult>(`/compare/?asset_a=${assetA}&asset_b=${assetB}`),
    enabled: !!assetA && !!assetB && assetA !== assetB,
    staleTime: 120_000,
  })
}
