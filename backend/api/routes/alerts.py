"""Alerts API routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from repositories import AlertRepository
from schemas import AlertOut

router = APIRouter()


@router.get("/", response_model=List[AlertOut])
async def list_alerts(
    limit: int = Query(default=50, ge=1, le=200),
    unread_only: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
):
    """List recent alerts, optionally filtered to unread."""
    repo = AlertRepository(db)
    alerts = await repo.get_recent(limit=limit, unread_only=unread_only)
    return alerts


@router.post("/{alert_id}/read")
async def mark_alert_read(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Mark an alert as read."""
    repo = AlertRepository(db)
    success = await repo.mark_read(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert marked as read"}


@router.get("/unread-count")
async def unread_count(db: AsyncSession = Depends(get_db)):
    repo = AlertRepository(db)
    count = await repo.count_unread()
    return {"unread_count": count}
