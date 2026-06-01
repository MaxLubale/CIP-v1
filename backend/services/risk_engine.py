"""Risk scoring engine - computes 0-100 risk scores from metrics."""
import logging
import math
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


def clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def compute_liquidity_risk(
    total_liquidity: Optional[float],
    volume_24h: Optional[float],
    volume_liquidity_ratio: Optional[float],
    market_cap: Optional[float],
) -> float:
    """
    Liquidity Risk (0=low risk, 100=high risk).

    Factors:
    - Absolute liquidity (lower = riskier)
    - Liquidity/market_cap ratio (lower = riskier)
    - Volume/liquidity ratio (extremes = riskier)
    """
    score = 50.0  # default medium

    if total_liquidity is None:
        return 65.0  # penalize missing data

    # Absolute liquidity thresholds
    if total_liquidity < 100_000:
        score = 85.0
    elif total_liquidity < 500_000:
        score = 70.0
    elif total_liquidity < 2_000_000:
        score = 55.0
    elif total_liquidity < 10_000_000:
        score = 40.0
    elif total_liquidity < 100_000_000:
        score = 25.0
    else:
        score = 15.0

    # Market cap ratio adjustment
    if market_cap and market_cap > 0:
        liq_ratio = total_liquidity / market_cap
        if liq_ratio < 0.005:
            score += 15
        elif liq_ratio < 0.02:
            score += 8
        elif liq_ratio > 0.1:
            score -= 10

    # Volume/liquidity ratio - very high ratio means potential price impact
    if volume_liquidity_ratio is not None:
        if volume_liquidity_ratio > 10:
            score += 10
        elif volume_liquidity_ratio > 5:
            score += 5

    return clamp(score)


def compute_concentration_risk(
    market_cap: Optional[float],
    market_cap_rank: Optional[int],
    chain_tvls: Optional[Dict[str, float]],
) -> float:
    """
    Concentration Risk (0=low risk, 100=high risk).

    Factors:
    - Market cap rank (lower rank = less risky)
    - Single-chain TVL concentration
    """
    score = 50.0

    # Market cap rank
    if market_cap_rank:
        if market_cap_rank <= 10:
            score = 15.0
        elif market_cap_rank <= 50:
            score = 25.0
        elif market_cap_rank <= 100:
            score = 40.0
        elif market_cap_rank <= 200:
            score = 55.0
        else:
            score = 70.0
    elif market_cap:
        if market_cap > 10_000_000_000:
            score = 20.0
        elif market_cap > 1_000_000_000:
            score = 35.0
        elif market_cap > 100_000_000:
            score = 55.0
        else:
            score = 70.0

    # Chain concentration
    if chain_tvls and len(chain_tvls) > 0:
        total = sum(chain_tvls.values())
        if total > 0:
            max_share = max(chain_tvls.values()) / total
            if max_share > 0.95:
                score += 15  # very concentrated on one chain
            elif max_share > 0.80:
                score += 8
            elif max_share < 0.50:
                score -= 5  # well distributed

    return clamp(score)


def compute_ecosystem_risk(
    tvl: Optional[float],
    tvl_change_24h: Optional[float],
    tvl_change_7d: Optional[float],
    fear_greed_index: Optional[int],
    price_change_7d: Optional[float],
) -> float:
    """
    Ecosystem Risk (0=low risk, 100=high risk).

    Factors:
    - TVL level
    - TVL trend
    - Market sentiment (fear & greed)
    - Price trend
    """
    score = 50.0

    # TVL level
    if tvl is not None:
        if tvl > 5_000_000_000:
            score -= 20
        elif tvl > 1_000_000_000:
            score -= 10
        elif tvl > 100_000_000:
            score -= 0
        elif tvl > 10_000_000:
            score += 10
        elif tvl > 0:
            score += 20
        else:
            score += 5  # no TVL = not a DeFi protocol

    # TVL trend
    if tvl_change_24h is not None:
        if tvl_change_24h < -10:
            score += 15
        elif tvl_change_24h < -5:
            score += 8
        elif tvl_change_24h > 10:
            score -= 5
    if tvl_change_7d is not None:
        if tvl_change_7d < -20:
            score += 10
        elif tvl_change_7d > 20:
            score -= 5

    # Fear & Greed
    if fear_greed_index is not None:
        if fear_greed_index < 20:  # Extreme Fear
            score += 10
        elif fear_greed_index > 80:  # Extreme Greed (frothy)
            score += 8
        elif 40 <= fear_greed_index <= 60:  # Neutral
            score -= 5

    # Price trend (7d)
    if price_change_7d is not None:
        if price_change_7d < -30:
            score += 10
        elif price_change_7d < -15:
            score += 5

    return clamp(score)


def compute_overall_risk(liquidity: float, concentration: float, ecosystem: float) -> float:
    """Weighted average of component risks."""
    return clamp(liquidity * 0.40 + concentration * 0.30 + ecosystem * 0.30)


def compute_all_risks(
    total_liquidity: Optional[float] = None,
    volume_24h: Optional[float] = None,
    volume_liquidity_ratio: Optional[float] = None,
    market_cap: Optional[float] = None,
    market_cap_rank: Optional[int] = None,
    chain_tvls: Optional[Dict[str, float]] = None,
    tvl: Optional[float] = None,
    tvl_change_24h: Optional[float] = None,
    tvl_change_7d: Optional[float] = None,
    fear_greed_index: Optional[int] = None,
    price_change_7d: Optional[float] = None,
) -> Dict[str, float]:
    liq = compute_liquidity_risk(total_liquidity, volume_24h, volume_liquidity_ratio, market_cap)
    con = compute_concentration_risk(market_cap, market_cap_rank, chain_tvls)
    eco = compute_ecosystem_risk(tvl, tvl_change_24h, tvl_change_7d, fear_greed_index, price_change_7d)
    overall = compute_overall_risk(liq, con, eco)
    return {
        "liquidity_risk": round(liq, 1),
        "concentration_risk": round(con, 1),
        "ecosystem_risk": round(eco, 1),
        "overall_risk": round(overall, 1),
    }
