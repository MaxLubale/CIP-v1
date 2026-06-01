import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResearchReports, useAssets, useGenerateReport } from '@/lib/api'
import {
  PageLoader, ErrorState, SectionHeader, EmptyState,
  DisclaimerBanner, LoadingSpinner
} from '@/components/ui/shared'
import { formatDate } from '@/lib/utils'
import { FileText, Bot, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import type { ResearchReport } from '@/types'

function ReportCard({ report, defaultOpen = false }: { report: ResearchReport; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const navigate = useNavigate()

  return (
    <div className="cip-card overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          {report.asset?.image_url && (
            <img src={report.asset.image_url} className="w-7 h-7 rounded-full" alt="" />
          )}
          <div>
            <div className="text-sm font-medium text-foreground font-mono">
              {report.asset?.name ?? `Asset #${report.asset_id}`}
              <span className="ml-2 text-muted-foreground text-xs">{report.asset?.symbol}</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Bot className="w-3 h-3" />
              {report.model_used ?? 'AI Generated'} · {formatDate(report.generated_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/assets/${report.asset?.coingecko_id}`) }}
            className="text-[10px] font-mono text-primary hover:underline"
          >
            Full Detail →
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="border-t border-border p-4 space-y-4 animate-fade-in">
          {report.executive_summary && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-2">Executive Summary</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.executive_summary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {report.key_opportunities && report.key_opportunities.length > 0 && (
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-2">Opportunities</div>
                <ul className="space-y-1.5">
                  {report.key_opportunities.map((o, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                      <span className="text-emerald-400 font-mono flex-shrink-0">{i + 1}.</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.key_risks && report.key_risks.length > 0 && (
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-red-400 mb-2">Risks</div>
                <ul className="space-y-1.5">
                  {report.key_risks.map((r, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                      <span className="text-red-400 font-mono flex-shrink-0">{i + 1}.</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {report.ecosystem_health && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 mb-2">Ecosystem Health</div>
              <p className="text-sm text-muted-foreground">{report.ecosystem_health}</p>
            </div>
          )}
          {report.research_notes && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Research Notes</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.research_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ResearchPage() {
  const { data: reports, isLoading, isError, error, refetch } = useResearchReports()
  const { data: assets } = useAssets(20)
  const generateReport = useGenerateReport()
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />

  const handleGenerate = () => {
    const asset = assets?.find(a => a.coingecko_id === selectedAssetId)
    if (asset) generateReport.mutate({ asset_id: asset.id })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold font-mono text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Research Reports
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          AI-generated market intelligence reports · Updated every 24 hours
        </p>
      </div>

      {/* Generate copilot */}
      <div className="cip-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">AI Research Copilot</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Select an asset to generate a fresh AI-powered research report with executive summary,
          opportunities, risks, and ecosystem analysis.
        </p>
        <div className="flex gap-3">
          <select
            value={selectedAssetId}
            onChange={e => setSelectedAssetId(e.target.value)}
            className="flex-1 bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">Select an asset...</option>
            {assets?.map(a => (
              <option key={a.coingecko_id} value={a.coingecko_id}>
                {a.name} ({a.symbol})
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={!selectedAssetId || generateReport.isPending}
            className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary rounded px-4 py-2 text-sm hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generateReport.isPending ? (
              <LoadingSpinner className="w-3.5 h-3.5" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Generate Report
          </button>
        </div>

        {generateReport.isSuccess && (
          <div className="mt-4 animate-fade-in">
            <ReportCard report={generateReport.data!} defaultOpen />
          </div>
        )}
        {generateReport.isError && (
          <p className="mt-3 text-xs text-red-400">
            Failed to generate report: {(generateReport.error as Error)?.message}
          </p>
        )}
      </div>

      {/* Existing reports */}
      <div>
        <SectionHeader
          title="Latest Reports"
          subtitle={`${reports?.length ?? 0} reports · One per asset`}
        />
        {!reports || reports.length === 0 ? (
          <EmptyState message="No reports yet. Reports are generated automatically every 24 hours, or use the copilot above." />
        ) : (
          <div className="space-y-3">
            {reports.map((report, i) => (
              <ReportCard key={report.id} report={report} defaultOpen={i === 0} />
            ))}
          </div>
        )}
      </div>

      <DisclaimerBanner text="All research reports are generated by AI from publicly available market data. They are for informational purposes only and do not constitute financial advice, investment recommendations, or any guarantee of returns. Always conduct independent research." />
    </div>
  )
}
