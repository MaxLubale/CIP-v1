"""Pydantic schemas for API request/response validation."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ── Asset ──────────────────────────────────────────────────────────────────

class AssetBase(BaseModel):
    coingecko_id: str
    symbol: str
    name: str
    image_url: Optional[str] = None
    rank: Optional[int] = None


class AssetOut(AssetBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Market Metrics ─────────────────────────────────────────────────────────

class MarketMetricsOut(BaseModel):
    id: int
    asset_id: int
    price_usd: Optional[float] = None
    market_cap: Optional[float] = None
    volume_24h: Optional[float] = None
    fdv: Optional[float] = None
    price_change_24h: Optional[float] = None
    price_change_7d: Optional[float] = None
    market_cap_rank: Optional[int] = None
    fear_greed_index: Optional[int] = None
    fear_greed_label: Optional[str] = None
    snapshot_at: datetime

    model_config = {"from_attributes": True}


# ── Protocol Metrics ───────────────────────────────────────────────────────

class ProtocolMetricsOut(BaseModel):
    id: int
    asset_id: int
    tvl: Optional[float] = None
    tvl_change_24h: Optional[float] = None
    tvl_change_7d: Optional[float] = None
    chain_tvls: Optional[Dict[str, float]] = None
    protocol_slug: Optional[str] = None
    category: Optional[str] = None
    snapshot_at: datetime

    model_config = {"from_attributes": True}


# ── Liquidity Metrics ──────────────────────────────────────────────────────

class LiquidityMetricsOut(BaseModel):
    id: int
    asset_id: int
    total_liquidity: Optional[float] = None
    volume_24h: Optional[float] = None
    volume_liquidity_ratio: Optional[float] = None
    top_pair_address: Optional[str] = None
    top_dex: Optional[str] = None
    snapshot_at: datetime

    model_config = {"from_attributes": True}


# ── Risk Score ─────────────────────────────────────────────────────────────

class RiskScoreOut(BaseModel):
    id: int
    asset_id: int
    liquidity_risk: float = Field(ge=0, le=100)
    concentration_risk: float = Field(ge=0, le=100)
    ecosystem_risk: float = Field(ge=0, le=100)
    overall_risk: float = Field(ge=0, le=100)
    liquidity_explanation: Optional[str] = None
    concentration_explanation: Optional[str] = None
    ecosystem_explanation: Optional[str] = None
    overall_explanation: Optional[str] = None
    computed_at: datetime
    asset: Optional[AssetOut] = None

    model_config = {"from_attributes": True}


# ── Alert ──────────────────────────────────────────────────────────────────

class AlertOut(BaseModel):
    id: int
    asset_id: int
    alert_type: str
    severity: str
    title: str
    message: str
    metric_before: Optional[float] = None
    metric_after: Optional[float] = None
    change_pct: Optional[float] = None
    is_read: bool
    triggered_at: datetime
    asset: Optional[AssetOut] = None

    model_config = {"from_attributes": True}


# ── Research Report ────────────────────────────────────────────────────────

class ResearchReportOut(BaseModel):
    id: int
    asset_id: int
    executive_summary: Optional[str] = None
    key_opportunities: Optional[List[str]] = None
    key_risks: Optional[List[str]] = None
    ecosystem_health: Optional[str] = None
    research_notes: Optional[str] = None
    model_used: Optional[str] = None
    disclaimer: str
    generated_at: datetime
    asset: Optional[AssetOut] = None

    model_config = {"from_attributes": True}


class ResearchGenerateRequest(BaseModel):
    asset_id: int
    force_refresh: bool = False


# ── Composite Asset Detail ─────────────────────────────────────────────────

class AssetDetailOut(BaseModel):
    asset: AssetOut
    market: Optional[MarketMetricsOut] = None
    protocol: Optional[ProtocolMetricsOut] = None
    liquidity: Optional[LiquidityMetricsOut] = None
    risk: Optional[RiskScoreOut] = None
    latest_report: Optional[ResearchReportOut] = None


# ── Dashboard Asset ────────────────────────────────────────────────────────

class DashboardAssetOut(BaseModel):
    id: int
    coingecko_id: str
    symbol: str
    name: str
    image_url: Optional[str] = None
    rank: Optional[int] = None
    price_usd: Optional[float] = None
    market_cap: Optional[float] = None
    volume_24h: Optional[float] = None
    price_change_24h: Optional[float] = None
    fear_greed_index: Optional[int] = None
    fear_greed_label: Optional[str] = None
    overall_risk: Optional[float] = None


# ── Compare ────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    asset_a_id: str  # coingecko_id
    asset_b_id: str  # coingecko_id


class CompareOut(BaseModel):
    asset_a: AssetDetailOut
    asset_b: AssetDetailOut
    ai_analysis: Optional[str] = None
    disclaimer: str = "This comparison is for informational purposes only and does not constitute investment advice."


# ── Pagination ─────────────────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int
