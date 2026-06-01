"""Repository layer - all database access logic."""
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Any

from sqlalchemy import select, desc, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import (
    Asset, MarketMetrics, ProtocolMetrics,
    LiquidityMetrics, RiskScore, Alert, ResearchReport
)


class AssetRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_active(self, limit: int = 20) -> List[Asset]:
        result = await self.db.execute(
            select(Asset).where(Asset.is_active == True)
            .order_by(Asset.rank.nulls_last())
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_id(self, asset_id: int) -> Optional[Asset]:
        result = await self.db.execute(select(Asset).where(Asset.id == asset_id))
        return result.scalar_one_or_none()

    async def get_by_coingecko_id(self, coingecko_id: str) -> Optional[Asset]:
        result = await self.db.execute(
            select(Asset).where(Asset.coingecko_id == coingecko_id)
        )
        return result.scalar_one_or_none()

    async def upsert(self, coingecko_id: str, **kwargs) -> Asset:
        asset = await self.get_by_coingecko_id(coingecko_id)
        if asset:
            for k, v in kwargs.items():
                setattr(asset, k, v)
            asset.updated_at = datetime.now(timezone.utc)
        else:
            asset = Asset(coingecko_id=coingecko_id, **kwargs)
            self.db.add(asset)
        await self.db.flush()
        return asset

    async def count(self) -> int:
        result = await self.db.execute(select(func.count()).select_from(Asset).where(Asset.is_active == True))
        return result.scalar_one()


class MarketMetricsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_latest(self, asset_id: int) -> Optional[MarketMetrics]:
        result = await self.db.execute(
            select(MarketMetrics).where(MarketMetrics.asset_id == asset_id)
            .order_by(desc(MarketMetrics.snapshot_at)).limit(1)
        )
        return result.scalar_one_or_none()

    async def insert(self, **kwargs) -> MarketMetrics:
        m = MarketMetrics(**kwargs)
        self.db.add(m)
        await self.db.flush()
        return m

    async def get_history(self, asset_id: int, days: int = 7) -> List[MarketMetrics]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        result = await self.db.execute(
            select(MarketMetrics)
            .where(and_(MarketMetrics.asset_id == asset_id, MarketMetrics.snapshot_at >= since))
            .order_by(MarketMetrics.snapshot_at)
        )
        return result.scalars().all()


class ProtocolMetricsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_latest(self, asset_id: int) -> Optional[ProtocolMetrics]:
        result = await self.db.execute(
            select(ProtocolMetrics).where(ProtocolMetrics.asset_id == asset_id)
            .order_by(desc(ProtocolMetrics.snapshot_at)).limit(1)
        )
        return result.scalar_one_or_none()

    async def insert(self, **kwargs) -> ProtocolMetrics:
        m = ProtocolMetrics(**kwargs)
        self.db.add(m)
        await self.db.flush()
        return m


class LiquidityMetricsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_latest(self, asset_id: int) -> Optional[LiquidityMetrics]:
        result = await self.db.execute(
            select(LiquidityMetrics).where(LiquidityMetrics.asset_id == asset_id)
            .order_by(desc(LiquidityMetrics.snapshot_at)).limit(1)
        )
        return result.scalar_one_or_none()

    async def insert(self, **kwargs) -> LiquidityMetrics:
        m = LiquidityMetrics(**kwargs)
        self.db.add(m)
        await self.db.flush()
        return m


class RiskScoreRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_latest(self, asset_id: int) -> Optional[RiskScore]:
        result = await self.db.execute(
            select(RiskScore).where(RiskScore.asset_id == asset_id)
            .order_by(desc(RiskScore.computed_at)).limit(1)
        )
        return result.scalar_one_or_none()

    async def get_all_latest(self) -> List[RiskScore]:
        subq = (
            select(RiskScore.asset_id, func.max(RiskScore.computed_at).label("max_at"))
            .group_by(RiskScore.asset_id)
            .subquery()
        )
        result = await self.db.execute(
            select(RiskScore)
            .join(subq, and_(RiskScore.asset_id == subq.c.asset_id, RiskScore.computed_at == subq.c.max_at))
            .options(selectinload(RiskScore.asset))
            .order_by(desc(RiskScore.overall_risk))
        )
        return result.scalars().all()

    async def insert(self, **kwargs) -> RiskScore:
        r = RiskScore(**kwargs)
        self.db.add(r)
        await self.db.flush()
        return r


class AlertRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_recent(self, limit: int = 50, unread_only: bool = False) -> List[Alert]:
        q = select(Alert).options(selectinload(Alert.asset)).order_by(desc(Alert.triggered_at))
        if unread_only:
            q = q.where(Alert.is_read == False)
        result = await self.db.execute(q.limit(limit))
        return result.scalars().all()

    async def insert(self, **kwargs) -> Alert:
        a = Alert(**kwargs)
        self.db.add(a)
        await self.db.flush()
        return a

    async def mark_read(self, alert_id: int) -> bool:
        result = await self.db.execute(select(Alert).where(Alert.id == alert_id))
        alert = result.scalar_one_or_none()
        if alert:
            alert.is_read = True
            return True
        return False

    async def count_unread(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Alert).where(Alert.is_read == False)
        )
        return result.scalar_one()


class ResearchReportRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_latest(self, asset_id: int) -> Optional[ResearchReport]:
        result = await self.db.execute(
            select(ResearchReport).where(ResearchReport.asset_id == asset_id)
            .order_by(desc(ResearchReport.generated_at)).limit(1)
        )
        return result.scalar_one_or_none()

    async def get_all_latest(self, limit: int = 20) -> List[ResearchReport]:
        subq = (
            select(ResearchReport.asset_id, func.max(ResearchReport.generated_at).label("max_at"))
            .group_by(ResearchReport.asset_id)
            .subquery()
        )
        result = await self.db.execute(
            select(ResearchReport)
            .join(subq, and_(ResearchReport.asset_id == subq.c.asset_id, ResearchReport.generated_at == subq.c.max_at))
            .options(selectinload(ResearchReport.asset))
            .order_by(desc(ResearchReport.generated_at))
            .limit(limit)
        )
        return result.scalars().all()

    async def insert(self, **kwargs) -> ResearchReport:
        r = ResearchReport(**kwargs)
        self.db.add(r)
        await self.db.flush()
        return r
