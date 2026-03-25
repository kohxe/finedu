"use client";

import { useState, useEffect, useRef } from "react";
import { BarChart2, Loader2, Brain, Search, Star, TrendingUp, ExternalLink } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const KR_STOCKS = [
  { symbol: "005930", name: "삼성전자", market: "KR" },
  { symbol: "000660", name: "SK하이닉스", market: "KR" },
  { symbol: "035420", name: "NAVER", market: "KR" },
  { symbol: "005380", name: "현대차", market: "KR" },
  { symbol: "035720", name: "카카오", market: "KR" },
  { symbol: "207940", name: "삼성바이오로직스", market: "KR" },
  { symbol: "006400", name: "삼성SDI", market: "KR" },
  { symbol: "051910", name: "LG화학", market: "KR" },
  { symbol: "068270", name: "셀트리온", market: "KR" },
  { symbol: "105560", name: "KB금융", market: "KR" },
];

const US_STOCKS = [
  { symbol: "AAPL", name: "Apple", market: "US" },
  { symbol: "MSFT", name: "Microsoft", market: "US" },
  { symbol: "NVDA", name: "NVIDIA", market: "US" },
  { symbol: "GOOGL", name: "Alphabet", market: "US" },
  { symbol: "AMZN", name: "Amazon", market: "US" },
  { symbol: "META", name: "Meta", market: "US" },
  { symbol: "TSLA", name: "Tesla", market: "US" },
  { symbol: "SPY", name: "S&P500 ETF", market: "US" },
  { symbol: "QQQ", name: "나스닥100 ETF", market: "US" },
  { symbol: "BRK.B", name: "버크셔 해서웨이", market: "US" },
];

const KR_TOP5 = ["005930", "000660", "035420", "005380", "035720"];
const US_TOP5 = ["AAPL", "NVDA", "MSFT", "TSLA", "SPY"];

type Stock = { symbol: string; name: string; market: string };

function TradingViewWidget({ symbol, market }: { symbol: string; market: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = market === "KR" ? `KRX:${symbol}` : symbol;

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      height: 560,
      symbol: tvSymbol,
      interval: "D",
      timezone: "Asia/Seoul",
      theme: "dark",
      style: "1",
      locale: "kr",
      hide_side_toolbar: false,
      allow_symbol_change: true,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);
  }, [tvSymbol]);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{ height: "560px", width: "100%" }}
    >
      <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

function StockRow({
  stock,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: {
  stock: Stock;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`flex items-center px-3 py-2.5 border-b border-slate-800/50 last:border-0 cursor-pointer transition-colors group ${
        isSelected ? "bg-green-600/20" : "hover:bg-slate-800/60"
      }`}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm truncate ${isSelected ? "text-green-300" : "text-slate-200"}`}>
          {stock.name}
        </div>
        <div className="text-xs text-slate-500">{stock.symbol}</div>
      </div>
      <button
        onClick={onToggleFavorite}
        className={`ml-1 p-1 rounded transition-colors ${
          isFavorite ? "text-yellow-400" : "text-slate-600 hover:text-yellow-400 opacity-0 group-hover:opacity-100"
        }`}
      >
        <Star size={13} fill={isFavorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

export default function ChartsPage() {
  const [marketTab, setMarketTab] = useState<"KR" | "US">("KR");
  const [selectedStock, setSelectedStock] = useState<Stock>(KR_STOCKS[0]);
  const [explanation, setExplanation] = useState("");
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  const allStocks = marketTab === "KR" ? KR_STOCKS : US_STOCKS;
  const top5Symbols = marketTab === "KR" ? KR_TOP5 : US_TOP5;
  const top5Stocks = top5Symbols.map((s) => allStocks.find((st) => st.symbol === s)!).filter(Boolean);

  const favoriteStocks = allStocks.filter((s) => favorites.includes(s.symbol));

  const filteredStocks = searchQuery.trim()
    ? allStocks.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allStocks;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("chart_favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  function toggleFavorite(e: React.MouseEvent, symbol: string) {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      localStorage.setItem("chart_favorites", JSON.stringify(next));
      return next;
    });
  }

  function selectStock(stock: Stock) {
    setSelectedStock(stock);
    setExplanation("");
  }

  function switchMarket(market: "KR" | "US") {
    setMarketTab(market);
    setSearchQuery("");
    selectStock(market === "KR" ? KR_STOCKS[0] : US_STOCKS[0]);
  }

  async function getAIExplanation() {
    setLoadingExplain(true);
    setExplanation("");
    try {
      const res = await fetch(`${API_URL}/api/ai/chart-explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedStock.symbol,
          name: selectedStock.name,
          market: selectedStock.market,
          period: "1개월",
        }),
      });
      const data = await res.json();
      setExplanation(data.explanation);
    } catch {
      setExplanation("AI 해설을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoadingExplain(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <BarChart2 className="text-green-400" size={32} />
          차트 분석
        </h1>
        <p className="text-slate-400">실시간 차트와 AI 해설로 시장 흐름을 이해하세요</p>
      </div>

      {/* 모바일 전용: 컴팩트 종목 선택 바 */}
      <div className="lg:hidden mb-4 space-y-2">
        <div className="flex gap-2">
          <button onClick={() => switchMarket("KR")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${marketTab === "KR" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}>🇰🇷 한국</button>
          <button onClick={() => switchMarket("US")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${marketTab === "US" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}>🇺🇸 미국</button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(marketTab === "KR" ? KR_STOCKS : US_STOCKS).map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => selectStock(stock)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedStock.symbol === stock.symbol
                  ? "bg-green-600 border-green-600 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              {stock.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
        {/* 왼쪽: 종목 사이드바 (데스크탑만) */}
        <div className="hidden lg:flex lg:col-span-1 flex-col gap-3">
          {/* 시장 탭 */}
          <div className="flex gap-2">
            <button
              onClick={() => switchMarket("KR")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                marketTab === "KR" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              🇰🇷 한국
            </button>
            <button
              onClick={() => switchMarket("US")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                marketTab === "US" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              🇺🇸 미국
            </button>
          </div>

          {/* 검색 */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="종목명 / 티커 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg pl-9 pr-3 py-2 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 검색 중일 때: 검색 결과만 */}
          {searchQuery.trim() ? (
            <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-800">
                검색 결과 {filteredStocks.length}개
              </div>
              {filteredStocks.length === 0 ? (
                <div className="px-3 py-4 text-sm text-slate-500 text-center">종목을 찾을 수 없습니다</div>
              ) : (
                filteredStocks.map((stock) => (
                  <StockRow
                    key={stock.symbol}
                    stock={stock}
                    isSelected={selectedStock.symbol === stock.symbol}
                    isFavorite={favorites.includes(stock.symbol)}
                    onSelect={() => selectStock(stock)}
                    onToggleFavorite={(e) => toggleFavorite(e, stock.symbol)}
                  />
                ))
              )}
            </div>
          ) : (
            <>
              {/* 즐겨찾기 */}
              {favoriteStocks.length > 0 && (
                <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 flex items-center gap-1.5 border-b border-slate-800">
                    <Star size={12} className="text-yellow-400" fill="currentColor" />
                    <span className="text-xs font-medium text-yellow-400">즐겨찾기</span>
                  </div>
                  {favoriteStocks.map((stock) => (
                    <StockRow
                      key={stock.symbol}
                      stock={stock}
                      isSelected={selectedStock.symbol === stock.symbol}
                      isFavorite={true}
                      onSelect={() => selectStock(stock)}
                      onToggleFavorite={(e) => toggleFavorite(e, stock.symbol)}
                    />
                  ))}
                </div>
              )}

              {/* TOP 5 */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 flex items-center gap-1.5 border-b border-slate-800">
                  <TrendingUp size={12} className="text-green-400" />
                  <span className="text-xs font-medium text-green-400">인기 TOP 5</span>
                </div>
                {top5Stocks.map((stock, i) => (
                  <div key={stock.symbol} className="flex items-center">
                    <span className="pl-3 text-xs font-bold text-slate-600 w-6">{i + 1}</span>
                    <div className="flex-1">
                      <StockRow
                        stock={stock}
                        isSelected={selectedStock.symbol === stock.symbol}
                        isFavorite={favorites.includes(stock.symbol)}
                        onSelect={() => selectStock(stock)}
                        onToggleFavorite={(e) => toggleFavorite(e, stock.symbol)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 전체 종목 */}
              <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-800">전체 종목</div>
                {allStocks.map((stock) => (
                  <StockRow
                    key={stock.symbol}
                    stock={stock}
                    isSelected={selectedStock.symbol === stock.symbol}
                    isFavorite={favorites.includes(stock.symbol)}
                    onSelect={() => selectStock(stock)}
                    onToggleFavorite={(e) => toggleFavorite(e, stock.symbol)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* 차트 + 해설 (모바일에서 먼저, 데스크탑은 오른쪽) */}
        <div className="lg:col-span-3 space-y-4 order-first lg:order-none">
          {/* 차트 헤더 */}
          <div className="flex items-center justify-between bg-[#111827] border border-slate-800 rounded-xl px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-lg">{selectedStock.name}</span>
              <span className="text-slate-500 text-sm">{selectedStock.symbol}</span>
              <button
                onClick={(e) => toggleFavorite(e, selectedStock.symbol)}
                className="p-1 rounded transition-colors"
              >
                <Star
                  size={16}
                  className={favorites.includes(selectedStock.symbol) ? "text-yellow-400" : "text-slate-600 hover:text-yellow-400"}
                  fill={favorites.includes(selectedStock.symbol) ? "currentColor" : "none"}
                />
              </button>
            </div>
            <button
              onClick={getAIExplanation}
              disabled={loadingExplain}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {loadingExplain ? <Loader2 size={15} className="animate-spin" /> : <Brain size={15} />}
              AI 해설 보기
            </button>
          </div>

          {/* TradingView 차트 */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
            <TradingViewWidget symbol={selectedStock.symbol} market={selectedStock.market} />
            <div className="px-4 py-2.5 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-600">Powered by TradingView</span>
              <a
                href="https://www.tradingview.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink size={11} />
                TradingView에서 더 자세히 보기 (무료 가입)
              </a>
            </div>
          </div>

          {/* AI 해설 */}
          {(loadingExplain || explanation) && (
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="text-purple-400" size={18} />
                <span className="font-semibold text-white text-sm">AI 해설</span>
                <span className="text-xs text-slate-500">교육 목적의 분석이며 투자 권유가 아닙니다</span>
              </div>
              {loadingExplain ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  AI가 분석 중입니다...
                </div>
              ) : (
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {explanation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
