import { useNavigate } from 'react-router-dom'
import { useRiskScores } from '@/lib/api'
import { PageLoader, ErrorState, RiskBadge, RiskGauge, SectionHeader } from '@/components/ui/shared'
import { riskLevel, riskColor } from '@/lib/utils'
import { ShieldAlert } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

export default function RiskPage() {
  const navigate = useNavigate()
  const { data: scores, isLoading, isError, error, refetch } = useRiskScores()

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />

  const chartData = (scores ?? []).slice(0, 15).map(s => ({
    name: s.asset?.symbol ?? `#${s.asset_id}`,
    overall: s.overall_risk,
    liquidity: s.liquidity_risk,
    concentration: s.concentration_risk,
    ecosystem: s.ecosystem_risk,
    id: s.asset?.coingecko_id,
  }))

  const critical = scores?.filter(s => riskLevel(s.overall_risk) === 'critical') ?? []
  const high = scores?.filter(s => riskLevel(s.overall_risk) === 'high') ?? []

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold font-mono text-foreground flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          Risk Monitor
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Risk scores computed from liquidity, concentration, and ecosystem metrics
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Tracked', value: scores?.length ?? 0, color: 'text-foreground' },
          { label: 'Critical Risk', value: critical.length, color: 'text-red-500' },
          { label: 'High Risk', value: high.length, color: 'text-red-400' },
          {
            label: 'Avg Overall Risk',
            value: scores?.length
              ? (scores.reduce((s, r) => s + r.overall_risk, 0) / scores.length).toFixed(1)
              : '—',
            color: 'text-yellow-400',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="cip-card p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
            <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="cip-card p-5">
        <SectionHeader title="Overall Risk by Asset" subtitle="Top 15 assets sorted by risk score" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: 6, fontSize: 11 }}
              labelStyle={{ color: '#aaa' }}
              formatter={(v: number) => [v.toFixed(1), 'Risk Score']}
            />
            <Bar dataKey="overall" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={riskColor(riskLevel(entry.overall))} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full table */}
      <div className="cip-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <SectionHeader title="All Risk Scores" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Asset', 'Liquidity Risk', 'Concentration Risk', 'Ecosystem Risk', 'Overall Risk'].map(h => (
                  <th key={h} className={`py-2.5 px-4 text-[10px] font-mono uppercase tracking-wider text-muted-foreground ${h === 'Asset' ? 'text-left' : 'text-center'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scores?.map(score => (
                <tr
                  key={score.id}
                  className="border-b border-border hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => score.asset && navigate(`/assets/${score.asset.coingecko_id}`)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {score.asset?.image_url && (
                        <img src={score.asset.image_url} className="w-5 h-5 rounded-full" alt="" />
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {score.asset?.name ?? `Asset #${score.asset_id}`}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {score.asset?.symbol}
                      </span>
                    </div>
                  </td>
                  {[score.liquidity_risk, score.concentration_risk, score.ecosystem_risk, score.overall_risk].map((s, i) => (
                    <td key={i} className="py-3 px-4">
                      <div className="flex flex-col items-center gap-1">
                        <RiskBadge score={s} size="sm" />
                        <div className="w-20">
                          <div className="h-1 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${s}%`, backgroundColor: riskColor(riskLevel(s)) }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanation */}
      <div className="cip-card p-5">
        <SectionHeader title="Risk Score Methodology" />
        <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground leading-relaxed">
          <div>
            <div className="text-foreground font-medium mb-1 font-mono">Liquidity Risk (40%)</div>
            Measures depth of DEX liquidity pools relative to market cap. Low liquidity amplifies price impact and creates exit risk.
          </div>
          <div>
            <div className="text-foreground font-medium mb-1 font-mono">Concentration Risk (30%)</div>
            Evaluates market cap rank and single-chain TVL concentration. Assets on few chains or with small caps face higher concentration risk.
          </div>
          <div>
            <div className="text-foreground font-medium mb-1 font-mono">Ecosystem Risk (30%)</div>
            Combines TVL trends, Fear &amp; Greed index, and price momentum. Declining TVL or extreme market sentiment increases this score.
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-3 border-t border-border pt-3">
          Risk scores range from 0 (lowest risk) to 100 (highest risk). These are quantitative indicators only and do not constitute investment advice.
        </p>
      </div>
    </div>
  )
}
