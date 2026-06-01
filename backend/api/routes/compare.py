"""Comparison API route."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from repositories import (
    AssetRepository, MarketMetricsRepository, ProtocolMetricsRepository,
    LiquidityMetricsRepository, RiskScoreRepository, ResearchReportRepository
)
from schemas import CompareOut, AssetDetailOut, AssetOut, MarketMetricsOut, ProtocolMetricsOut, LiquidityMetricsOut, RiskScoreOut, ResearchReportOut
from services.llm import llm_service

router = APIRouter()


async def _build_asset_detail(coingecko_id: str, db: AsyncSession) -> AssetDetailOut:
    asset = await AssetRepository(db).get_by_coingecko_id(coingecko_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{coingecko_id}' not found")

    def _v(obj, cls):
        return cls.model_validate(obj) if obj else None

    market = await MarketMetricsRepository(db).get_latest(asset.id)
    protocol = await ProtocolMetricsRepository(db).get_latest(asset.id)
    liquidity = await LiquidityMetricsRepository(db).get_latest(asset.id)
    risk = await RiskScoreRepository(db).get_latest(asset.id)
    report = await ResearchReportRepository(db).get_latest(asset.id)

    return AssetDetailOut(
        asset=AssetOut.model_validate(asset),
        market=_v(market, MarketMetricsOut),
        protocol=_v(protocol, ProtocolMetricsOut),
        liquidity=_v(liquidity, LiquidityMetricsOut),
        risk=_v(risk, RiskScoreOut),
        latest_report=_v(report, ResearchReportOut),
    )


@router.get("/", response_model=CompareOut)
async def compare_assets(
    asset_a: str = Query(..., description="CoinGecko ID of first asset"),
    asset_b: str = Query(..., description="CoinGecko ID of second asset"),
    db: AsyncSession = Depends(get_db),
):
    """Compare two assets with metrics and AI analysis."""
    detail_a = await _build_asset_detail(asset_a, db)
    detail_b = await _build_asset_detail(asset_b, db)

    def _to_dict(d: AssetDetailOut) -> dict:
        return {
            "name": d.asset.name,
            "symbol": d.asset.symbol,
            "market_cap": d.market.market_cap if d.market else None,
            "volume_24h": d.market.volume_24h if d.market else None,
            "price_change_24h": d.market.price_change_24h if d.market else None,
            "tvl": d.protocol.tvl if d.protocol else None,
            "total_liquidity": d.liquidity.total_liquidity if d.liquidity else None,
            "overall_risk": d.risk.overall_risk if d.risk else None,
        }

    ai_analysis = await llm_service.generate_comparison_analysis(
        _to_dict(detail_a), _to_dict(detail_b)
    )

    return CompareOut(asset_a=detail_a, asset_b=detail_b, ai_analysis=ai_analysis)
