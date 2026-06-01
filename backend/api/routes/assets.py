"""Assets API routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from repositories import (
    AssetRepository, MarketMetricsRepository, ProtocolMetricsRepository,
    LiquidityMetricsRepository, RiskScoreRepository, ResearchReportRepository
)
from schemas import DashboardAssetOut, AssetDetailOut, AssetOut

router = APIRouter()


@router.get("/", response_model=List[DashboardAssetOut])
async def list_assets(
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get top assets with latest market metrics for the dashboard."""
    asset_repo = AssetRepository(db)
    market_repo = MarketMetricsRepository(db)
    risk_repo = RiskScoreRepository(db)

    assets = await asset_repo.get_all_active(limit=limit)
    result = []

    for asset in assets:
        market = await market_repo.get_latest(asset.id)
        risk = await risk_repo.get_latest(asset.id)

        result.append(DashboardAssetOut(
            id=asset.id,
            coingecko_id=asset.coingecko_id,
            symbol=asset.symbol,
            name=asset.name,
            image_url=asset.image_url,
            rank=asset.rank,
            price_usd=market.price_usd if market else None,
            market_cap=market.market_cap if market else None,
            volume_24h=market.volume_24h if market else None,
            price_change_24h=market.price_change_24h if market else None,
            fear_greed_index=market.fear_greed_index if market else None,
            fear_greed_label=market.fear_greed_label if market else None,
            overall_risk=risk.overall_risk if risk else None,
        ))

    return result


@router.get("/{coingecko_id}", response_model=AssetDetailOut)
async def get_asset(
    coingecko_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get detailed asset information including all metrics."""
    asset_repo = AssetRepository(db)
    market_repo = MarketMetricsRepository(db)
    proto_repo = ProtocolMetricsRepository(db)
    liq_repo = LiquidityMetricsRepository(db)
    risk_repo = RiskScoreRepository(db)
    report_repo = ResearchReportRepository(db)

    asset = await asset_repo.get_by_coingecko_id(coingecko_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{coingecko_id}' not found")

    market = await market_repo.get_latest(asset.id)
    protocol = await proto_repo.get_latest(asset.id)
    liquidity = await liq_repo.get_latest(asset.id)
    risk = await risk_repo.get_latest(asset.id)
    report = await report_repo.get_latest(asset.id)

    from schemas import MarketMetricsOut, ProtocolMetricsOut, LiquidityMetricsOut, RiskScoreOut, ResearchReportOut

    def to_schema(obj, schema_class):
        if obj is None:
            return None
        return schema_class.model_validate(obj)

    asset_schema = AssetOut.model_validate(asset)

    return AssetDetailOut(
        asset=asset_schema,
        market=to_schema(market, MarketMetricsOut),
        protocol=to_schema(protocol, ProtocolMetricsOut),
        liquidity=to_schema(liquidity, LiquidityMetricsOut),
        risk=to_schema(risk, RiskScoreOut),
        latest_report=to_schema(report, ResearchReportOut),
    )
