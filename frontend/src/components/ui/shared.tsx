import { cn, riskLevel, riskColor, riskLabel, formatPct } from '@/lib/utils'
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { RiskLevel } from '@/types'

// ── Risk Badge ─────────────────────────────────────────────────────────────

interface RiskBadgeProps {
  score: number | null | undefined
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function RiskBadge({ score, showLabel = true, size = 'md' }: RiskBadgeProps) {
  const level = riskLevel(score)
  const label = riskLabel(score)
  const colorMap: Record<RiskLevel, string> = {
    low: 'text-green-400 bg-green-400/10 border-green-400/25',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
    high: 'text-red-400 bg-red-400/10 border-red-400/25',
    critical: 'text-red-500 bg-red-500/15 border-red-500/35',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono border rounded',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
        colorMap[level]
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: riskColor(level) }} />
      {showLabel && (score != null ? (
        <>
          {score.toFixed(0)}
          <span className="opacity-60">/{label}</span>
        </>
      ) : '—')}
    </span>
  )
}

// ── Risk Gauge ─────────────────────────────────────────────────────────────

export function RiskGauge({ score, label }: { score: number; label: string }) {
  const level = riskLevel(score)
  const color = riskColor(level)
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-mono" style={{ color }}>{score.toFixed(0)}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ── Metric Card ────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  icon?: React.ReactNode
  trend?: number | null
}

export function MetricCard({ label, value, sub, icon, trend }: MetricCardProps) {
  return (
    <div className="cip-card p-4">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{label}</span>
        {icon && <div className="text-muted-foreground/50">{icon}</div>}
      </div>
      <div className="text-xl font-mono font-semibold text-foreground">{value}</div>
      {(sub || trend != null) && (
        <div className="flex items-center gap-2 mt-1">
          {trend != null && (
            <span className={cn('text-xs font-mono flex items-center gap-0.5', trend >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatPct(trend)}
            </span>
          )}
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
      )}
    </div>
  )
}

// ── Change Pill ────────────────────────────────────────────────────────────

export function ChangePill({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-muted-foreground text-xs">—</span>
  const positive = value >= 0
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-mono',
      positive ? 'text-emerald-400' : 'text-red-400'
    )}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? '+' : ''}{value.toFixed(2)}%
    </span>
  )
}

// ── Loading States ─────────────────────────────────────────────────────────

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-primary', className)} />
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner className="w-8 h-8" />
        <span className="text-sm text-muted-foreground font-mono">Loading data...</span>
      </div>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Failed to load data</p>
        <p className="text-xs text-muted-foreground mt-1">{message || 'Please try again'}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-primary border border-primary/30 rounded px-3 py-1.5 hover:bg-primary/10 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────

export function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-2">
      <Minus className="w-8 h-8 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// ── Section Header ─────────────────────────────────────────────────────────

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground font-mono uppercase tracking-wider">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Disclaimer Banner ──────────────────────────────────────────────────────

export function DisclaimerBanner({ text }: { text: string }) {
  return (
    <div className="cip-card p-3 border-yellow-500/20 bg-yellow-500/5">
      <p className="text-xs text-yellow-400/80 leading-relaxed">⚠️ {text}</p>
    </div>
  )
}
