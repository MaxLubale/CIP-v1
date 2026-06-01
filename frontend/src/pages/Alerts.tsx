import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlerts, useMarkAlertRead } from '@/lib/api'
import { PageLoader, ErrorState, SectionHeader, EmptyState } from '@/components/ui/shared'
import { alertSeverityColor, alertTypeLabel, formatDate, cn } from '@/lib/utils'
import { Bell, CheckCheck, TrendingDown, BarChart2, Droplets, Brain } from 'lucide-react'

const ALERT_ICONS: Record<string, React.ElementType> = {
  liquidity_drop: Droplets,
  tvl_drop: TrendingDown,
  volume_spike: BarChart2,
  sentiment_change: Brain,
}

export default function AlertsPage() {
  const navigate = useNavigate()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const { data: alerts, isLoading, isError, error, refetch } = useAlerts(unreadOnly)
  const markRead = useMarkAlertRead()

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />

  const bySeverity = {
    critical: alerts?.filter(a => a.severity === 'critical').length ?? 0,
    high: alerts?.filter(a => a.severity === 'high').length ?? 0,
    medium: alerts?.filter(a => a.severity === 'medium').length ?? 0,
    low: alerts?.filter(a => a.severity === 'low').length ?? 0,
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold font-mono text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Alert Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated alerts for significant market changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUnreadOnly(v => !v)}
            className={cn(
              'text-xs border rounded px-3 py-1.5 transition-colors font-mono',
              unreadOnly
                ? 'border-primary/40 text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {unreadOnly ? 'Showing Unread' : 'All Alerts'}
          </button>
        </div>
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Critical', key: 'critical', cls: 'text-red-500' },
          { label: 'High', key: 'high', cls: 'text-red-400' },
          { label: 'Medium', key: 'medium', cls: 'text-yellow-400' },
          { label: 'Low', key: 'low', cls: 'text-green-400' },
        ].map(({ label, key, cls }) => (
          <div key={key} className="cip-card p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
            <div className={`text-2xl font-mono font-bold ${cls}`}>
              {bySeverity[key as keyof typeof bySeverity]}
            </div>
          </div>
        ))}
      </div>

      {/* Alert list */}
      <div className="cip-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <SectionHeader title={`Alerts (${alerts?.length ?? 0})`} />
          {alerts && alerts.some(a => !a.is_read) && (
            <button
              onClick={() => alerts.filter(a => !a.is_read).forEach(a => markRead.mutate(a.id))}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2.5 py-1.5 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {(!alerts || alerts.length === 0) ? (
          <EmptyState message={unreadOnly ? 'No unread alerts' : 'No alerts yet — data is being monitored'} />
        ) : (
          <div className="divide-y divide-border">
            {alerts.map(alert => {
              const Icon = ALERT_ICONS[alert.alert_type] ?? Bell
              const severityClass = alertSeverityColor(alert.severity)

              return (
                <div
                  key={alert.id}
                  className={cn(
                    'p-4 flex gap-3 transition-colors hover:bg-secondary/20',
                    !alert.is_read && 'bg-primary/3'
                  )}
                >
                  {/* Icon */}
                  <div className={cn('mt-0.5 w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border', severityClass)}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{alert.title}</span>
                        {!alert.is_read && (
                          <span className="text-[10px] font-mono bg-primary/15 text-primary border border-primary/25 rounded px-1.5 py-0.5">
                            NEW
                          </span>
                        )}
                        <span className={cn('text-[10px] font-mono border rounded px-1.5 py-0.5', severityClass)}>
                          {alertTypeLabel(alert.alert_type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                          {formatDate(alert.triggered_at)}
                        </span>
                        {!alert.is_read && (
                          <button
                            onClick={() => markRead.mutate(alert.id)}
                            className="text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                    {alert.change_pct != null && (
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-mono text-muted-foreground/60">
                          Change: <span className={alert.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {alert.change_pct >= 0 ? '+' : ''}{alert.change_pct.toFixed(1)}%
                          </span>
                        </span>
                        {alert.asset && (
                          <button
                            onClick={() => navigate(`/assets/${alert.asset!.coingecko_id}`)}
                            className="text-[10px] font-mono text-primary hover:underline"
                          >
                            View {alert.asset.symbol} →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="cip-card p-5">
        <SectionHeader title="Alert Triggers" />
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="space-y-2">
            <div className="flex gap-2"><Droplets className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" /><span><strong className="text-foreground">Liquidity Drop:</strong> DEX liquidity falls by 20% or more between hourly snapshots.</span></div>
            <div className="flex gap-2"><TrendingDown className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" /><span><strong className="text-foreground">TVL Drop:</strong> Protocol TVL declines by 15% or more between 6-hour snapshots.</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2"><BarChart2 className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" /><span><strong className="text-foreground">Volume Spike:</strong> 24h trading volume increases by 200%+ compared to previous snapshot.</span></div>
            <div className="flex gap-2"><Brain className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" /><span><strong className="text-foreground">Sentiment Change:</strong> Fear &amp; Greed Index shifts by 20+ points in either direction.</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
