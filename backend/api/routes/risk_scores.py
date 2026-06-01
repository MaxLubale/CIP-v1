"""Risk scores API routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from repositories import RiskScoreRepository, AssetRepository
from schemas import RiskScoreOut

router = APIRouter()


@router.get("/", response_model=List[RiskScoreOut])
async def list_risk_scores(db: AsyncSession = Depends(get_db)):
    """Get latest risk scores for all assets, sorted by overall risk descending."""
    repo = RiskScoreRepository(db)
    scores = await repo.get_all_latest()
    return scores


@router.get("/{coingecko_id}", response_model=RiskScoreOut)
async def get_risk_score(coingecko_id: str, db: AsyncSession = Depends(get_db)):
    """Get latest risk score for a specific asset."""
    asset_repo = AssetRepository(db)
    asset = await asset_repo.get_by_coingecko_id(coingecko_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    repo = RiskScoreRepository(db)
    score = await repo.get_latest(asset.id)
    if not score:
        raise HTTPException(status_code=404, detail="No risk score computed yet")
    return score
