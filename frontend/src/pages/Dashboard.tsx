import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssets } from '@/lib/api'
import {
  PageLoader, ErrorState, ChangePill, RiskBadge, SectionHeader
} from '@/components/ui/shared'
import { formatPrice, formatCurrency, fgiColor } from '@/lib/utils'
import { TrendingUp, Activity, Search } from 'lucide-react'
import type { DashboardAsset } from '@/types'

function FGIWidget({ value, label }: { value: number | null; label: string | null }) {
  const color = fgiColor(value)
  return (
    <div className="cip-card p-4 flex flex-col items-center justify-center text-center">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
        Fear & Greed
      </div>
      <div
        className="text-4xl font-mono font-bold mb-1"
        style={{ color }}
      >
        {value ?? '—'}
      </div>
      <div className="text-xs font-medium" style={{ color }}>
        {label || 'Neutral'}
      </div>
      <div className="mt-3 w-full h-1.5 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded-full relative">
        {value != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-background shadow-lg"
            style={{ left: `${value}%`, backgroundColor: color, transform: 'translate(-50%, -50%)' }}
          />
        )}
      </div>
    </div>
  )
}

function AssetRow({ asset, onClick }: { asset: DashboardAsset; onClick: () => void }) {
  return (
    <tr
      className="border-b border-border hover:bg-secondary/30 cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <td className="py-3 px-4 text-xs font-mono text-muted-foreground w-8">
        {asset.rank || '—'}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          {asset.image_url ? (
            <img src={asset.image_url} alt={asset.symbol} className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-mono text-muted-foreground">
              {asset.symbol[0]}
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {asset.name}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">{asset.symbol}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-right font-mono text-sm text-foreground">
        {formatPrice(asset.price_usd)}
      </td>
      <td className="py-3 px-4 text-right">
        <ChangePill value={asset.price_change_24h} />
      </td>
      <td className="py-3 px-4 text-right font-mono text-sm text-muted-foreground">
        {formatCurrency(asset.market_cap)}
      </td>
      <td className="py-3 px-4 text-right font-mono text-sm text-muted-foreground">
        {formatCurrency(asset.volume_24h)}
      </td>
      <td className="py-3 px-4 text-right">
        <RiskBadge score={asset.overall_risk} size="sm" />
      </td>
    </tr>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: assets, isLoading, isError, error, refetch } = useAssets(20)
  const [search, setSearch] = useState('')

  const firstAsset = assets?.[0]
  const fgiValue = firstAsset?.fear_greed_index ?? null
  const fgiLabel = firstAsset?.fear_greed_label ?? null

  const totalMarketCap = assets?.reduce((sum, a) => sum + (a.market_cap ?? 0), 0) ?? 0
  const totalVolume = assets?.reduce((sum, a) => sum + (a.volume_24h ?? 0), 0) ?? 0

  const filtered = search
    ? assets?.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.symbol.toLowerCase().includes(search.toLowerCase())
      )
    : assets

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground font-mono">Market Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Top 20 digital assets by market cap</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <Activity className="w-3 h-3 text-primary animate-pulse" />
          Live · refreshes every 60s
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <FGIWidget value={fgiValue} label={fgiLabel} />
        <div className="cip-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Total Market Cap (Top 20)
          </div>
          <div className="text-2xl font-mono font-bold text-foreground">
            {formatCurrency(totalMarketCap)}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Combined cap of displayed assets
          </div>
        </div>
        <div className="cip-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            24h Volume (Top 20)
          </div>
          <div className="text-2xl font-mono font-bold text-foreground">
            {formatCurrency(totalVolume)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Across all displayed assets
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="cip-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <SectionHeader title="Assets" subtitle={`${assets?.length ?? 0} assets tracked`} />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter assets..."
              className="bg-secondary border border-border rounded pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-48"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['#', 'Asset', 'Price', '24h', 'Market Cap', 'Volume 24h', 'Risk'].map(h => (
                  <th
                    key={h}
                    className={`py-2.5 px-4 text-[10px] font-mono uppercase tracking-wider text-muted-foreground ${
                      h === 'Asset' || h === '#' ? 'text-left' : 'text-right'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered?.map(asset => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  onClick={() => navigate(`/assets/${asset.coingecko_id}`)}
                />
              ))}
            </tbody>
          </table>
          {filtered?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No assets match "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
