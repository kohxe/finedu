from fastapi import APIRouter, Query
from pydantic import BaseModel
import anthropic
import os
import json
from cache import cache_get, cache_set

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
_term_cache: dict[str, dict] = {}

CATEGORIES = {
    "stock": "주식",
    "sector": "섹터·테마주",
    "commodity": "원자재·실물자산",
    "fund": "펀드·ETF",
    "macro": "거시경제",
    "micro": "미시경제",
    "trading": "차트·매매",
    "candle": "캔들·패턴",
    "financial": "재무제표·회계",
    "account": "계좌·세금",
    "bond": "채권·금리",
    "global": "글로벌 시장",
    "crypto": "가상자산",
    "realestate": "부동산·대출",
    "psychology": "투자심리",
}

# 카테고리별 아이콘 (프론트에서 활용)
CATEGORY_META = {
    "stock":      {"label": "주식",        "emoji": "📈", "color": "blue"},
    "sector":     {"label": "섹터·테마주",   "emoji": "🎯", "color": "indigo"},
    "commodity":  {"label": "원자재·실물",   "emoji": "⛏️", "color": "stone"},
    "fund":       {"label": "펀드·ETF",    "emoji": "🧺", "color": "purple"},
    "macro":      {"label": "거시경제",    "emoji": "🌍", "color": "green"},
    "micro":      {"label": "미시경제",    "emoji": "🔬", "color": "teal"},
    "trading":    {"label": "차트·매매",   "emoji": "📊", "color": "orange"},
    "candle":     {"label": "캔들·패턴",   "emoji": "🕯️", "color": "orange"},
    "financial":  {"label": "재무제표·회계", "emoji": "📑", "color": "emerald"},
    "account":    {"label": "계좌·세금",   "emoji": "🏦", "color": "yellow"},
    "bond":       {"label": "채권·금리",   "emoji": "📜", "color": "red"},
    "global":     {"label": "글로벌 시장", "emoji": "🌐", "color": "cyan"},
    "crypto":     {"label": "가상자산",    "emoji": "₿",  "color": "amber"},
    "realestate": {"label": "부동산·대출", "emoji": "🏠", "color": "rose"},
    "psychology": {"label": "투자심리",    "emoji": "🧠", "color": "violet"},
}

TERM_LIST = {
    "stock": [
        "주가수익비율(PER)", "주가순자산비율(PBR)", "EPS(주당순이익)", "ROE(자기자본이익률)",
        "시가총액", "배당수익률", "배당락", "유상증자", "무상증자", "액면분할",
        "공매도", "서킷브레이커", "사이드카", "블루칩", "우선주", "보통주",
        "코스피", "코스닥", "코넥스", "나스닥", "S&P500", "다우존스",
        "상장폐지", "관리종목", "52주 신고가/신저가", "외국인 순매수",
        "IPO(기업공개)", "스팩(SPAC)", "자사주 매입(바이백)", "주주환원",
        "경영권 분쟁", "적대적 M&A", "백기사·흑기사", "지주회사",
        "ROA(총자산이익률)", "부채비율", "영업이익률", "순이익률",
        "성장주", "가치주", "배당주", "경기민감주(시클리컬)", "경기방어주(디펜시브)",
        "코스피200", "소형주·중형주·대형주", "수급", "기관 순매수", "프로그램 매매",
    ],
    "sector": [
        "섹터(업종) 투자", "테마주", "작전주", "방산주", "반도체주",
        "바이오·헬스케어주", "2차전지주", "AI·로봇주", "플랫폼주",
        "조선주", "자동차주", "화장품·K뷰티주", "엔터테인먼트주",
        "리오프닝주", "수혜주", "낙수주", "정책주",
        "대장주", "주포(세력)", "매집", "개미털기",
        "모멘텀 투자", "이벤트 드리븐", "숏 스퀴즈",
        "섹터 로테이션", "경기 선행주·후행주", "수출주·내수주",
        "그린에너지주", "원전주", "우주항공주", "메타버스주",
        "금융주", "보험주", "증권주", "유통·소비재주",
    ],
    "fund": [
        "ETF(상장지수펀드)", "인덱스펀드", "액티브펀드", "NAV(순자산가치)",
        "운용보수(TER)", "펀드매니저", "TDF(타깃데이트펀드)", "리밸런싱",
        "분산투자", "포트폴리오", "벤치마크", "초과수익(알파)", "추적오차",
        "레버리지 ETF", "인버스 ETF", "섹터 ETF", "채권혼합형 펀드",
        "테마 ETF", "커버드콜 ETF", "배당 ETF", "리츠(REITs)",
        "헤지펀드", "사모펀드(PEF)", "공모펀드", "MMF(머니마켓펀드)",
        "샤프지수", "최대낙폭(MDD)", "변동성", "베타(β)",
    ],
    "macro": [
        "GDP(국내총생산)", "기준금리", "인플레이션", "디플레이션", "스태그플레이션",
        "테이퍼링", "양적완화(QE)", "양적긴축(QT)", "무역수지", "경상수지",
        "환율", "FOMC", "CPI(소비자물가지수)", "PPI(생산자물가지수)",
        "실업률", "고용지표", "PMI(구매관리자지수)", "ISM지수",
        "달러인덱스(DXY)", "빅맥지수", "버핏지수",
        "경기침체(리세션)", "연착륙·경착륙", "경기 사이클(호황·침체·회복·성장)",
        "재정정책·통화정책", "국가부채", "재정적자", "국채 발행",
        "중앙은행(Fed·ECB·BOJ·한은)", "점도표(Dot Plot)", "잭슨홀 미팅",
    ],
    "micro": [
        "수요와 공급", "가격탄력성", "시장실패", "독점", "과점", "완전경쟁",
        "한계비용", "기회비용", "규모의 경제", "외부효과", "공공재",
        "정보비대칭", "도덕적 해이", "역선택",
        "네트워크 효과", "락인(Lock-in) 효과", "해자(Moat)",
        "가격결정력(Pricing Power)", "수직계열화", "수평적 통합",
    ],
    "trading": [
        "매수·매도", "손절(스탑로스)", "익절(테이크프로핏)", "물타기", "불타기",
        "RSI(상대강도지수)", "MACD", "볼린저밴드", "이동평균선(MA)", "거래량",
        "캔들차트", "지지선", "저항선", "골든크로스", "데드크로스",
        "갭상승·갭하락", "시초가·종가", "상한가·하한가", "호가창",
        "시장가 주문", "지정가 주문", "예약매수", "분할매수",
        "일목균형표", "피보나치 되돌림", "VWAP", "거래량 프로파일",
        "스캘핑", "스윙매매", "포지션 트레이딩", "손익비(R:R)",
        "추세추종", "역추세 매매", "눌림목", "돌파 매매",
        "오버나잇(익일 보유)", "당일매매(데이트레이딩)",
    ],
    "candle": [
        "양봉·음봉의 기본 원리",
        "캔들 몸통·꼬리(위꼬리·아랫꼬리)의 의미",
        "마루보즈(Marubozu) — 꼬리 없는 강력한 캔들",
        "도지(Doji) — 시장의 망설임",
        "십자 도지(Long-legged Doji)",
        "비석 도지(Gravestone Doji)",
        "잠자리 도지(Dragonfly Doji)",
        "팽이형(Spinning Top) — 방향 없는 혼조세",
        "망치형(Hammer) — 하락 끝의 반전 신호",
        "역망치형(Inverted Hammer)",
        "교수형(Hanging Man) — 상승 끝의 경고",
        "유성형(Shooting Star) — 하락 전환 경고",
        "상승장악형(Bullish Engulfing)",
        "하락장악형(Bearish Engulfing)",
        "관통형(Piercing Line) — 하락 추세 반전",
        "먹구름형(Dark Cloud Cover)",
        "하라미(Harami) — 임신형 패턴",
        "상승하라미(Bullish Harami) vs 하락하라미(Bearish Harami)",
        "샛별형(Morning Star) — 3개 캔들 반전 패턴",
        "저녁별형(Evening Star)",
        "적삼병(Three White Soldiers) — 강력한 상승 신호",
        "흑삼병(Three Black Crows) — 강력한 하락 신호",
        "캔들 패턴의 한계와 거래량 필터 조건",
        "일봉·주봉·월봉 — 시간 단위별 패턴 해석 차이",
    ],
    "financial": [
        "손익계산서(P&L) — 기업의 수익성 성적표",
        "재무상태표(대차대조표) — 자산·부채·자본 구조",
        "현금흐름표 — 돈이 실제로 도는 경로",
        "영업활동현금흐름(OCF) vs 순이익의 차이",
        "잉여현금흐름(FCF) — 진짜 돈 버는 기업 가리기",
        "매출총이익·영업이익·순이익 — 3단계 이익 구조",
        "EBITDA — 기업 수익성의 국제 기준",
        "영업이익률 — 업종별 기준 수치",
        "부채비율 — 이 기업 빚이 너무 많지 않을까?",
        "유동비율·당좌비율 — 단기 지급 능력",
        "이자보상배율 — 이자도 못 내는 좀비기업 판별",
        "재고자산 회전율 — 물건이 잘 팔리는가",
        "매출채권 회전율 — 돈을 제때 받고 있는가",
        "ROE·ROA·ROIC 차이와 활용",
        "분식회계 의심 신호 7가지",
        "감사의견 — 적정·한정·부적정·의견거절 차이",
        "연결재무제표 vs 별도재무제표",
        "순운전자본(NWC) — 운영 자금 여유도",
        "자본잠식 — 상장폐지 직전의 경고등",
        "IR 자료·사업보고서 읽는 순서",
    ],
    "account": [
        "증권계좌", "CMA통장", "ISA계좌(개인종합자산관리)", "연금저축계좌",
        "IRP(개인형퇴직연금)", "DC형·DB형 퇴직연금", "해외주식 계좌",
        "양도소득세", "배당소득세", "금융종합과세", "분리과세",
        "손익통산", "결제일(T+2)", "예수금", "대용금", "미수금",
        "신용거래", "담보비율", "반대매매",
        "비과세 해외주식펀드", "소득공제·세액공제", "연말정산",
        "건강보험료 피부양자 탈락 기준", "금융소득 2000만원 기준",
    ],
    "bond": [
        "채권", "국채", "회사채", "채권수익률(금리)", "채권 듀레이션",
        "신용등급(AAA~D)", "금리와 채권가격의 반비례", "만기수익률(YTM)",
        "스프레드", "제로금리", "마이너스 금리", "장단기 금리 역전(인버전)",
        "기준금리 인상·인하", "한국은행 금통위", "연준(Fed)",
        "하이일드 채권(정크본드)", "투자등급 채권", "물가연동채권(TIPS)",
        "전환사채(CB)", "신주인수권부사채(BW)", "영구채(코코본드)",
    ],
    "global": [
        "뉴욕증시(NYSE·NASDAQ)", "런던증시(LSE)", "상해종합지수", "닛케이225",
        "항셍지수", "MSCI 지수", "선진국·신흥국 ETF",
        "달러 강세·약세", "엔캐리트레이드", "위안화 절상·절하",
        "유가(WTI·브렌트)", "금(Gold) 가격", "구리 가격",
        "글로벌 공급망", "무역전쟁", "지정학적 리스크",
        "미중 반도체 전쟁", "관세·보호무역", "탈달러화(De-dollarization)",
        "인도 증시", "베트남 증시", "중동 오일머니",
        "VIX(공포지수)", "테슬라·엔비디아·애플 등 주요 종목 동향",
    ],
    "crypto": [
        "비트코인(BTC)", "이더리움(ETH)", "알트코인", "스테이블코인",
        "블록체인", "탈중앙화(DeFi)", "NFT", "채굴(마이닝)",
        "반감기", "지갑(월렛)", "거래소(CEX·DEX)", "시드(Seed phrase)",
        "김치프리미엄", "공포탐욕지수",
        "솔라나(SOL)", "리플(XRP)", "온체인 분석",
        "비트코인 현물 ETF", "기관 매집", "고래(Whale)",
        "러그풀(Rug Pull)", "스캠 코인 식별법",
    ],
    "realestate": [
        "LTV(주택담보대출비율)", "DTI(총부채상환비율)", "DSR(총부채원리금상환비율)",
        "전세·월세", "갭투자", "역전세", "보증금반환보증",
        "청약통장", "분양가 상한제", "재개발·재건축",
        "공시가격", "취득세", "양도소득세(부동산)", "종합부동산세(종부세)",
        "고정금리·변동금리", "원리금균등상환·원금균등상환",
        "임대수익률(월세)", "부동산 리츠(REITs)", "경매 투자",
        "토지거래허가구역", "투기과열지구", "조정대상지역",
    ],
    "commodity": [
        "금(Gold) — 안전자산·헷징 수단", "금 현물 vs 금 ETF vs 금통장", "금과 달러의 역상관",
        "원유(WTI·브렌트) 차이", "유가가 오르면 누가 웃고 누가 우는가", "OPEC·OPEC+ 감산·증산",
        "구리 — 경기 선행지표인 이유(닥터 코퍼)", "구리 가격과 주식시장의 관계",
        "희토류(희귀금속) — 미중 패권전쟁의 핵심", "리튬·코발트 — 2차전지 핵심 광물",
        "은(Silver) — 금과 다른 산업재 성격", "백금(플래티넘)·팔라듐",
        "천연가스 — 러시아·유럽 에너지 전쟁", "농산물 선물 — 밀·옥수수·대두",
        "원자재 슈퍼사이클", "상품지수(CRB·Bloomberg Commodity)",
        "인플레이션 헷지로서의 원자재", "실물자산 vs 금융자산",
        "원자재 ETF 투자법", "선물 롤오버 비용(콘탱고·백워데이션)",
        "달러와 원자재 가격의 관계", "지정학 리스크와 에너지 가격",
    ],
    "psychology": [
        "손실회피 편향", "확증 편향", "앵커링 효과", "군중심리(허딩)",
        "FOMO(기회 상실 공포)", "패닉셀링", "공황매도",
        "과잉확신 편향(오버컨피던스)", "도박사의 오류", "매몰비용 오류",
        "귀인 오류", "생존자 편향", "후견지명 편향",
        "처분 효과(이익은 빨리, 손실은 늦게)", "심리적 회계(Mental Accounting)",
        "감정적 매매", "뇌동매매", "역발상 투자(Contrarian)",
        "공포와 탐욕 지수", "투자 일지의 중요성",
        "존 보글의 인덱스 철학", "피터 린치의 10루타 심리",
        "워렌 버핏의 공포에 사라 원칙",
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

    db_cached = cache_get(cache_key)
    if db_cached:
        _term_cache[cache_key] = db_cached
        return db_cached

    level_prompts = {
        "beginner": f"""금융 용어 '{req.term}'을 금융을 전혀 모르는 완전 초보자에게 설명해줘.
- 전문 용어 사용 금지. 어려운 단어가 나오면 바로 풀어써야 함
- 일상생활 비유 필수 (마트, 용돈, 아르바이트 등 누구나 아는 것으로)
- 숫자 예시는 10만원~100만원 수준으로 친근하게
- 말투: 친한 친구한테 설명하듯 편하고 쉽게

JSON 형식으로만 답해줘 (마크다운 없이 순수 JSON):
{{
  "definition": "중학생도 이해할 수 있는 1문장 정의. 전문 용어 절대 사용 금지",
  "analogy": "일상생활 비유로 쉽게 설명. 마트·용돈·친구 빌려주기 같은 예시로 3~4문장",
  "why_important": "왜 이걸 알아야 하는지 초보자 눈높이로 2문장. '주식을 살 때~' 처럼 직접적으로",
  "key_points": ["꼭 기억할 것 1 (한 줄, 쉽게)", "꼭 기억할 것 2 (한 줄, 쉽게)", "꼭 기억할 것 3 (한 줄, 쉽게)"],
  "quick_tip": "오늘 당장 할 수 있는 초보자용 실천 팁 1줄"
}}""",
        "intermediate": f"""금융 용어 '{req.term}'을 투자를 시작한 지 1~2년 된 중급자에게 설명해줘.
- 기본 개념은 알고 있다고 가정. 심화 내용에 집중
- 실제 투자 상황에서 어떻게 활용하는지 구체적으로
- 수치·지표·비율을 포함한 실전 예시 필수
- 흔히 오해하는 부분이나 함정 포함

JSON 형식으로만 답해줘 (마크다운 없이 순수 JSON):
{{
  "definition": "정확하고 간결한 1문장 정의. 핵심 메커니즘 포함",
  "analogy": "실전 투자 맥락에서 이해할 수 있는 구체적 예시. 실제 수치나 상황 포함. 3~4문장",
  "why_important": "포트폴리오 운용·종목 선택에서 실제로 어떻게 쓰이는지 2~3문장",
  "key_points": ["실전 활용 포인트 1 (구체적 수치나 기준 포함)", "자주 하는 실수 또는 오해", "프로가 이 지표를 보는 방식"],
  "quick_tip": "지금 당장 HTS/MTS에서 확인하거나 적용할 수 있는 구체적 팁"
}}""",
        "advanced": f"""금융 용어 '{req.term}'을 전문 투자자·트레이더 수준으로 깊이 설명해줘.
- 이론적 배경, 공식, 한계점까지 완전한 설명
- 기관투자자·퀀트·헤지펀드가 실제로 활용하는 방식
- 다른 지표·개념과의 연관성 및 상호작용
- 실무에서 알려진 함정이나 엣지 케이스

JSON 형식으로만 답해줘 (마크다운 없이 순수 JSON):
{{
  "definition": "학술적으로 정확한 정의. 수식이나 계산 방법 포함 가능",
  "analogy": "심화 메커니즘 설명. 다른 지표와의 상관관계, 시장 임팩트, 한계점까지. 4~5문장",
  "why_important": "기관·퀀트 관점에서의 활용법. 알파 창출 또는 리스크 관리에 어떻게 연결되는지",
  "key_points": ["핵심 공식 또는 계산 방법", "시장 구조적 함의 또는 한계점", "고급 활용 전략 또는 파생 지표"],
  "quick_tip": "전문가만 아는 실전 엣지 또는 자주 간과되는 심화 포인트"
}}""",
    }

    prompt = level_prompts.get(req.level, level_prompts["beginner"])
    max_tokens = {"beginner": 1024, "intermediate": 1536, "advanced": 2048}.get(req.level, 1024)

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )

    import re
    text = message.content[0].text
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    parsed = None
    if json_match:
        try:
            parsed = json.loads(json_match.group())
        except json.JSONDecodeError:
            pass
    if not parsed:
        parsed = {
            "definition": "내용을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.",
            "analogy": "",
            "why_important": "",
            "key_points": [],
            "quick_tip": "",
        }

    result = {"term": req.term, "category": req.category, "level": req.level, **parsed}
    _term_cache[cache_key] = result
    cache_set(cache_key, result)
    return result


@router.get("/search")
async def search_term(q: str = Query(..., min_length=1)):
    all_terms = []
    for category, terms in TERM_LIST.items():
        for term in terms:
            if q.lower() in term.lower():
                all_terms.append({"term": term, "category": category})
    return {"results": all_terms, "count": len(all_terms)}
