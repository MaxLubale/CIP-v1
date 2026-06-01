"""CoinGecko API service - free tier."""
import logging
import asyncio
from typing import Optional, List, Dict, Any

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

# CoinGecko free tier has rate limits: ~30 req/min
RATE_LIMIT_DELAY = 2.0  # seconds between requests


class CoinGeckoService:
    def __init__(self):
        self.base_url = settings.COINGECKO_BASE_URL
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_markets(self, per_page: int = 20, page: int = 1) -> List[Dict[str, Any]]:
        """Fetch top coins by market cap."""
        try:
            resp = await self.client.get(
                f"{self.base_url}/coins/markets",
                params={
                    "vs_currency": "usd",
                    "order": "market_cap_desc",
                    "per_page": per_page,
                    "page": page,
                    "sparkline": False,
                    "price_change_percentage": "24h,7d",
                },
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"CoinGecko markets error: {e}")
            return []

    async def get_coin(self, coin_id: str) -> Optional[Dict[str, Any]]:
        """Fetch detailed coin data."""
        try:
            await asyncio.sleep(RATE_LIMIT_DELAY)
            resp = await self.client.get(
                f"{self.base_url}/coins/{coin_id}",
                params={
                    "localization": False,
                    "tickers": False,
                    "market_data": True,
                    "community_data": False,
                    "developer_data": False,
                },
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"CoinGecko coin {coin_id} error: {e}")
            return None

    async def search(self, query: str) -> List[Dict[str, Any]]:
        """Search coins by name/symbol."""
        try:
            resp = await self.client.get(
                f"{self.base_url}/search",
                params={"query": query},
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("coins", [])[:10]
        except Exception as e:
            logger.error(f"CoinGecko search error: {e}")
            return []

    async def close(self):
        await self.client.aclose()


coingecko_service = CoinGeckoService()
