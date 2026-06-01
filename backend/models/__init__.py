"""SQLAlchemy ORM models for all database tables."""
from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    coingecko_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    image_url: Mapped[str | None] = mapped_column(Text)
    rank: Mapped[int | None] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    market_metrics: Mapped[list["MarketMetrics"]] = relationship(back_populates="asset", cascade="all, delete-orphan")
    protocol_metrics: Mapped[list["ProtocolMetrics"]] = relationship(back_populates="asset", cascade="all, delete-orphan")
    liquidity_metrics: Mapped[list["LiquidityMetrics"]] = relationship(back_populates="asset", cascade="all, delete-orphan")
    risk_scores: Mapped[list["RiskScore"]] = relationship(back_populates="asset", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="asset", cascade="all, delete-orphan")
    research_reports: Mapped[list["ResearchReport"]] = relationship(back_populates="asset", cascade="all, delete-orphan")


class MarketMetrics(Base):
    __tablename__ = "market_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[int] = mapped_column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    price_usd: Mapped[float | None] = mapped_column(Float)
    market_cap: Mapped[float | None] = mapped_column(Float)
    volume_24h: Mapped[float | None] = mapped_column(Float)
    fdv: Mapped[float | None] = mapped_column(Float)
    price_change_24h: Mapped[float | None] = mapped_column(Float)
    price_change_7d: Mapped[float | None] = mapped_column(Float)
    market_cap_rank: Mapped[int | None] = mapped_column(Integer)
    fear_greed_index: Mapped[int | None] = mapped_column(Integer)
    fear_greed_label: Mapped[str | None] = mapped_column(String(50))
    snapshot_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    asset: Mapped["Asset"] = relationship(back_populates="market_metrics")


class ProtocolMetrics(Base):
    __tablename__ = "protocol_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[int] = mapped_column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    tvl: Mapped[float | None] = mapped_column(Float)
    tvl_change_24h: Mapped[float | None] = mapped_column(Float)
    tvl_change_7d: Mapped[float | None] = mapped_column(Float)
    chain_tvls: Mapped[dict | None] = mapped_column(JSON)
    protocol_slug: Mapped[str | None] = mapped_column(String(100))
    category: Mapped[str | None] = mapped_column(String(100))
    snapshot_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    asset: Mapped["Asset"] = relationship(back_populates="protocol_metrics")


class LiquidityMetrics(Base):
    __tablename__ = "liquidity_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[int] = mapped_column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    total_liquidity: Mapped[float | None] = mapped_column(Float)
    volume_24h: Mapped[float | None] = mapped_column(Float)
    volume_liquidity_ratio: Mapped[float | None] = mapped_column(Float)
    top_pair_address: Mapped[str | None] = mapped_column(String(200))
    top_dex: Mapped[str | None] = mapped_column(String(100))
    snapshot_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    asset: Mapped["Asset"] = relationship(back_populates="liquidity_metrics")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[int] = mapped_column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    liquidity_risk: Mapped[float] = mapped_column(Float, default=50.0)
    concentration_risk: Mapped[float] = mapped_column(Float, default=50.0)
    ecosystem_risk: Mapped[float] = mapped_column(Float, default=50.0)
    overall_risk: Mapped[float] = mapped_column(Float, default=50.0)
    liquidity_explanation: Mapped[str | None] = mapped_column(Text)
    concentration_explanation: Mapped[str | None] = mapped_column(Text)
    ecosystem_explanation: Mapped[str | None] = mapped_column(Text)
    overall_explanation: Mapped[str | None] = mapped_column(Text)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    asset: Mapped["Asset"] = relationship(back_populates="risk_scores")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[int] = mapped_column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)  # liquidity_drop, tvl_drop, volume_spike, sentiment_change
    severity: Mapped[str] = mapped_column(String(20), default="medium")  # low, medium, high, critical
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metric_before: Mapped[float | None] = mapped_column(Float)
    metric_after: Mapped[float | None] = mapped_column(Float)
    change_pct: Mapped[float | None] = mapped_column(Float)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    asset: Mapped["Asset"] = relationship(back_populates="alerts")


class ResearchReport(Base):
    __tablename__ = "research_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[int] = mapped_column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    executive_summary: Mapped[str | None] = mapped_column(Text)
    key_opportunities: Mapped[list | None] = mapped_column(JSON)
    key_risks: Mapped[list | None] = mapped_column(JSON)
    ecosystem_health: Mapped[str | None] = mapped_column(Text)
    research_notes: Mapped[str | None] = mapped_column(Text)
    model_used: Mapped[str | None] = mapped_column(String(100))
    disclaimer: Mapped[str] = mapped_column(
        Text,
        default="This report is for informational purposes only and does not constitute financial advice. Past performance does not guarantee future results."
    )
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    asset: Mapped["Asset"] = relationship(back_populates="research_reports")
