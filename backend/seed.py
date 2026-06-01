"""
Seed script — populates the database with sample data for development/demo.
Run: python seed.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from core.database import AsyncSessionLocal, create_tables
from models import Asset, MarketMetrics, ProtocolMetrics, LiquidityMetrics, RiskScore, Alert, ResearchReport
from datetime import datetime, timezone


SAMPLE_ASSETS = [
    {"coingecko_id": "bitcoin",  "symbol": "BTC",  "name": "Bitcoin",  "rank": 1,  "image_url": "https://assets.coingecko.com/coins/images/1/small/bitcoin.png"},
    {"coingecko_id": "ethereum", "symbol": "ETH",  "name": "Ethereum", "rank": 2,  "image_url": "https://assets.coingecko.com/coins/images/279/small/ethereum.png"},
    {"coingecko_id": "solana",   "symbol": "SOL",  "name": "Solana",   "rank": 5,  "image_url": "https://assets.coingecko.com/coins/images/4128/small/solana.png"},
    {"coingecko_id": "uniswap",  "symbol": "UNI",  "name": "Uniswap",  "rank": 20, "image_url": "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png"},
    {"coingecko_id": "chainlink","symbol": "LINK", "name": "Chainlink","rank": 15, "image_url": "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png"},
]

SAMPLE_MARKET = [
    {"price_usd": 67500, "market_cap": 1_330_000_000_000, "volume_24h": 28_000_000_000, "fdv": 1_417_000_000_000, "price_change_24h": 1.8,  "price_change_7d": 4.2,  "market_cap_rank": 1,  "fear_greed_index": 65, "fear_greed_label": "Greed"},
    {"price_usd": 3500,  "market_cap": 420_000_000_000,  "volume_24h": 14_000_000_000, "fdv": 420_000_000_000,   "price_change_24h": 2.1,  "price_change_7d": 6.5,  "market_cap_rank": 2,  "fear_greed_index": 65, "fear_greed_label": "Greed"},
    {"price_usd": 185,   "market_cap": 85_000_000_000,   "volume_24h": 3_500_000_000,  "fdv": 88_000_000_000,    "price_change_24h": -1.2, "price_change_7d": 8.1,  "market_cap_rank": 5,  "fear_greed_index": 65, "fear_greed_label": "Greed"},
    {"price_usd": 8.5,   "market_cap": 6_400_000_000,    "volume_24h": 180_000_000,    "fdv": 8_500_000_000,     "price_change_24h": -3.4, "price_change_7d": -5.2, "market_cap_rank": 20, "fear_greed_index": 65, "fear_greed_label": "Greed"},
    {"price_usd": 14.2,  "market_cap": 8_300_000_000,    "volume_24h": 420_000_000,    "fdv": 14_000_000_000,    "price_change_24h": 0.8,  "price_change_7d": 2.3,  "market_cap_rank": 15, "fear_greed_index": 65, "fear_greed_label": "Greed"},
]

SAMPLE_PROTOCOL = [
    {"tvl": None,              "tvl_change_24h": None, "tvl_change_7d": None,  "chain_tvls": None,                           "category": None},
    {"tvl": 12_000_000_000,    "tvl_change_24h": 1.2,  "tvl_change_7d": 3.4,   "chain_tvls": {"Ethereum": 12_000_000_000},  "category": "DEX"},
    {"tvl": 5_200_000_000,     "tvl_change_24h": -0.8, "tvl_change_7d": 5.1,   "chain_tvls": {"Solana": 5_200_000_000},      "category": "Liquid Staking"},
    {"tvl": 1_800_000_000,     "tvl_change_24h": 2.1,  "tvl_change_7d": -1.3,  "chain_tvls": {"Ethereum": 1_750_000_000, "Polygon": 50_000_000}, "category": "DEX"},
    {"tvl": None,              "tvl_change_24h": None, "tvl_change_7d": None,  "chain_tvls": None,                           "category": "Oracle"},
]

SAMPLE_LIQUIDITY = [
    {"total_liquidity": 2_100_000_000, "volume_24h": 8_500_000_000,  "volume_liquidity_ratio": 4.05, "top_dex": "uniswap_v3",    "top_pair_address": "0x4e68ccd3e89f51c3074ca5072bbac773960dfa36"},
    {"total_liquidity": 980_000_000,   "volume_24h": 3_200_000_000,  "volume_liquidity_ratio": 3.27, "top_dex": "uniswap_v3",    "top_pair_address": "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"},
    {"total_liquidity": 320_000_000,   "volume_24h": 1_100_000_000,  "volume_liquidity_ratio": 3.44, "top_dex": "raydium",       "top_pair_address": "HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8tKyfkd"},
    {"total_liquidity": 85_000_000,    "volume_24h": 42_000_000,     "volume_liquidity_ratio": 0.49, "top_dex": "uniswap_v3",    "top_pair_address": "0x1d42064fc4beb5f8aaf85f4617ae8b3b5b8bd801"},
    {"total_liquidity": 210_000_000,   "volume_24h": 98_000_000,     "volume_liquidity_ratio": 0.47, "top_dex": "uniswap_v3",    "top_pair_address": "0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8"},
]

SAMPLE_RISK = [
    {"liquidity_risk": 12, "concentration_risk": 10, "ecosystem_risk": 25, "overall_risk": 15, "liquidity_explanation": "Bitcoin has extremely deep liquidity across major exchanges and DEXs.", "concentration_explanation": "Bitcoin is the #1 asset by market cap with wide geographic and exchange distribution.", "ecosystem_explanation": "Strong market sentiment and consistent institutional demand support ecosystem health.", "overall_explanation": "Bitcoin remains the lowest-risk digital asset by most measurable metrics."},
    {"liquidity_risk": 18, "concentration_risk": 14, "ecosystem_risk": 28, "overall_risk": 20, "liquidity_explanation": "Ethereum has substantial DEX liquidity, though concentrated in a few major pools.", "concentration_explanation": "Strong #2 market cap position with broad ecosystem adoption.", "ecosystem_explanation": "Large and growing DeFi TVL indicates healthy ecosystem utilization.", "overall_explanation": "Ethereum maintains a low overall risk profile with deep liquidity and broad adoption."},
    {"liquidity_risk": 28, "concentration_risk": 32, "ecosystem_risk": 35, "overall_risk": 31, "liquidity_explanation": "Solana has significant DEX liquidity but concentrated on fewer venues than ETH.", "concentration_explanation": "Single-chain concentration adds moderate risk despite strong #5 market position.", "ecosystem_explanation": "Growing TVL and active developer ecosystem signal positive momentum.", "overall_explanation": "Solana carries moderate risk, primarily from chain concentration and smaller liquidity pools."},
    {"liquidity_risk": 48, "concentration_risk": 55, "ecosystem_risk": 42, "overall_risk": 49, "liquidity_explanation": "UNI has moderate liquidity relative to its market cap, with vol/liq ratio below 1.", "concentration_explanation": "Mid-cap position with multi-chain deployment reduces concentration risk somewhat.", "ecosystem_explanation": "Uniswap TVL remains strong but governance token demand is uncertain.", "overall_explanation": "UNI carries moderate risk — solid protocol fundamentals but governance token dynamics add uncertainty."},
    {"liquidity_risk": 35, "concentration_risk": 28, "ecosystem_risk": 38, "overall_risk": 34, "liquidity_explanation": "LINK has adequate DEX liquidity for its market cap with a healthy vol/liq ratio.", "concentration_explanation": "Strong market cap rank with broad integration across DeFi protocols.", "ecosystem_explanation": "Oracle network growth is positive, though depends on DeFi ecosystem health broadly.", "overall_explanation": "Chainlink shows moderate-low risk with strong protocol utility and market adoption."},
]

SAMPLE_ALERTS = [
    {"alert_type": "volume_spike",    "severity": "high",     "title": "SOL Volume Spike Detected",       "message": "Solana 24h trading volume surged by 245% in the last snapshot period.", "change_pct": 245.0},
    {"alert_type": "tvl_drop",        "severity": "medium",   "title": "UNI TVL Drop Alert",              "message": "Uniswap protocol TVL declined by 18.3% over the last 6 hours.", "change_pct": -18.3},
    {"alert_type": "sentiment_change","severity": "medium",   "title": "Market Sentiment Increased Sharply", "message": "Fear & Greed Index increased by 22 points to 65 (Greed).", "change_pct": 22.0},
    {"alert_type": "liquidity_drop",  "severity": "high",     "title": "LINK Liquidity Drop Alert",       "message": "Chainlink DEX liquidity dropped by 31.2% between hourly snapshots.", "change_pct": -31.2},
]

SAMPLE_REPORTS = [
    {
        "executive_summary": "Bitcoin continues to demonstrate strong market dominance with institutional adoption accelerating. The current Fear & Greed index at 65 (Greed) indicates positive sentiment without reaching extreme froth levels. On-chain metrics suggest sustained demand from both retail and institutional participants.",
        "key_opportunities": [
            "Continued institutional adoption via ETF products may sustain demand pressure",
            "Historical patterns suggest mid-cycle consolidation periods can precede further appreciation",
            "Layer-2 ecosystem growth may drive increased on-chain activity and utility",
        ],
        "key_risks": [
            "Regulatory uncertainty across major markets could introduce volatility",
            "High correlation with macro risk-off sentiment creates systemic exposure",
            "Mining concentration in specific regions poses potential network risk",
        ],
        "ecosystem_health": "Bitcoin's ecosystem health appears robust with hash rate at near-record levels and active address growth trending positively. Layer-2 solutions are expanding the utility surface area.",
        "research_notes": "Data-driven metrics suggest Bitcoin is in a moderate growth phase. The vol/liq ratio of 4.05x indicates healthy trading activity relative to available liquidity. No anomalous on-chain patterns detected in current snapshot.",
        "model_used": "deepseek/deepseek-chat",
    },
    {
        "executive_summary": "Ethereum's DeFi ecosystem maintains substantial TVL of $12B, supporting the asset's fundamental value proposition. The transition to proof-of-stake has improved supply dynamics, and Layer-2 adoption is accelerating transaction throughput.",
        "key_opportunities": [
            "Layer-2 ecosystem growth (Arbitrum, Optimism, Base) driving increased ETH utility",
            "EIP-1559 fee burning mechanism creates deflationary pressure during high-activity periods",
            "Staking yield provides benchmark return for DeFi ecosystem participants",
        ],
        "key_risks": [
            "Competition from alternative Layer-1 blockchains for developer and user mindshare",
            "High gas fees during peak demand may limit retail participation",
            "Smart contract risk inherent in complex DeFi protocols built on Ethereum",
        ],
        "ecosystem_health": "Ethereum's ecosystem health is strong, with $12B TVL and growing Layer-2 adoption. Developer activity remains the highest of any smart contract platform. Staking participation above 25% indicates long-term holder confidence.",
        "research_notes": "Current metrics show healthy market structure with adequate DEX liquidity ($980M) and volume/liquidity ratio of 3.27x. TVL growth of 1.2% over 24 hours is consistent with broader market trends.",
        "model_used": "deepseek/deepseek-chat",
    },
]


async def seed():
    print("Creating tables...")
    await create_tables()

    async with AsyncSessionLocal() as db:
        print("Seeding assets...")
        asset_ids = []
        for i, a in enumerate(SAMPLE_ASSETS):
            asset = Asset(**a, is_active=True)
            db.add(asset)
            await db.flush()
            asset_ids.append(asset.id)

            # Market metrics
            db.add(MarketMetrics(asset_id=asset.id, **SAMPLE_MARKET[i]))

            # Protocol metrics
            if SAMPLE_PROTOCOL[i]["tvl"] is not None:
                db.add(ProtocolMetrics(asset_id=asset.id, **SAMPLE_PROTOCOL[i]))

            # Liquidity metrics
            db.add(LiquidityMetrics(asset_id=asset.id, **SAMPLE_LIQUIDITY[i]))

            # Risk scores
            db.add(RiskScore(asset_id=asset.id, **SAMPLE_RISK[i]))

        # Alerts (attached to first 4 assets)
        for i, alert_data in enumerate(SAMPLE_ALERTS):
            db.add(Alert(
                asset_id=asset_ids[min(i, len(asset_ids) - 1)],
                metric_before=100.0,
                metric_after=100.0 * (1 + alert_data["change_pct"] / 100),
                **alert_data,
            ))

        # Research reports (for BTC and ETH)
        for i, report_data in enumerate(SAMPLE_REPORTS):
            db.add(ResearchReport(
                asset_id=asset_ids[i],
                disclaimer="This report is for informational purposes only and does not constitute financial advice.",
                **report_data,
            ))

        await db.commit()
        print(f"✅ Seeded {len(SAMPLE_ASSETS)} assets, metrics, {len(SAMPLE_ALERTS)} alerts, {len(SAMPLE_REPORTS)} reports.")


if __name__ == "__main__":
    asyncio.run(seed())
