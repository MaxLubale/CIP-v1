import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { RiskLevel } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined, decimals = 2): string {
  if (value == null) return '—'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`
  return `$${value.toFixed(decimals)}`
}

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return '—'
  if (value >= 1000) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (value >= 1) return `$${value.toFixed(4)}`
  if (value >= 0.01) return `$${value.toFixed(6)}`
  return `$${value.toFixed(8)}`
}

export function formatPct(value: number | null | undefined, showSign = true): string {
  if (value == null) return '—'
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function riskLevel(score: number | null | undefined): RiskLevel {
  if (score == null) return 'medium'
  if (score < 30) return 'low'
  if (score < 55) return 'medium'
  if (score < 75) return 'high'
  return 'critical'
}

export function riskColor(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  }
  return map[level]
}

export function riskLabel(score: number | null | undefined): string {
  const level = riskLevel(score)
  return level.charAt(0).toUpperCase() + level.slice(1)
}

export function alertSeverityColor(severity: string): string {
  const map: Record<string, string> = {
    low: 'text-green-400 bg-green-400/10 border-green-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    high: 'text-red-400 bg-red-400/10 border-red-400/20',
    critical: 'text-red-500 bg-red-500/15 border-red-500/30',
  }
  return map[severity] || map.medium
}

export function alertTypeLabel(type: string): string {
  const map: Record<string, string> = {
    liquidity_drop: 'Liquidity Drop',
    tvl_drop: 'TVL Drop',
    volume_spike: 'Volume Spike',
    sentiment_change: 'Sentiment Change',
  }
  return map[type] || type
}

export function fgiColor(value: number | null): string {
  if (value == null) return '#888'
  if (value <= 20) return '#ef4444'
  if (value <= 40) return '#f97316'
  if (value <= 60) return '#eab308'
  if (value <= 80) return '#84cc16'
  return '#22c55e'
}
