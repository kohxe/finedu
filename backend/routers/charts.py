from fastapi import APIRouter, Query
import httpx

router = APIRouter()

KR_STOCKS = [
    {"symbol": "005930", "name": "삼성전자", "market": "KR"},
    {"symbol": "000660", "name": "SK하이닉스", "market": "KR"},
    {"symbol": "035420", "name": "NAVER", "market": "KR"},
    {"symbol": "005380", "name": "현대차", "market": "KR"},
    {"symbol": "051910", "name": "LG화학", "market": "KR"},
    {"symbol": "006400", "name": "삼성SDI", "market": "KR"},
    {"symbol": "035720", "name": "카카오", "market": "KR"},
    {"symbol": "207940", "name": "삼성바이오로직스", "market": "KR"},
]

US_STOCKS = [
    {"symbol": "AAPL", "name": "Apple", "market": "US"},
    {"symbol": "MSFT", "name": "Microsoft", "market": "US"},
    {"symbol": "NVDA", "name": "NVIDIA", "market": "US"},
    {"symbol": "GOOGL", "name": "Alphabet", "market": "US"},
    {"symbol": "AMZN", "name": "Amazon", "market": "US"},
    {"symbol": "META", "name": "Meta", "market": "US"},
    {"symbol": "TSLA", "name": "Tesla", "market": "US"},
    {"symbol": "SPY", "name": "S&P500 ETF", "market": "US"},
    {"symbol": "QQQ", "name": "나스닥100 ETF", "market": "US"},
]


@router.get("/popular")
def get_popular_stocks(market: str = Query(default="ALL")):
    if market == "KR":
        return {"stocks": KR_STOCKS}
    elif market == "US":
        return {"stocks": US_STOCKS}
    return {"stocks": KR_STOCKS + US_STOCKS}


@router.get("/tradingview-symbol")
def get_tradingview_symbol(symbol: str, market: str):
    if market == "KR":
        return {"tv_symbol": f"KRX:{symbol}"}
    return {"tv_symbol": f"NASDAQ:{symbol}"}
