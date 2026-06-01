"""Research Copilot API routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from repositories import (
    AssetRepository, MarketMetricsRepository, ProtocolMetricsRepository,
    LiquidityMetricsRepository, RiskScoreRepository, ResearchReportRepository
)
from schemas import ResearchReportOut, ResearchGenerateRequest
from services.llm import llm_service
from core.config import settings

router = APIRouter()


@router.get("/reports", response_model=List[ResearchReportOut])
async def list_reports(db: AsyncSession = Depends(get_db)):
    """Get latest research report for each asset."""
    repo = ResearchReportRepository(db)
    return await repo.get_all_latest()


@router.get("/reports/{coingecko_id}", response_model=ResearchReportOut)
async def get_report(coingecko_id: str, db: AsyncSession = Depends(get_db)):
    """Get latest research report for a specific asset."""
    asset = await AssetRepository(db).get_by_coingecko_id(coingecko_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    report = await ResearchReportRepository(db).get_latest(asset.id)
    if not report:
        raise HTTPException(status_code=404, detail="No report available. Try generating one.")
    return report


@router.post("/generate", response_model=ResearchReportOut)
async def generate_report(
    request: ResearchGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate a fresh AI research report for an asset."""
    asset = await AssetRepository(db).get_by_id(request.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    market = await MarketMetricsRepository(db).get_latest(asset.id)
    protocol = await ProtocolMetricsRepository(db).get_latest(asset.id)
    liquidity = await LiquidityMetricsRepository(db).get_latest(asset.id)
    risk = await RiskScoreRepository(db).get_latest(asset.id)

    asset_data = {
        "name": asset.name,
        "symbol": asset.symbol,
        "market": {
            "price_usd": market.price_usd if market else None,
            "market_cap": market.market_cap if market else None,
            "volume_24h": market.volume_24h if market else None,
            "price_change_24h": market.price_change_24h if market else None,
            "price_change_7d": market.price_change_7d if market else None,
            "fear_greed_index": market.fear_greed_index if market else None,
        },
        "protocol": {
            "tvl": protocol.tvl if protocol else None,
            "tvl_change_24h": protocol.tvl_change_24h if protocol else None,
            "category": protocol.category if protocol else None,
        },
        "liquidity": {
            "total_liquidity": liquidity.total_liquidity if liquidity else None,
            "volume_liquidity_ratio": liquidity.volume_liquidity_ratio if liquidity else None,
        },
        "risk": {
            "liquidity_risk": risk.liquidity_risk if risk else None,
            "overall_risk": risk.overall_risk if risk else None,
        },
    }

    report_data = await llm_service.generate_research_report(asset_data)
    report_repo = ResearchReportRepository(db)

    report = await report_repo.insert(
        asset_id=asset.id,
        executive_summary=report_data.get("executive_summary"),
        key_opportunities=report_data.get("key_opportunities", []),
        key_risks=report_data.get("key_risks", []),
        ecosystem_health=report_data.get("ecosystem_health"),
        research_notes=report_data.get("research_notes"),
        model_used=settings.DEFAULT_LLM_MODEL,
    )
    await db.commit()
    await db.refresh(report)
    from schemas import ResearchReportOut
    return ResearchReportOut.model_validate(report)
