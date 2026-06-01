"""External data services: DefiLlama, DexScreener, Alternative.me"""
import logging
from typing import Optional, List, Dict, Any

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


class DefiLlamaService:
    def __init__(self):
        self.base_url = settings.DEFILLAMA_BASE_URL
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_protocols(self) -> List[Dict[str, Any]]:
        """Get all DeFi protocols with TVL."""
        try:
            resp = await self.client.get(f"{self.base_url}/protocols")
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"DefiLlama protocols error: {e}")
            return []

    async def get_protocol(self, slug: str) -> Optional[Dict[str, Any]]:
        """Get a single protocol's TVL history."""
        try:
            resp = await self.client.get(f"{self.base_url}/protocol/{slug}")
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"DefiLlama protocol {slug} error: {e}")
            return None

    async def find_by_symbol(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Find a protocol by token symbol."""
        protocols = await self.get_protocols()
        symbol_upper = symbol.upper()
        for p in protocols:
            if p.get("symbol", "").upper() == symbol_upper:
                return p
        return None

    async def close(self):
        await self.client.aclose()


class DexScreenerService:
    def __init__(self):
        self.base_url = settings.DEXSCREENER_BASE_URL
        self.client = httpx.AsyncClient(timeout=30.0)

    async def search_pairs(self, query: str) -> List[Dict[str, Any]]:
        """Search for trading pairs."""
        try:
            resp = await self.client.get(
                f"{self.base_url}/dex/search",
                params={"q": query},
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("pairs", [])[:5]
        except Exception as e:
            logger.error(f"DexScreener search error: {e}")
            return []

    async def get_liquidity_for_token(self, symbol: str) -> Dict[str, Any]:
        """Get aggregate liquidity metrics for a token symbol."""
        pairs = await self.search_pairs(symbol)
        if not pairs:
            return {"total_liquidity": None, "volume_24h": None, "volume_liquidity_ratio": None}

        total_liquidity = sum(
            float(p.get("liquidity", {}).get("usd", 0) or 0) for p in pairs
        )
        total_volume = sum(
            float(p.get("volume", {}).get("h24", 0) or 0) for p in pairs
        )
        top_pair = max(pairs, key=lambda p: float(p.get("liquidity", {}).get("usd", 0) or 0), default=None)

        return {
            "total_liquidity": total_liquidity if total_liquidity > 0 else None,
            "volume_24h": total_volume if total_volume > 0 else None,
            "volume_liquidity_ratio": (total_volume / total_liquidity) if total_liquidity > 0 else None,
            "top_pair_address": top_pair.get("pairAddress") if top_pair else None,
            "top_dex": top_pair.get("dexId") if top_pair else None,
        }

    async def close(self):
        await self.client.aclose()


class AlternativeMeService:
    def __init__(self):
        self.base_url = settings.ALTERNATIVE_ME_BASE_URL
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_fear_greed(self) -> Dict[str, Any]:
        """Get current Fear & Greed Index."""
        try:
            resp = await self.client.get(f"{self.base_url}/fng/")
            resp.raise_for_status()
            data = resp.json()
            latest = data.get("data", [{}])[0]
            return {
                "value": int(latest.get("value", 50)),
                "label": latest.get("value_classification", "Neutral"),
            }
        except Exception as e:
            logger.error(f"Alternative.me FGI error: {e}")
            return {"value": 50, "label": "Neutral"}

    async def close(self):
        await self.client.aclose()


# Singletons
defillama_service = DefiLlamaService()
dexscreener_service = DexScreenerService()
alternative_me_service = AlternativeMeService()
