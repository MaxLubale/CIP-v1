import { useState } from 'react'
import { useAssets, useCompare } from '@/lib/api'
import {
  PageLoader, ErrorState, RiskBadge, RiskGauge,
  DisclaimerBanner, SectionHeader, LoadingSpinner
} from '@/components/ui/shared'
import { formatCurrency, formatPrice, formatPct } from '@/lib/utils'
import { GitCompare, Bot, ArrowRightLeft } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

function AssetSelect({
  value, onChange, assets, label
}: {
  value: string; onChange: (v: string) => void
  assets: { coingecko_id: string; name: string; symbol: string }[]
  label: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
      >
        <option value="">Select an asset...</option>
        {assets.map(a => (
          <option key={a.coingecko_id} value={a.coingecko_id}>
            {a.name} ({a.symbol})
          </option>
        ))}
      </select>
    </div>
  )
}

function CompareMetric({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <tr className="border-b border-border">
      <td className="py-3 px-4 text-xs font-mono text-muted-foreground">{label}</td>
      <td className="py-3 px-4 text-right text-sm font-mono text-foreground">{a}</td>
      <td className="py-3 px-4 text-right text-sm font-mono text-foreground">{b}</td>
    </tr>
  )
}

export default function ComparePage() {
  const { data: assets } = useAssets(50)
  const [assetA, setAssetA] = useState('')
  const [assetB, setAssetB] = useState('')

  const { data: comparison, isLoading, isError, error } = useCompare(assetA, assetB)

  const radarData = comparison ? [
    {
      metric: 'Liq Risk',
      A: 100 - (comparison.asset_a.risk?.liquidity_risk ?? 50),
      B: 100 - (comparison.asset_b.risk?.liquidity_risk ?? 50),
    },
    {
      metric: 'Con Risk',
      A: 100 - (comparison.asset_a.risk?.concentration_risk ?? 50),
      B: 100 - (comparison.asset_b.risk?.concentration_risk ?? 50),
    },
    {
      metric: 'Eco Risk',
      A: 100 - (comparison.asset_a.risk?.ecosystem_risk ?? 50),
      B: 100 - (comparison.asset_b.risk?.ecosystem_risk ?? 50),
    },
    {
      metric: 'Mkt Cap',
      A: Math.min(100, (comparison.asset_a.market?.market_cap ?? 0) / 1e10),
      B: Math.min(100, (comparison.asset_b.market?.market_cap ?? 0) / 1e10),
    },
    {
      metric: 'TVL',
      A: Math.min(100, (comparison.asset_a.protocol?.tvl ?? 0) / 1e9),
      B: Math.min(100, (comparison.asset_b.protocol?.tvl ?? 0) / 1e9),
    },
  ] : []

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold font-mono text-foreground flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-primary" />
          Asset Comparison
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Compare two digital assets side-by-side</p>
      </div>

      {/* Asset selectors */}
      <div className="cip-card p-5">
        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
          <AssetSelect value={assetA} onChange={setAssetA} assets={assets ?? []} label="Asset A" />
          <div className="pb-2">
            <button
              onClick={() => { const tmp = assetA; setAssetA(assetB); setAssetB(tmp) }}
              className="w-8 h-8 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>
          <AssetSelect value={assetB} onChange={setAssetB} assets={assets ?? []} label="Asset B" />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="w-6 h-6" />
        </div>
      )}

      {isError && (
        <ErrorState message={(error as Error)?.message} />
      )}

      {comparison && !isLoading && (
        <>
          {/* Asset headers */}
          <div className="grid grid-cols-2 gap-4">
            {[comparison.asset_a, comparison.asset_b].map((detail) => (
              <div key={detail.asset.id} className="cip-card p-4 flex items-center gap-3">
                {detail.asset.image_url && (
                  <img src={detail.asset.image_url} alt={detail.asset.symbol} className="w-10 h-10 rounded-full" />
                )}
                <div>
                  <div className="font-semibold font-mono text-foreground">{detail.asset.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{detail.asset.symbol}</span>
                    <RiskBadge score={detail.risk?.overall_risk} size="sm" />
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-mono font-semibold text-foreground">{formatPrice(detail.market?.price_usd)}</div>
                  <div className={`text-xs font-mono ${(detail.market?.price_change_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatPct(detail.market?.price_change_24h)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison table + radar */}
          <div className="grid grid-cols-[1fr,300px] gap-6">
            <div className="cip-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <SectionHeader title="Metrics Comparison" />
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2.5 px-4 text-left text-[10px] font-mono uppercase text-muted-foreground">Metric</th>
                    <th className="py-2.5 px-4 text-right text-[10px] font-mono uppercase text-primary">{comparison.asset_a.asset.symbol}</th>
                    <th className="py-2.5 px-4 text-right text-[10px] font-mono uppercase text-blue-400">{comparison.asset_b.asset.symbol}</th>
                  </tr>
                </thead>
                <tbody>
                  <CompareMetric
                    label="Market Cap" 
                    a={formatCurrency(comparison.asset_a.market?.market_cap)} 
                    b={formatCurrency(comparison.asset_b.market?.market_cap)} 
                  />
                  <CompareMetric 
                    label="24h Volume"
                    a={formatCurrency(comparison.asset_a.market?.volume_24h)}
                    b={formatCurrency(comparison.asset_b.market?.volume_24h)}
                  />
                  <CompareMetric
                    label="TVL"
                    a={formatCurrency(comparison.asset_a.protocol?.tvl)}
                    b={formatCurrency(comparison.asset_b.protocol?.tvl)}
                  />
                  <CompareMetric
                    label="DEX Liquidity"
                    a={formatCurrency(comparison.asset_a.liquidity?.total_liquidity)}
                    b={formatCurrency(comparison.asset_b.liquidity?.total_liquidity)}
                  />
                  <CompareMetric
                    label="Liquidity Risk"
                    a={comparison.asset_a.risk?.liquidity_risk.toFixed(0) ?? '—'}
                    b={comparison.asset_b.risk?.liquidity_risk.toFixed(0) ?? '—'}
                  />
                  <CompareMetric
                    label="Overall Risk"
                    a={comparison.asset_a.risk?.overall_risk.toFixed(0) ?? '—'}
                    b={comparison.asset_b.risk?.overall_risk.toFixed(0) ?? '—'}
                  />
                </tbody>
              </table>
            </div>

            {/* Radar */}
            <div className="cip-card p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
                Profile (higher = better)
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#222" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#666', fontSize: 10 }} />
                  <Radar name={comparison.asset_a.asset.symbol} dataKey="A" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.2} />
                  <Radar name={comparison.asset_b.asset.symbol} dataKey="B" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.2} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: 6, fontSize: 11 }}
                    labelStyle={{ color: '#999' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-[10px] font-mono text-muted-foreground mt-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />{comparison.asset_a.asset.symbol}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />{comparison.asset_b.asset.symbol}</span>
              </div>
            </div>
          </div>

          {/* Risk gauges */}
          <div className="grid grid-cols-2 gap-4">
            {[comparison.asset_a, comparison.asset_b].map(detail => (
              detail.risk && (
                <div key={detail.asset.id} className="cip-card p-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
                    {detail.asset.symbol} Risk Profile
                  </div>
                  <div className="space-y-3">
                    <RiskGauge score={detail.risk.liquidity_risk} label="Liquidity Risk" />
                    <RiskGauge score={detail.risk.concentration_risk} label="Concentration Risk" />
                    <RiskGauge score={detail.risk.ecosystem_risk} label="Ecosystem Risk" />
                    <RiskGauge score={detail.risk.overall_risk} label="Overall Risk" />
                  </div>
                </div>
              )
            ))}
          </div>

          {/* AI Analysis */}
          {comparison.ai_analysis && (
            <section>
              <SectionHeader title="AI Comparative Analysis" subtitle="Generated by DeepSeek via OpenRouter" />
              <div className="cip-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono text-primary uppercase tracking-wider">Analysis</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {comparison.ai_analysis}
                </p>
              </div>
              <div className="mt-3">
                <DisclaimerBanner text={comparison.disclaimer} />
              </div>
            </section>
          )}
        </>
      )}

      {!assetA || !assetB ? (
        <div className="text-center py-16 text-muted-foreground">
          <GitCompare className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Select two assets above to compare them</p>
        </div>
      ) : null}
    </div>
  )
}
