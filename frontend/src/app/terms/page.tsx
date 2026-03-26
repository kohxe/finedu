"use client";

import { useState } from "react";
import { Search, Loader2, X, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CATEGORIES = [
  { id: "stock",       label: "주식",        emoji: "📈", color: "blue",   desc: "코스피·나스닥·기업가치" },
  { id: "fund",        label: "펀드·ETF",    emoji: "🧺", color: "purple", desc: "분산투자·지수추종" },
  { id: "macro",       label: "거시경제",    emoji: "🌍", color: "green",  desc: "금리·환율·물가·GDP" },
  { id: "micro",       label: "미시경제",    emoji: "🔬", color: "teal",   desc: "수요공급·시장원리" },
  { id: "trading",     label: "차트·매매",   emoji: "📊", color: "orange", desc: "캔들·이동평균·RSI" },
  { id: "account",     label: "계좌·세금",   emoji: "🏦", color: "yellow", desc: "ISA·IRP·세금·계좌" },
  { id: "bond",        label: "채권·금리",   emoji: "📜", color: "red",    desc: "국채·회사채·금리변동" },
  { id: "global",      label: "글로벌 시장", emoji: "🌐", color: "cyan",   desc: "뉴욕·달러·유가·금" },
  { id: "crypto",      label: "가상자산",    emoji: "₿",  color: "amber",  desc: "비트코인·블록체인" },
  { id: "realestate",  label: "부동산·대출", emoji: "🏠", color: "rose",   desc: "LTV·DSR·청약·세금" },
];

const TERM_LIST: Record<string, string[]> = {
  stock:       ["주가수익비율(PER)", "주가순자산비율(PBR)", "EPS(주당순이익)", "ROE(자기자본이익률)", "시가총액", "배당수익률", "배당락", "유상증자", "무상증자", "액면분할", "공매도", "서킷브레이커", "사이드카", "블루칩", "우선주", "보통주", "코스피", "코스닥", "나스닥", "S&P500", "다우존스", "상장폐지", "관리종목", "52주 신고가/신저가", "외국인 순매수"],
  fund:        ["ETF(상장지수펀드)", "인덱스펀드", "액티브펀드", "NAV(순자산가치)", "운용보수(TER)", "펀드매니저", "TDF(타깃데이트펀드)", "리밸런싱", "분산투자", "포트폴리오", "벤치마크", "초과수익(알파)", "추적오차", "레버리지 ETF", "인버스 ETF", "섹터 ETF", "채권혼합형 펀드"],
  macro:       ["GDP(국내총생산)", "기준금리", "인플레이션", "디플레이션", "스태그플레이션", "테이퍼링", "양적완화(QE)", "양적긴축(QT)", "무역수지", "경상수지", "환율", "FOMC", "CPI(소비자물가지수)", "PPI(생산자물가지수)", "실업률", "고용지표", "PMI(구매관리자지수)", "ISM지수", "달러인덱스(DXY)", "빅맥지수", "버핏지수"],
  micro:       ["수요와 공급", "가격탄력성", "시장실패", "독점", "과점", "완전경쟁", "한계비용", "기회비용", "규모의 경제", "외부효과", "공공재", "정보비대칭", "도덕적 해이", "역선택"],
  trading:     ["매수·매도", "손절(스탑로스)", "익절(테이크프로핏)", "물타기", "불타기", "RSI(상대강도지수)", "MACD", "볼린저밴드", "이동평균선(MA)", "거래량", "캔들차트", "지지선", "저항선", "골든크로스", "데드크로스", "갭상승·갭하락", "시초가·종가", "상한가·하한가", "호가창", "시장가 주문", "지정가 주문", "분할매수"],
  account:     ["증권계좌", "CMA통장", "ISA계좌(개인종합자산관리)", "연금저축계좌", "IRP(개인형퇴직연금)", "DC형·DB형 퇴직연금", "해외주식 계좌", "양도소득세", "배당소득세", "금융종합과세", "분리과세", "손익통산", "결제일(T+2)", "예수금", "미수금", "신용거래", "담보비율", "반대매매"],
  bond:        ["채권", "국채", "회사채", "채권수익률(금리)", "채권 듀레이션", "신용등급(AAA~D)", "금리와 채권가격의 반비례", "만기수익률(YTM)", "스프레드", "제로금리", "마이너스 금리", "장단기 금리 역전(인버전)", "기준금리 인상·인하", "한국은행 금통위", "연준(Fed)"],
  global:      ["뉴욕증시(NYSE·NASDAQ)", "런던증시(LSE)", "상해종합지수", "닛케이225", "항셍지수", "MSCI 지수", "선진국·신흥국 ETF", "달러 강세·약세", "엔캐리트레이드", "위안화 절상·절하", "유가(WTI·브렌트)", "금(Gold) 가격", "구리 가격", "글로벌 공급망", "무역전쟁", "지정학적 리스크"],
  crypto:      ["비트코인(BTC)", "이더리움(ETH)", "알트코인", "스테이블코인", "블록체인", "탈중앙화(DeFi)", "NFT", "채굴(마이닝)", "반감기", "지갑(월렛)", "거래소(CEX·DEX)", "시드(Seed phrase)", "김치프리미엄", "공포탐욕지수"],
  realestate:  ["LTV(주택담보대출비율)", "DTI(총부채상환비율)", "DSR(총부채원리금상환비율)", "전세·월세", "갭투자", "역전세", "보증금반환보증", "청약통장", "분양가 상한제", "재개발·재건축", "공시가격", "취득세", "양도소득세(부동산)", "종합부동산세(종부세)", "고정금리·변동금리", "원리금균등상환·원금균등상환"],
};

const COLOR_MAP: Record<string, { badge: string; btn: string; active: string; glow: string }> = {
  blue:   { badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",   btn: "hover:border-blue-500/50 hover:bg-blue-500/5",   active: "border-blue-500 bg-blue-500/10 text-blue-200",  glow: "shadow-blue-500/20" },
  purple: { badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", btn: "hover:border-purple-500/50 hover:bg-purple-500/5", active: "border-purple-500 bg-purple-500/10 text-purple-200", glow: "shadow-purple-500/20" },
  green:  { badge: "bg-green-500/20 text-green-300 border-green-500/30",  btn: "hover:border-green-500/50 hover:bg-green-500/5",  active: "border-green-500 bg-green-500/10 text-green-200",  glow: "shadow-green-500/20" },
  teal:   { badge: "bg-teal-500/20 text-teal-300 border-teal-500/30",    btn: "hover:border-teal-500/50 hover:bg-teal-500/5",    active: "border-teal-500 bg-teal-500/10 text-teal-200",    glow: "shadow-teal-500/20" },
  orange: { badge: "bg-orange-500/20 text-orange-300 border-orange-500/30", btn: "hover:border-orange-500/50 hover:bg-orange-500/5", active: "border-orange-500 bg-orange-500/10 text-orange-200", glow: "shadow-orange-500/20" },
  yellow: { badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", btn: "hover:border-yellow-500/50 hover:bg-yellow-500/5", active: "border-yellow-500 bg-yellow-500/10 text-yellow-200", glow: "shadow-yellow-500/20" },
  red:    { badge: "bg-red-500/20 text-red-300 border-red-500/30",       btn: "hover:border-red-500/50 hover:bg-red-500/5",       active: "border-red-500 bg-red-500/10 text-red-200",       glow: "shadow-red-500/20" },
  cyan:   { badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",    btn: "hover:border-cyan-500/50 hover:bg-cyan-500/5",    active: "border-cyan-500 bg-cyan-500/10 text-cyan-200",    glow: "shadow-cyan-500/20" },
  amber:  { badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",  btn: "hover:border-amber-500/50 hover:bg-amber-500/5",  active: "border-amber-500 bg-amber-500/10 text-amber-200",  glow: "shadow-amber-500/20" },
  rose:   { badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",    btn: "hover:border-rose-500/50 hover:bg-rose-500/5",    active: "border-rose-500 bg-rose-500/10 text-rose-200",    glow: "shadow-rose-500/20" },
};

const LEVEL_OPTIONS = [
  { id: "beginner",     label: "🌱 초보자" },
  { id: "intermediate", label: "📘 중급자" },
  { id: "advanced",     label: "🎓 전문가" },
];

type TermModal = {
  term: string;
  category: string;
  definition?: string;
  analogy?: string;
  why_important?: string;
  key_points?: string[];
  quick_tip?: string;
} | null;

export default function TermsPage() {
  const [selectedCategory, setSelectedCategory] = useState("stock");
  const [level, setLevel] = useState("beginner");
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState<TermModal>(null);
  const [loading, setLoading] = useState(false);

  const cat = CATEGORIES.find(c => c.id === selectedCategory)!;
  const colors = COLOR_MAP[cat.color];
  const terms = (TERM_LIST[selectedCategory] || []).filter(t =>
    t.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 전체 검색
  const searchResults = searchQuery.length > 1
    ? Object.entries(TERM_LIST).flatMap(([catId, tList]) =>
        tList.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(t => ({ term: t, catId }))
      )
    : [];

  async function explainTerm(term: string, catId: string) {
    setLoading(true);
    setModal({ term, category: catId });
    try {
      const res = await fetch(`${API_URL}/api/terms/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, category: catId, level }),
      });
      const data = await res.json();
      setModal({
        term,
        category: catId,
        definition: data.definition,
        analogy: data.analogy,
        why_important: data.why_important,
        key_points: data.key_points,
        quick_tip: data.quick_tip,
      });
    } catch {
      setModal({ term, category: catId, definition: "⚠️ 백엔드 서버가 실행 중인지 확인해주세요." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">📚 금융 용어 사전</h1>
        <p className="text-slate-400">10개 카테고리, 200개 이상의 용어를 AI가 쉽게 설명해드립니다</p>
      </div>

      {/* 전체 검색바 */}
      <div className="relative mb-8 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="용어 검색... (예: PER, 금리, ETF)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[#111827] border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* 전체 검색 결과 */}
      {searchQuery.length > 1 && (
        <div className="mb-8 bg-[#111827] border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-3">검색 결과 {searchResults.length}개</p>
          <div className="flex flex-wrap gap-2">
            {searchResults.map(({ term, catId }) => {
              const c = CATEGORIES.find(x => x.id === catId)!;
              const col = COLOR_MAP[c.color];
              return (
                <button
                  key={`${catId}-${term}`}
                  onClick={() => { setSearchQuery(""); explainTerm(term, catId); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${col.btn} border-slate-700 text-slate-300`}
                >
                  <span>{c.emoji}</span> {term}
                </button>
              );
            })}
            {searchResults.length === 0 && (
              <p className="text-slate-500 text-sm">검색 결과가 없습니다</p>
            )}
          </div>
        </div>
      )}

      {/* 카테고리 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {CATEGORIES.map(c => {
          const col = COLOR_MAP[c.color];
          const isActive = selectedCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => { setSelectedCategory(c.id); setSearchQuery(""); }}
              className={`flex flex-col items-center gap-1 p-4 rounded-xl border transition-all ${
                isActive
                  ? `${col.active} border-current shadow-lg ${col.glow}`
                  : `bg-[#111827] border-slate-800 text-slate-400 ${col.btn}`
              }`}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-xs font-semibold">{c.label}</span>
              <span className="text-[10px] text-slate-500 text-center leading-tight">{c.desc}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${isActive ? "opacity-70" : "opacity-40"} ${col.badge}`}>
                {TERM_LIST[c.id]?.length}개
              </span>
            </button>
          );
        })}
      </div>

      {/* 레벨 선택 + 용어 목록 */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{cat.emoji}</span>
            <div>
              <h2 className="font-bold text-white">{cat.label}</h2>
              <p className="text-xs text-slate-500">{cat.desc}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {LEVEL_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setLevel(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  level === opt.id ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {terms.map(term => (
            <button
              key={term}
              onClick={() => explainTerm(term, selectedCategory)}
              className={`text-left px-3 py-2.5 rounded-lg border border-slate-800 text-sm text-slate-300 transition-all flex items-center justify-between group ${colors.btn}`}
            >
              <span className="truncate">{term}</span>
              <ChevronRight size={13} className="text-slate-600 shrink-0 group-hover:text-slate-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* 설명 모달 */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white">{modal.term}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${COLOR_MAP[CATEGORIES.find(c => c.id === modal.category)?.color || "blue"].badge}`}>
                  {CATEGORIES.find(c => c.id === modal.category)?.emoji} {CATEGORIES.find(c => c.id === modal.category)?.label}
                </span>
              </div>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center py-10">
                  <Loader2 className="text-blue-400 animate-spin mb-3" size={28} />
                  <p className="text-slate-400 text-sm">AI가 설명을 작성하고 있어요...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 한 줄 정의 */}
                  {modal.definition && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <p className="text-[11px] text-blue-400 font-semibold uppercase tracking-wide mb-1.5">📌 한 줄 정의</p>
                      <p className="text-white font-semibold text-base leading-snug">{modal.definition}</p>
                    </div>
                  )}

                  {/* 쉽게 말하면 */}
                  {modal.analogy && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                      <p className="text-[11px] text-purple-400 font-semibold uppercase tracking-wide mb-1.5">💡 쉽게 말하면</p>
                      <p className="text-slate-300 text-sm leading-relaxed">{modal.analogy}</p>
                    </div>
                  )}

                  {/* 왜 중요한가 */}
                  {modal.why_important && (
                    <div>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-2">📊 투자에서 왜 중요한가</p>
                      <p className="text-slate-300 text-sm leading-relaxed">{modal.why_important}</p>
                    </div>
                  )}

                  {/* 핵심 포인트 */}
                  {modal.key_points && modal.key_points.length > 0 && (
                    <div className="bg-[#0d1323] rounded-xl p-4 border border-slate-800">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-3">✅ 핵심 포인트</p>
                      <ul className="space-y-2">
                        {modal.key_points.map((pt, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                            <span className="text-green-400 font-bold mt-0.5 shrink-0">{i + 1}</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 오늘의 팁 */}
                  {modal.quick_tip && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex gap-2.5 items-start">
                      <span className="text-base shrink-0">⚡</span>
                      <p className="text-yellow-300 text-sm leading-relaxed">{modal.quick_tip}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
