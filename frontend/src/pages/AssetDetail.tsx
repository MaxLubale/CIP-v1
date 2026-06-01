import { useParams, useNavigate } from 'react-router-dom'
import { useAsset, useGenerateReport } from '@/lib/api'
import {
  PageLoader, ErrorState, MetricCard, RiskBadge, RiskGauge,
  DisclaimerBanner, SectionHeader, ChangePill, LoadingSpinner
} from '@/components/ui/shared'
import { formatPrice, formatCurrency, formatDate, formatPct } from '@/lib/utils'
import { ArrowLeft, Bot, RefreshCw, Link2, Layers } from 'lucide-react'

export default function AssetPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useAsset(id!)
  const generateReport = useGenerateReport()

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
  if (!data) return null

  const { asset, market, protocol, liquidity, risk, latest_report } = data

  const handleGenerate = () => {
    generateReport.mutate({ asset_id: asset.id, force_refresh: true })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {asset.image_url && (
              <img src={asset.image_url} alt={asset.symbol} className="w-10 h-10 rounded-full" />
            )}
            <div>
              <h1 className="text-xl font-semibold font-mono text-foreground">{asset.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono text-muted-foreground">{asset.symbol}</span>
                {asset.rank && (
                  <span className="text-[10px] font-mono bg-secondary border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                    #{asset.rank}
                  </span>
                )}
                <RiskBadge score={risk?.overall_risk} size="sm" />
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-foreground">
              {formatPrice(market?.price_usd)}
            </div>
            <ChangePill value={market?.price_change_24h} />
          </div>
        </div>
      </div>

      {/* Market Metrics */}
      <section>
        <SectionHeader title="Market Metrics" />
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Market Cap" value={formatCurrency(market?.market_cap)} />
          <MetricCard label="24h Volume" value={formatCurrency(market?.volume_24h)} />
          <MetricCard
            label="FDV"
            value={formatCurrency(market?.fdv)}
            sub="Fully Diluted"
          />
          <MetricCard
            label="7d Change"
            value={formatPct(market?.price_change_7d)}
            trend={market?.price_change_7d}
          />
        </div>
      </section>

      {/* Protocol + Liquidity */}
      <div className="grid grid-cols-2 gap-6">
        {/* Protocol */}
        <section>
          <SectionHeader title="Protocol Metrics" subtitle="DeFi protocol data via DefiLlama" />
          <div className="cip-card p-4 space-y-3">
            {protocol ? (
              <>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">TVL</span>
                  <span className="text-sm font-mono font-semibold text-foreground">{formatCurrency(protocol.tvl)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">TVL Change 24h</span>
                  <ChangePill value={protocol.tvl_change_24h} />
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">TVL Change 7d</span>
                  <ChangePill value={protocol.tvl_change_7d} />
                </div>
                {protocol.category && (
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Category</span>
                    <span className="text-xs font-mono text-foreground">{protocol.category}</span>
                  </div>
                )}
                {protocol.chain_tvls && Object.keys(protocol.chain_tvls).length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center gap-1 mb-2">
                      <Layers className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Chain Distribution</span>
                    </div>
                    {Object.entries(protocol.chain_tvls)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 4)
                      .map(([chain, value]) => (
                        <div key={chain} className="flex justify-between items-center mb-1">
                          <span className="text-xs text-muted-foreground capitalize">{chain}</span>
                          <span className="text-xs font-mono text-foreground">{formatCurrency(value)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No DeFi protocol data found for this asset.</p>
            )}
          </div>
        </section>

        {/* Liquidity */}
        <section>
          <SectionHeader title="Liquidity Metrics" subtitle="DEX liquidity via DexScreener" />
          <div className="cip-card p-4 space-y-3">
            {liquidity ? (
              <>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Total DEX Liquidity</span>
                  <span className="text-sm font-mono font-semibold text-foreground">
                    {formatCurrency(liquidity.total_liquidity)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">DEX Volume 24h</span>
                  <span className="text-sm font-mono text-foreground">{formatCurrency(liquidity.volume_24h)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Vol/Liq Ratio</span>
                  <span className="text-sm font-mono text-foreground">
                    {liquidity.volume_liquidity_ratio?.toFixed(2) ?? '—'}x
                  </span>
                </div>
                {liquidity.top_dex && (
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Top DEX</span>
                    <span className="text-xs font-mono text-foreground capitalize">{liquidity.top_dex}</span>
                  </div>
                )}
                {liquidity.top_pair_address && (
                  <div className="flex items-center gap-1 pt-2 border-t border-border">
                    <Link2 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground truncate">
                      {liquidity.top_pair_address.slice(0, 20)}…
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No DEX liquidity data available.</p>
            )}
          </div>
        </section>
      </div>

      {/* Risk Scores */}
      {risk && (
        <section>
          <SectionHeader title="Risk Analysis" />
          <div className="cip-card p-5">
            <div className="grid grid-cols-4 gap-6 mb-5">
              {[
                { label: 'Liquidity Risk', score: risk.liquidity_risk },
                { label: 'Concentration Risk', score: risk.concentration_risk },
                { label: 'Ecosystem Risk', score: risk.ecosystem_risk },
                { label: 'Overall Risk', score: risk.overall_risk },
              ].map(({ label, score }) => (
                <div key={label} className="text-center">
                  <RiskGauge score={score} label={label} />
                </div>
              ))}
            </div>
            {risk.overall_explanation && (
              <p className="text-xs text-muted-foreground border-t border-border pt-3">
                {risk.overall_explanation}
              </p>
            )}
          </div>
        </section>
      )}

      {/* AI Research Summary */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="AI Research Summary" subtitle="Generated by DeepSeek via OpenRouter" />
          <button
            onClick={handleGenerate}
            disabled={generateReport.isPending}
            className="flex items-center gap-1.5 text-xs border border-primary/30 text-primary rounded px-3 py-1.5 hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {generateReport.isPending ? (
              <LoadingSpinner className="w-3 h-3" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {latest_report ? 'Regenerate' : 'Generate Report'}
          </button>
        </div>

        {generateReport.isSuccess && (
          <ResearchReportCard report={generateReport.data!} />
        )}
        {!generateReport.isSuccess && latest_report && (
          <ResearchReportCard report={latest_report} />
        )}
        {!generateReport.isSuccess && !latest_report && (
          <div className="cip-card p-6 text-center">
            <Bot className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No research report available. Click "Generate Report" to create one.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

function ResearchReportCard({ report }: { report: any }) {
  return (
    <div className="space-y-4">
      <div className="cip-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono text-primary uppercase tracking-wider">Executive Summary</span>
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">
            {formatDate(report.generated_at)}
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{report.executive_summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {report.key_opportunities?.length > 0 && (
          <div className="cip-card p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-3">
              Key Opportunities
            </div>
            <ul className="space-y-2">
              {report.key_opportunities.map((o: string, i: number) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-emerald-400 flex-shrink-0 font-mono">{i + 1}.</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}
        {report.key_risks?.length > 0 && (
          <div className="cip-card p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-red-400 mb-3">
              Key Risks
            </div>
            <ul className="space-y-2">
              {report.key_risks.map((r: string, i: number) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-red-400 flex-shrink-0 font-mono">{i + 1}.</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {report.ecosystem_health && (
        <div className="cip-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 mb-2">Ecosystem Health</div>
          <p className="text-sm text-muted-foreground">{report.ecosystem_health}</p>
        </div>
      )}

      {report.research_notes && (
        <div className="cip-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Research Notes</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{report.research_notes}</p>
        </div>
      )}

      <DisclaimerBanner text={report.disclaimer} />
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
