import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssets } from '@/lib/api'
import { PageLoader, ErrorState, RiskBadge, ChangePill } from '@/components/ui/shared'
import { formatPrice, formatCurrency, fgiColor } from '@/lib/utils'
import { Search, SlidersHorizontal } from 'lucide-react'

type SortKey = 'rank' | 'price_change_24h' | 'market_cap' | 'volume_24h' | 'overall_risk'

export default function AssetsPage() {
  const navigate = useNavigate()
  const { data: assets, isLoading, isError, error, refetch } = useAssets(20)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = (assets ?? [])
    .filter(a =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.symbol.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const va = (a as any)[sortKey] ?? (sortDir === 'asc' ? Infinity : -Infinity)
      const vb = (b as any)[sortKey] ?? (sortDir === 'asc' ? Infinity : -Infinity)
      return sortDir === 'asc' ? va - vb : vb - va
    })

  const SortTh = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      className="py-2.5 px-4 text-right text-[10px] font-mono uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground select-none"
      onClick={() => handleSort(k)}
    >
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  )

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold font-mono text-foreground flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Assets
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} of {assets?.length ?? 0} assets · Click any row for full detail
          </p>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="cip-card p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or symbol..."
            className="w-full bg-secondary border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="font-mono">Sort: {sortKey.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Table */}
      <div className="cip-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2.5 px-4 text-left text-[10px] font-mono uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('rank')}>
                  # {sortKey === 'rank' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-2.5 px-4 text-left text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Asset</th>
                <th className="py-2.5 px-4 text-right text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Price</th>
                <SortTh k="price_change_24h" label="24h %" />
                <SortTh k="market_cap" label="Market Cap" />
                <SortTh k="volume_24h" label="Volume 24h" />
                <th className="py-2.5 px-4 text-right text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Sentiment</th>
                <SortTh k="overall_risk" label="Risk" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(asset => (
                <tr
                  key={asset.id}
                  className="border-b border-border hover:bg-secondary/30 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/assets/${asset.coingecko_id}`)}
                >
                  <td className="py-3 px-4 text-xs font-mono text-muted-foreground">{asset.rank ?? '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      {asset.image_url ? (
                        <img src={asset.image_url} alt={asset.symbol} className="w-6 h-6 rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-secondary flex-shrink-0" />
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
                    {asset.fear_greed_index != null ? (
                      <span
                        className="text-xs font-mono"
                        style={{ color: fgiColor(asset.fear_greed_index) }}
                      >
                        {asset.fear_greed_index} · {asset.fear_greed_label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <RiskBadge score={asset.overall_risk} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No assets match "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
