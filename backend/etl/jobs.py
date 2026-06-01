"""ETL job implementations for data ingestion and processing."""
import logging
from datetime import datetime, timezone

from core.database import AsyncSessionLocal
from repositories import (
    AssetRepository, MarketMetricsRepository, ProtocolMetricsRepository,
    LiquidityMetricsRepository, RiskScoreRepository, AlertRepository, ResearchReportRepository
)
from services.coingecko import coingecko_service
from services.external_apis import defillama_service, dexscreener_service, alternative_me_service
from services.risk_engine import compute_all_risks
from services.llm import llm_service
from core.config import settings

logger = logging.getLogger(__name__)

# Alert thresholds
LIQUIDITY_DROP_THRESHOLD = -20.0   # % drop triggers alert
TVL_DROP_THRESHOLD = -15.0          # % drop triggers alert
VOLUME_SPIKE_THRESHOLD = 200.0      # % increase triggers alert
SENTIMENT_CHANGE_THRESHOLD = 20     # point change in FGI triggers alert

_last_fgi = None


async def refresh_market_data():
    """Fetch and store market data for top assets. Runs every 1 hour."""
    global _last_fgi
    logger.info("ETL: Starting market data refresh...")

    async with AsyncSessionLocal() as db:
        try:
            asset_repo = AssetRepository(db)
            market_repo = MarketMetricsRepository(db)
            liq_repo = LiquidityMetricsRepository(db)
            risk_repo = RiskScoreRepository(db)
            alert_repo = AlertRepository(db)

            # Fetch fear & greed index
            fgi = await alternative_me_service.get_fear_greed()
            fgi_value = fgi["value"]
            fgi_label = fgi["label"]

            # Check sentiment change alert
            if _last_fgi is not None:
                delta = abs(fgi_value - _last_fgi)
                if delta >= SENTIMENT_CHANGE_THRESHOLD:
                    direction = "increased" if fgi_value > _last_fgi else "decreased"
                    await alert_repo.insert(
                        asset_id=1,  # Use Bitcoin as proxy for market-wide
                        alert_type="sentiment_change",
                        severity="medium",
                        title=f"Market Sentiment {direction.title()} Sharply",
                        message=f"Fear & Greed Index {direction} by {delta:.0f} points to {fgi_value} ({fgi_label}).",
                        metric_before=float(_last_fgi),
                        metric_after=float(fgi_value),
                        change_pct=((fgi_value - _last_fgi) / max(_last_fgi, 1)) * 100,
                    )
            _last_fgi = fgi_value

            # Fetch top 20 coins
            coins = await coingecko_service.get_markets(per_page=settings.TOP_ASSETS_LIMIT)
            for coin in coins:
                # Upsert asset
                asset = await asset_repo.upsert(
                    coingecko_id=coin["id"],
                    symbol=coin["symbol"].upper(),
                    name=coin["name"],
                    image_url=coin.get("image"),
                    rank=coin.get("market_cap_rank"),
                )

                # Previous market snapshot for alert comparison
                prev_market = await market_repo.get_latest(asset.id)
                prev_liq = await liq_repo.get_latest(asset.id)

                # Store market metrics
                await market_repo.insert(
                    asset_id=asset.id,
                    price_usd=coin.get("current_price"),
                    market_cap=coin.get("market_cap"),
                    volume_24h=coin.get("total_volume"),
                    fdv=coin.get("fully_diluted_valuation"),
                    price_change_24h=coin.get("price_change_percentage_24h"),
                    price_change_7d=coin.get("price_change_percentage_7d_in_currency"),
                    market_cap_rank=coin.get("market_cap_rank"),
                    fear_greed_index=fgi_value,
                    fear_greed_label=fgi_label,
                )

                # Fetch liquidity from DexScreener
                liq_data = await dexscreener_service.get_liquidity_for_token(coin["symbol"])
                await liq_repo.insert(asset_id=asset.id, **liq_data)

                # Volume spike alert
                if prev_liq and prev_liq.volume_24h and liq_data.get("volume_24h"):
                    vol_change = ((liq_data["volume_24h"] - prev_liq.volume_24h) / prev_liq.volume_24h) * 100
                    if vol_change >= VOLUME_SPIKE_THRESHOLD:
                        await alert_repo.insert(
                            asset_id=asset.id,
                            alert_type="volume_spike",
                            severity="high",
                            title=f"{asset.symbol} Volume Spike Detected",
                            message=f"24h trading volume surged by {vol_change:.1f}% for {asset.name}.",
                            metric_before=prev_liq.volume_24h,
                            metric_after=liq_data["volume_24h"],
                            change_pct=vol_change,
                        )

                # Liquidity drop alert
                if prev_liq and prev_liq.total_liquidity and liq_data.get("total_liquidity"):
                    liq_change = ((liq_data["total_liquidity"] - prev_liq.total_liquidity) / prev_liq.total_liquidity) * 100
                    if liq_change <= LIQUIDITY_DROP_THRESHOLD:
                        await alert_repo.insert(
                            asset_id=asset.id,
                            alert_type="liquidity_drop",
                            severity="high" if liq_change <= -40 else "medium",
                            title=f"{asset.symbol} Liquidity Drop Alert",
                            message=f"Liquidity for {asset.name} dropped by {abs(liq_change):.1f}%.",
                            metric_before=prev_liq.total_liquidity,
                            metric_after=liq_data["total_liquidity"],
                            change_pct=liq_change,
                        )

                # Compute and store risk scores
                prev_protocol = await ProtocolMetricsRepository(db).get_latest(asset.id)
                risks = compute_all_risks(
                    total_liquidity=liq_data.get("total_liquidity"),
                    volume_24h=liq_data.get("volume_24h"),
                    volume_liquidity_ratio=liq_data.get("volume_liquidity_ratio"),
                    market_cap=coin.get("market_cap"),
                    market_cap_rank=coin.get("market_cap_rank"),
                    chain_tvls=prev_protocol.chain_tvls if prev_protocol else None,
                    tvl=prev_protocol.tvl if prev_protocol else None,
                    tvl_change_24h=prev_protocol.tvl_change_24h if prev_protocol else None,
                    tvl_change_7d=prev_protocol.tvl_change_7d if prev_protocol else None,
                    fear_greed_index=fgi_value,
                    price_change_7d=coin.get("price_change_percentage_7d_in_currency"),
                )
                await risk_repo.insert(asset_id=asset.id, **risks)

            await db.commit()
            logger.info(f"ETL: Market data refresh complete for {len(coins)} assets.")

        except Exception as e:
            logger.error(f"ETL market refresh error: {e}", exc_info=True)
            await db.rollback()


async def refresh_protocol_metrics():
    """Fetch and store DeFi protocol metrics. Runs every 6 hours."""
    logger.info("ETL: Starting protocol metrics refresh...")

    async with AsyncSessionLocal() as db:
        try:
            asset_repo = AssetRepository(db)
            proto_repo = ProtocolMetricsRepository(db)
            alert_repo = AlertRepository(db)

            protocols = await defillama_service.get_protocols()
            proto_by_symbol = {p.get("symbol", "").upper(): p for p in protocols if p.get("symbol")}

            assets = await asset_repo.get_all_active()
            for asset in assets:
                proto = proto_by_symbol.get(asset.symbol)
                if not proto:
                    continue

                prev = await proto_repo.get_latest(asset.id)

                tvl = proto.get("tvl")
                tvl_change_1d = proto.get("change_1d")
                tvl_change_7d = proto.get("change_7d")
                chain_tvls = proto.get("chainTvls", {})

                await proto_repo.insert(
                    asset_id=asset.id,
                    tvl=tvl,
                    tvl_change_24h=tvl_change_1d,
                    tvl_change_7d=tvl_change_7d,
                    chain_tvls=chain_tvls,
                    protocol_slug=proto.get("slug"),
                    category=proto.get("category"),
                )

                # TVL drop alert
                if prev and prev.tvl and tvl:
                    tvl_change = ((tvl - prev.tvl) / prev.tvl) * 100
                    if tvl_change <= TVL_DROP_THRESHOLD:
                        await alert_repo.insert(
                            asset_id=asset.id,
                            alert_type="tvl_drop",
                            severity="critical" if tvl_change <= -30 else "high",
                            title=f"{asset.symbol} TVL Drop Alert",
                            message=f"Total Value Locked for {asset.name} protocol dropped by {abs(tvl_change):.1f}%.",
                            metric_before=prev.tvl,
                            metric_after=tvl,
                            change_pct=tvl_change,
                        )

            await db.commit()
            logger.info("ETL: Protocol metrics refresh complete.")

        except Exception as e:
            logger.error(f"ETL protocol refresh error: {e}", exc_info=True)
            await db.rollback()


async def generate_daily_reports():
    """Generate AI research reports for all active assets. Runs every 24 hours."""
    logger.info("ETL: Starting daily research report generation...")

    async with AsyncSessionLocal() as db:
        try:
            asset_repo = AssetRepository(db)
            market_repo = MarketMetricsRepository(db)
            proto_repo = ProtocolMetricsRepository(db)
            liq_repo = LiquidityMetricsRepository(db)
            risk_repo = RiskScoreRepository(db)
            report_repo = ResearchReportRepository(db)

            assets = await asset_repo.get_all_active(limit=10)  # Limit to save API calls

            for asset in assets:
                try:
                    market = await market_repo.get_latest(asset.id)
                    protocol = await proto_repo.get_latest(asset.id)
                    liquidity = await liq_repo.get_latest(asset.id)
                    risk = await risk_repo.get_latest(asset.id)

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
                            "fear_greed_label": market.fear_greed_label if market else None,
                        },
                        "protocol": {
                            "tvl": protocol.tvl if protocol else None,
                            "tvl_change_24h": protocol.tvl_change_24h if protocol else None,
                            "tvl_change_7d": protocol.tvl_change_7d if protocol else None,
                            "category": protocol.category if protocol else None,
                        },
                        "liquidity": {
                            "total_liquidity": liquidity.total_liquidity if liquidity else None,
                            "volume_liquidity_ratio": liquidity.volume_liquidity_ratio if liquidity else None,
                        },
                        "risk": {
                            "liquidity_risk": risk.liquidity_risk if risk else None,
                            "concentration_risk": risk.concentration_risk if risk else None,
                            "ecosystem_risk": risk.ecosystem_risk if risk else None,
                            "overall_risk": risk.overall_risk if risk else None,
                        },
                    }

                    report_data = await llm_service.generate_research_report(asset_data)

                    await report_repo.insert(
                        asset_id=asset.id,
                        executive_summary=report_data.get("executive_summary"),
                        key_opportunities=report_data.get("key_opportunities", []),
                        key_risks=report_data.get("key_risks", []),
                        ecosystem_health=report_data.get("ecosystem_health"),
                        research_notes=report_data.get("research_notes"),
                        model_used=settings.DEFAULT_LLM_MODEL,
                    )

                except Exception as e:
                    logger.error(f"Report gen error for {asset.symbol}: {e}")
                    continue

            await db.commit()
            logger.info("ETL: Daily research reports generated.")

        except Exception as e:
            logger.error(f"ETL report generation error: {e}", exc_info=True)
            await db.rollback()
