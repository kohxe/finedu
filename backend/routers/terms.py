from fastapi import APIRouter, Query
from pydantic import BaseModel
import anthropic
import os
import json

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
_term_cache: dict[str, dict] = {}

CATEGORIES = {
    "stock": "주식",
    "fund": "펀드·ETF",
    "macro": "거시경제",
    "micro": "미시경제",
    "trading": "차트·매매",
    "account": "계좌·세금",
    "bond": "채권·금리",
    "global": "글로벌 시장",
    "crypto": "가상자산",
    "realestate": "부동산·대출",
}

# 카테고리별 아이콘 (프론트에서 활용)
CATEGORY_META = {
    "stock":      {"label": "주식",        "emoji": "📈", "color": "blue"},
    "fund":       {"label": "펀드·ETF",    "emoji": "🧺", "color": "purple"},
    "macro":      {"label": "거시경제",    "emoji": "🌍", "color": "green"},
    "micro":      {"label": "미시경제",    "emoji": "🔬", "color": "teal"},
    "trading":    {"label": "차트·매매",   "emoji": "📊", "color": "orange"},
    "account":    {"label": "계좌·세금",   "emoji": "🏦", "color": "yellow"},
    "bond":       {"label": "채권·금리",   "emoji": "📜", "color": "red"},
    "global":     {"label": "글로벌 시장", "emoji": "🌐", "color": "cyan"},
    "crypto":     {"label": "가상자산",    "emoji": "₿",  "color": "amber"},
    "realestate": {"label": "부동산·대출", "emoji": "🏠", "color": "rose"},
}

TERM_LIST = {
    "stock": [
        "주가수익비율(PER)", "주가순자산비율(PBR)", "EPS(주당순이익)", "ROE(자기자본이익률)",
        "시가총액", "배당수익률", "배당락", "유상증자", "무상증자", "액면분할",
        "공매도", "서킷브레이커", "사이드카", "블루칩", "우선주", "보통주",
        "코스피", "코스닥", "코넥스", "나스닥", "S&P500", "다우존스",
        "상장폐지", "관리종목", "52주 신고가/신저가", "외국인 순매수",
    ],
    "fund": [
        "ETF(상장지수펀드)", "인덱스펀드", "액티브펀드", "NAV(순자산가치)",
        "운용보수(TER)", "펀드매니저", "TDF(타깃데이트펀드)", "리밸런싱",
        "분산투자", "포트폴리오", "벤치마크", "초과수익(알파)", "추적오차",
        "레버리지 ETF", "인버스 ETF", "섹터 ETF", "채권혼합형 펀드",
    ],
    "macro": [
        "GDP(국내총생산)", "기준금리", "인플레이션", "디플레이션", "스태그플레이션",
        "테이퍼링", "양적완화(QE)", "양적긴축(QT)", "무역수지", "경상수지",
        "환율", "FOMC", "CPI(소비자물가지수)", "PPI(생산자물가지수)",
        "실업률", "고용지표", "PMI(구매관리자지수)", "ISM지수",
        "달러인덱스(DXY)", "빅맥지수", "버핏지수",
    ],
    "micro": [
        "수요와 공급", "가격탄력성", "시장실패", "독점", "과점", "완전경쟁",
        "한계비용", "기회비용", "규모의 경제", "외부효과", "공공재",
        "정보비대칭", "도덕적 해이", "역선택",
    ],
    "trading": [
        "매수·매도", "손절(스탑로스)", "익절(테이크프로핏)", "물타기", "불타기",
        "RSI(상대강도지수)", "MACD", "볼린저밴드", "이동평균선(MA)", "거래량",
        "캔들차트", "지지선", "저항선", "골든크로스", "데드크로스",
        "갭상승·갭하락", "시초가·종가", "상한가·하한가", "호가창",
        "시장가 주문", "지정가 주문", "예약매수", "분할매수",
    ],
    "account": [
        "증권계좌", "CMA통장", "ISA계좌(개인종합자산관리)", "연금저축계좌",
        "IRP(개인형퇴직연금)", "DC형·DB형 퇴직연금", "해외주식 계좌",
        "양도소득세", "배당소득세", "금융종합과세", "분리과세",
        "손익통산", "결제일(T+2)", "예수금", "대용금", "미수금",
        "신용거래", "담보비율", "반대매매",
    ],
    "bond": [
        "채권", "국채", "회사채", "채권수익률(금리)", "채권 듀레이션",
        "신용등급(AAA~D)", "금리와 채권가격의 반비례", "만기수익률(YTM)",
        "스프레드", "제로금리", "마이너스 금리", "장단기 금리 역전(인버전)",
        "기준금리 인상·인하", "한국은행 금통위", "연준(Fed)",
    ],
    "global": [
        "뉴욕증시(NYSE·NASDAQ)", "런던증시(LSE)", "상해종합지수", "닛케이225",
        "항셍지수", "MSCI 지수", "선진국·신흥국 ETF",
        "달러 강세·약세", "엔캐리트레이드", "위안화 절상·절하",
        "유가(WTI·브렌트)", "금(Gold) 가격", "구리 가격",
        "글로벌 공급망", "무역전쟁", "지정학적 리스크",
    ],
    "crypto": [
        "비트코인(BTC)", "이더리움(ETH)", "알트코인", "스테이블코인",
        "블록체인", "탈중앙화(DeFi)", "NFT", "채굴(마이닝)",
        "반감기", "지갑(월렛)", "거래소(CEX·DEX)", "시드(Seed phrase)",
        "김치프리미엄", "공포탐욕지수",
    ],
    "realestate": [
        "LTV(주택담보대출비율)", "DTI(총부채상환비율)", "DSR(총부채원리금상환비율)",
        "전세·월세", "갭투자", "역전세", "보증금반환보증",
        "청약통장", "분양가 상한제", "재개발·재건축",
        "공시가격", "취득세", "양도소득세(부동산)", "종합부동산세(종부세)",
        "고정금리·변동금리", "원리금균등상환·원금균등상환",
    ],
}


class TermExplainRequest(BaseModel):
    term: str
    category: str
    level: str = "beginner"  # beginner / intermediate / advanced


@router.get("/list")
def get_term_list(category: str = Query(default="stock")):
    terms = TERM_LIST.get(category, [])
    return {"category": category, "terms": terms}


@router.get("/categories")
def get_categories():
    return {"categories": CATEGORIES, "meta": CATEGORY_META}


@router.post("/explain")
async def explain_term(req: TermExplainRequest):
    cache_key = f"{req.term}:{req.level}"
    if cache_key in _term_cache:
        return _term_cache[cache_key]

    level_text = {"beginner": "완전 초보자", "intermediate": "어느 정도 아는 사람", "advanced": "전문 투자자"}.get(req.level, "초보자")

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""금융 용어 '{req.term}'을 {level_text}에게 설명해줘.

반드시 아래 JSON 형식으로만 답해줘. 마크다운이나 다른 텍스트 없이 순수 JSON만:

{{
  "definition": "한 줄 정의 (쉽고 간결하게, 1문장)",
  "analogy": "실생활 비유로 쉽게 설명 (2~3문장, 친근한 말투)",
  "why_important": "투자에서 왜 중요한지 (2문장)",
  "key_points": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "quick_tip": "오늘 바로 써먹을 수 있는 한 줄 팁"
}}""",
            }
        ],
    )

    try:
        text = message.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = {
            "definition": message.content[0].text,
            "analogy": "",
            "why_important": "",
            "key_points": [],
            "quick_tip": "",
        }

    result = {"term": req.term, "category": req.category, "level": req.level, **parsed}
    _term_cache[cache_key] = result
    return result


@router.get("/search")
async def search_term(q: str = Query(..., min_length=1)):
    all_terms = []
    for category, terms in TERM_LIST.items():
        for term in terms:
            if q.lower() in term.lower():
                all_terms.append({"term": term, "category": category})
    return {"results": all_terms, "count": len(all_terms)}
