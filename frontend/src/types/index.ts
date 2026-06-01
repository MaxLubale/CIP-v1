// ── Core Types ────────────────────────────────────────────────────────────

export interface Asset {
  id: number
  coingecko_id: string
  symbol: string
  name: string
  image_url: string | null
  rank: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MarketMetrics {
  id: number
  asset_id: number
  price_usd: number | null
  market_cap: number | null
  volume_24h: number | null
  fdv: number | null
  price_change_24h: number | null
  price_change_7d: number | null
  market_cap_rank: number | null
  fear_greed_index: number | null
  fear_greed_label: string | null
  snapshot_at: string
}

export interface ProtocolMetrics {
  id: number
  asset_id: number
  tvl: number | null
  tvl_change_24h: number | null
  tvl_change_7d: number | null
  chain_tvls: Record<string, number> | null
  protocol_slug: string | null
  category: string | null
  snapshot_at: string
}

export interface LiquidityMetrics {
  id: number
  asset_id: number
  total_liquidity: number | null
  volume_24h: number | null
  volume_liquidity_ratio: number | null
  top_pair_address: string | null
  top_dex: string | null
  snapshot_at: string
}

export interface RiskScore {
  id: number
  asset_id: number
  liquidity_risk: number
  concentration_risk: number
  ecosystem_risk: number
  overall_risk: number
  liquidity_explanation: string | null
  concentration_explanation: string | null
  ecosystem_explanation: string | null
  overall_explanation: string | null
  computed_at: string
  asset?: Asset
}

export interface Alert {
  id: number
  asset_id: number
  alert_type: 'liquidity_drop' | 'tvl_drop' | 'volume_spike' | 'sentiment_change'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  metric_before: number | null
  metric_after: number | null
  change_pct: number | null
  is_read: boolean
  triggered_at: string
  asset?: Asset
}

export interface ResearchReport {
  id: number
  asset_id: number
  executive_summary: string | null
  key_opportunities: string[] | null
  key_risks: string[] | null
  ecosystem_health: string | null
  research_notes: string | null
  model_used: string | null
  disclaimer: string
  generated_at: string
  asset?: Asset
}

// ── Composite ─────────────────────────────────────────────────────────────

export interface AssetDetail {
  asset: Asset
  market: MarketMetrics | null
  protocol: ProtocolMetrics | null
  liquidity: LiquidityMetrics | null
  risk: RiskScore | null
  latest_report: ResearchReport | null
}

export interface DashboardAsset {
  id: number
  coingecko_id: string
  symbol: string
  name: string
  image_url: string | null
  rank: number | null
  price_usd: number | null
  market_cap: number | null
  volume_24h: number | null
  price_change_24h: number | null
  fear_greed_index: number | null
  fear_greed_label: string | null
  overall_risk: number | null
}

export interface CompareResult {
  asset_a: AssetDetail
  asset_b: AssetDetail
  ai_analysis: string | null
  disclaimer: string
}

// ── Utility ───────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type AlertType = Alert['alert_type']
export type Severity = Alert['severity']
