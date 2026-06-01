"""ETL scheduler - runs data refresh jobs on schedule."""
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from core.config import settings
from etl.jobs import refresh_market_data, refresh_protocol_metrics, generate_daily_reports

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def start_scheduler():
    """Register and start all ETL jobs."""
    # Market data: every 1 hour
    scheduler.add_job(
        refresh_market_data,
        trigger=IntervalTrigger(hours=settings.MARKET_REFRESH_HOURS),
        id="market_refresh",
        name="Market Data Refresh",
        replace_existing=True,
        max_instances=1,
    )

    # Protocol metrics: every 6 hours
    scheduler.add_job(
        refresh_protocol_metrics,
        trigger=IntervalTrigger(hours=settings.PROTOCOL_REFRESH_HOURS),
        id="protocol_refresh",
        name="Protocol Metrics Refresh",
        replace_existing=True,
        max_instances=1,
    )

    # Research reports: every 24 hours
    scheduler.add_job(
        generate_daily_reports,
        trigger=IntervalTrigger(hours=settings.REPORT_REFRESH_HOURS),
        id="report_generation",
        name="Daily Research Reports",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.start()
    logger.info("ETL scheduler started.")

    # Run initial load immediately
    scheduler.add_job(refresh_market_data, id="initial_market", replace_existing=True)
    scheduler.add_job(refresh_protocol_metrics, id="initial_protocol", replace_existing=True)


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("ETL scheduler stopped.")
