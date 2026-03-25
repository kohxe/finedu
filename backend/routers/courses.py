from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
import json
import re
from datetime import date as _date
from supabase import create_client

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Supabase 클라이언트 (JWT 검증용) — 지연 초기화
_supabase_client = None


def _get_supabase_client():
    """환경 변수를 검증한 뒤 Supabase 클라이언트를 반환한다 (최초 호출 시 생성)."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    supabase_url = os.getenv("SUPABASE_URL", "")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY", "")

    missing = []
    if not supabase_url:
        missing.append("SUPABASE_URL")
    if not supabase_key:
        missing.append("SUPABASE_SERVICE_KEY")
    if missing:
        raise RuntimeError(
            f"필수 환경 변수가 설정되지 않았습니다: {', '.join(missing)}"
        )

    _supabase_client = create_client(supabase_url, supabase_key)
    return _supabase_client

# 인메모리 캐시 - 서버 재시작 전까지 유지
_lesson_cache: dict[str, str] = {}
_quiz_cache: dict[str, dict] = {}
_diagram_cache: dict[str, str] = {}
_daily_quiz_cache: dict[str, dict] = {}

DAILY_QUIZ_TOPICS = [
    "PER(주가수익비율)의 의미와 활용",
    "이동평균선(MA) 읽는 법",
    "RSI 과매수/과매도 신호",
    "분산투자의 원리",
    "기준금리와 주식시장의 관계",
    "ETF와 개별주식의 차이",
    "캔들차트의 기본 구조",
    "거래량이 중요한 이유",
    "손익비(R:R) 계산법",
    "인플레이션과 투자 전략",
    "배당주 투자의 장단점",
    "코스피와 코스닥의 차이",
    "환율이 수출주에 미치는 영향",
    "볼린저밴드 활용법",
    "재무제표에서 영업이익이 중요한 이유",
    "마진콜이란 무엇인가",
    "MACD 지표 보는 법",
    "안전자산과 위험자산의 구분",
    "PBR(주가순자산비율)이란",
    "손절매를 해야 하는 이유",
    "경제지표 CPI란",
    "주식 액면분할이란",
    "상한가와 하한가 제도란",
    "ROE(자기자본이익률)의 의미",
    "섹터 투자의 개념",
    "FOMC가 시장에 미치는 영향",
    "공매도란 무엇인가",
    "포트폴리오 리밸런싱이란",
    "내재가치와 시장가치의 차이",
    "VIX 공포지수란",
]

COURSES = [
    {
        "id": "intro-stock",
        "title": "주식 기초 입문",
        "description": "주식이 뭔지부터 첫 매수까지",
        "level": "beginner",
        "category": "stock",
        "premium": False,
        "lessons": [
            {"id": 1, "title": "주식이란 무엇인가?", "premium": False},
            {"id": 2, "title": "증권 계좌 만들기", "premium": False},
            {"id": 3, "title": "코스피 vs 코스닥", "premium": False},
            {"id": 4, "title": "첫 주식 매수하기", "premium": False},
            {"id": 5, "title": "PER, PBR로 기업 가치 보는 법", "premium": True},
            {"id": 6, "title": "재무제표 읽는 법", "premium": True},
        ],
    },
    {
        "id": "chart-reading",
        "title": "차트 읽기 기초",
        "description": "캔들차트부터 이동평균선까지",
        "level": "beginner",
        "category": "trading",
        "premium": False,
        "lessons": [
            {"id": 1, "title": "캔들차트 이해하기", "premium": False},
            {"id": 2, "title": "거래량이 말해주는 것", "premium": False},
            {"id": 3, "title": "이동평균선(MA) 활용법", "premium": False},
            {"id": 4, "title": "지지선과 저항선", "premium": True},
            {"id": 5, "title": "RSI로 과매수/과매도 판단", "premium": True},
            {"id": 6, "title": "MACD 활용 전략", "premium": True},
        ],
    },
    {
        "id": "macro-economy",
        "title": "거시경제와 주식시장",
        "description": "금리, 환율, 인플레이션이 주가에 미치는 영향",
        "level": "intermediate",
        "category": "macro",
        "premium": False,
        "lessons": [
            {"id": 1, "title": "기준금리란?", "premium": False},
            {"id": 2, "title": "금리 인상/인하와 주식시장", "premium": False},
            {"id": 3, "title": "인플레이션과 투자 전략", "premium": True},
            {"id": 4, "title": "환율이 수출주에 미치는 영향", "premium": True},
            {"id": 5, "title": "FOMC 결과 해석하기", "premium": True},
        ],
    },
    {
        "id": "us-stock",
        "title": "미국 주식 투자",
        "description": "나스닥, S&P500, 미국 ETF 투자 방법",
        "level": "intermediate",
        "category": "stock",
        "premium": False,
        "lessons": [
            {"id": 1, "title": "미국 주식 시장 구조", "premium": False},
            {"id": 2, "title": "S&P500 vs 나스닥 vs 다우", "premium": False},
            {"id": 3, "title": "미국 ETF 투자 방법", "premium": False},
            {"id": 4, "title": "환헤지 여부 결정하기", "premium": True},
            {"id": 5, "title": "미국 실적 시즌 활용법", "premium": True},
        ],
    },
    # ── 중급 PRO ──────────────────────────────────────────────────
    {
        "id": "hedging-portfolio",
        "title": "헷징과 포트폴리오 전략",
        "description": "리스크를 줄이면서 수익을 지키는 분산 전략",
        "level": "intermediate",
        "category": "risk",
        "premium": True,
        "lessons": [
            {"id": 1, "title": "포트폴리오란 무엇인가?", "premium": True},
            {"id": 2, "title": "상관관계와 분산투자의 원리", "premium": True},
            {"id": 3, "title": "주식 + 채권 비율 설계하기", "premium": True},
            {"id": 4, "title": "헷징이란? 하락장에서 자산 지키기", "premium": True},
            {"id": 5, "title": "인버스 ETF와 풋옵션 활용법", "premium": True},
            {"id": 6, "title": "리밸런싱 전략 — 언제 어떻게 조정할까", "premium": True},
        ],
    },
    {
        "id": "sound-finance",
        "title": "건전한 자산 설계",
        "description": "월급쟁이도 할 수 있는 장기 자산 형성 로드맵",
        "level": "intermediate",
        "category": "planning",
        "premium": True,
        "lessons": [
            {"id": 1, "title": "비상금 → 투자금 단계별 자산 배분", "premium": True},
            {"id": 2, "title": "연금저축 vs IRP vs ISA 비교", "premium": True},
            {"id": 3, "title": "세금 아끼는 절세 계좌 활용법", "premium": True},
            {"id": 4, "title": "복리로 1억 만드는 시뮬레이션", "premium": True},
            {"id": 5, "title": "인플레이션을 이기는 실물자산 배분", "premium": True},
        ],
    },
    # ── 고급 PRO ──────────────────────────────────────────────────
    {
        "id": "warren-buffett",
        "title": "워렌 버핏의 가치투자",
        "description": "오마하의 현인이 80년간 증명한 투자 원칙",
        "level": "advanced",
        "category": "value",
        "premium": True,
        "lessons": [
            {"id": 1, "title": "버핏이 말하는 '좋은 기업'의 조건", "premium": True},
            {"id": 2, "title": "경제적 해자(Moat)란 무엇인가?", "premium": True},
            {"id": 3, "title": "내재가치 계산법 — DCF 쉽게 이해하기", "premium": True},
            {"id": 4, "title": "안전마진 — 얼마나 쌀 때 살까?", "premium": True},
            {"id": 5, "title": "버핏이 절대 하지 않는 것들", "premium": True},
            {"id": 6, "title": "버크셔 해서웨이 포트폴리오 분석", "premium": True},
        ],
    },
    {
        "id": "peter-lynch",
        "title": "피터 린치의 성장주 투자",
        "description": "내가 아는 것에 투자하라 — 10루타 주식 찾는 법",
        "level": "advanced",
        "category": "growth",
        "premium": True,
        "lessons": [
            {"id": 1, "title": "10루타(Tenbagger)란? 린치의 투자 철학", "premium": True},
            {"id": 2, "title": "6가지 주식 유형으로 종목 분류하기", "premium": True},
            {"id": 3, "title": "PEG 지표 — 성장주의 적정 가격 판단", "premium": True},
            {"id": 4, "title": "내 주변에서 다음 대박 종목 찾는 법", "premium": True},
            {"id": 5, "title": "린치가 피하는 '기관이 좋아하는 주식'", "premium": True},
            {"id": 6, "title": "마젤란 펀드 13년 29배 수익의 비밀", "premium": True},
        ],
    },
    # ── 고급 PRO — 위험 상품 ─────────────────────────────────────
    {
        "id": "leverage-danger",
        "title": "레버리지의 유혹과 위험",
        "description": "⚠️ 2배 수익의 꿈, 하지만 현실은 — 레버리지 완전 해부",
        "level": "advanced",
        "category": "risk-product",
        "premium": True,
        "lessons": [
            {"id": 1, "title": "레버리지란? 빌린 돈으로 투자하는 원리", "premium": True},
            {"id": 2, "title": "왜 레버리지는 도파민을 자극하는가", "premium": True},
            {"id": 3, "title": "반대매매와 마진콜 — 강제 청산의 공포", "premium": True},
            {"id": 4, "title": "레버리지 ETF의 함정 — 장기보유하면 왜 손해날까", "premium": True},
            {"id": 5, "title": "실제 레버리지 투자 실패 사례 분석", "premium": True},
            {"id": 6, "title": "레버리지를 써도 되는 상황과 절대 안 되는 상황", "premium": True},
        ],
    },
    {
        "id": "futures-market",
        "title": "선물시장의 이해",
        "description": "⚠️ 전문가들의 게임 — 선물/옵션 구조와 개인투자자 생존법",
        "level": "advanced",
        "category": "derivatives",
        "premium": True,
        "lessons": [
            {"id": 1, "title": "선물이란? 미래 가격을 오늘 거래하는 구조", "premium": True},
            {"id": 2, "title": "콘탱고와 백워데이션 — 롤오버 비용의 진실", "premium": True},
            {"id": 3, "title": "옵션 기초 — 콜/풋, 프리미엄 개념 이해", "premium": True},
            {"id": 4, "title": "개인이 선물시장에서 지는 이유 — 구조적 불리함", "premium": True},
            {"id": 5, "title": "선물을 헷징 목적으로 쓰는 올바른 방법", "premium": True},
            {"id": 6, "title": "도박이 되지 않으려면 — 투자와 투기의 경계선", "premium": True},
        ],
    },
    # ── 실전 트레이딩 ────────────────────────────────────────────
    {
        "id": "chart-indicators",
        "title": "차트 고급 지표 마스터",
        "description": "일목균형표부터 피보나치까지 — 프로 트레이더의 지표 활용법",
        "level": "intermediate",
        "category": "technical",
        "premium": True,
        "lessons": [
            {"id": 1, "title": "일목균형표 — 구름대·기준선·전환선 읽기", "premium": True},
            {"id": 2, "title": "볼린저밴드 — 변동성으로 방향 잡기", "premium": True},
            {"id": 3, "title": "피보나치 되돌림 — 지지/저항 예측하기", "premium": True},
            {"id": 4, "title": "VWAP와 거래량 프로파일 활용", "premium": True},
            {"id": 5, "title": "다이버전스 — 지표와 가격의 엇갈림 포착", "premium": True},
            {"id": 6, "title": "복합 지표 조합 — 신호 겹치는 구간 공략", "premium": True},
        ],
    },
    {
        "id": "trading-strategy",
        "title": "스윙매매 & 스캘핑 전략",
        "description": "단기 트레이딩의 모든 것 — 진입·청산·손절 완전 정복",
        "level": "advanced",
        "category": "trading-tactics",
        "premium": True,
        "lessons": [
            {"id": 1, "title": "스캘핑 — 1분봉 단타 매매의 구조와 현실", "premium": True},
            {"id": 2, "title": "스윙매매 — 2일~2주 포지션 유지 전략", "premium": True},
            {"id": 3, "title": "진입 타이밍 — 눌림목·돌파·역추세 3가지 기법", "premium": True},
            {"id": 4, "title": "손절을 잘 하는 방법 — 기계적 손절의 원칙", "premium": True},
            {"id": 5, "title": "손익비(R:R) — 1번 맞고 2번 틀려도 버는 이유", "premium": True},
            {"id": 6, "title": "매매일지 작성법 — 실력이 느는 유일한 방법", "premium": True},
        ],
    },
    {
        "id": "market-slang-forces",
        "title": "시장 은어 & 세력 분석",
        "description": "매집·주포·개미털기 — 차트 뒤에 숨은 세력의 언어를 읽다",
        "level": "advanced",
        "category": "market-dynamics",
        "premium": True,
        "lessons": [
            {"id": 1, "title": "주식 은어 완전 정복 — 매집·주포·작전주·불타기·손절", "premium": True},
            {"id": 2, "title": "기관 투자자의 매매 패턴 — 어떻게 움직이나", "premium": True},
            {"id": 3, "title": "외국인 순매수/순매도 — 어떻게 해석할까", "premium": True},
            {"id": 4, "title": "수급 분석 — 투자자별 매매동향으로 방향 읽기", "premium": True},
            {"id": 5, "title": "차트에 숨겨진 세력의 흔적 — 매집봉·거래량 급증", "premium": True},
            {"id": 6, "title": "작전주 피하는 법 — 함정에 빠지지 않는 10가지 신호", "premium": True},
        ],
    },
    {
        "id": "financial-statements",
        "title": "재무제표 완전 정복",
        "description": "숫자 뒤에 숨겨진 기업의 진실 — 손익계산서부터 현금흐름까지",
        "level": "intermediate",
        "category": "fundamental",
        "premium": True,
        "lessons": [
            {"id": 1, "title": "손익계산서 읽기 — 매출·영업이익·순이익 차이", "premium": True},
            {"id": 2, "title": "재무상태표(대차대조표) — 자산·부채·자본 구조", "premium": True},
            {"id": 3, "title": "현금흐름표 — 돈이 실제로 도는 경로", "premium": True},
            {"id": 4, "title": "좋은 재무제표 vs 나쁜 재무제표 — 비교 분석", "premium": True},
            {"id": 5, "title": "분식회계 의심 신호 — 투자자가 반드시 알아야 할 경고", "premium": True},
            {"id": 6, "title": "PER·PBR·ROE·부채비율 — 핵심 재무비율 한 번에 정리", "premium": True},
        ],
    },
    # ── 시장 맥락 읽기 ───────────────────────────────────────────
    {
        "id": "news-market",
        "title": "뉴스와 시장의 관계",
        "description": "경제 지표·실적·지정학 — 뉴스가 주가를 움직이는 원리",
        "level": "intermediate",
        "category": "macro-events",
        "premium": True,
        "lessons": [
            {"id": 1, "title": "경제 지표 캘린더 — 발표 전후 시장이 움직이는 이유", "premium": True},
            {"id": 2, "title": "미국 CPI·PPI·고용지표와 주식/채권 반응", "premium": True},
            {"id": 3, "title": "어닝 시즌 — 실적 발표 전략과 서프라이즈 읽기", "premium": True},
            {"id": 4, "title": "지정학적 리스크 — 전쟁·제재가 시장에 미치는 영향", "premium": True},
            {"id": 5, "title": "루머와 팩트 — '소문에 사고 뉴스에 팔아라'의 진짜 의미", "premium": True},
            {"id": 6, "title": "시장 선반영 vs 후반영 — 타이밍을 읽는 법", "premium": True},
        ],
    },
    {
        "id": "integrated-analysis",
        "title": "유기적 시장 분석 — 종합편",
        "description": "모든 변수를 연결하라 — 거시부터 종목까지 하나의 프레임으로",
        "level": "advanced",
        "category": "synthesis",
        "premium": True,
        "lessons": [
            {"id": 1, "title": "탑다운 분석 — 거시경제 → 섹터 → 종목 흐름 잡기", "premium": True},
            {"id": 2, "title": "섹터 로테이션 — 경기 사이클마다 강한 업종이 다르다", "premium": True},
            {"id": 3, "title": "달러 인덱스 → 신흥국 → 한국 시장 연결 고리", "premium": True},
            {"id": 4, "title": "VIX·공포탐욕지수로 시장 심리 읽기", "premium": True},
            {"id": 5, "title": "변수 조합 실전 — 금리·환율·수급·차트를 한눈에", "premium": True},
            {"id": 6, "title": "나만의 투자 원칙 만들기 — 흔들리지 않는 기준", "premium": True},
        ],
    },
]


def _is_premium_lesson(course_title: str, lesson_title: str) -> bool:
    """해당 레슨이 프리미엄인지 확인"""
    for course in COURSES:
        if course["title"] == course_title:
            for lesson in course["lessons"]:
                if lesson["title"] == lesson_title:
                    return lesson["premium"]
    return False


async def _require_auth_if_premium(course_title: str, lesson_title: str, authorization: Optional[str]):
    """프리미엄 레슨이면 JWT 검증 수행"""
    if not _is_premium_lesson(course_title, lesson_title):
        return
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="PRO 레슨은 로그인이 필요합니다.")
    token = authorization.split(" ", 1)[1]
    try:
        user_resp = _get_supabase_client().auth.get_user(token)
        if not user_resp.user:
            raise HTTPException(status_code=401, detail="유효하지 않은 인증 토큰입니다.")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="인증 확인 중 오류가 발생했습니다.")


class QuizRequest(BaseModel):
    lesson_title: str
    course_title: str


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    lesson_title: str
    course_title: str
    lesson_content: str
    messages: list[ChatMessage]


@router.get("/list")
def get_courses():
    return {"courses": COURSES}


@router.get("/{course_id}")
def get_course(course_id: str):
    course = next((c for c in COURSES if c["id"] == course_id), None)
    if not course:
        return {"error": "코스를 찾을 수 없습니다"}
    return course


LESSON_PROMPT = """금융 교육 콘텐츠를 만들어줘.

코스: {course_title}
레슨: {lesson_title}

다음 형식으로 작성해줘:
## 핵심 개념
(2~3문장으로 쉽게 설명)

## 이렇게 이해하면 쉬워요
(실생활 비유나 스토리텔링으로 설명)

## 실전에서는 이렇게 씁니다
(구체적인 투자 활용 예시)

## 주의할 점
(흔한 실수나 오해)

말투는 친근하고, 처음 배우는 사람도 이해할 수 있게 써줘."""

LESSON_PROMPT_DANGER = """금융 교육 콘텐츠를 만들어줘. 이 레슨은 고위험 상품에 관한 내용이야.

코스: {course_title}
레슨: {lesson_title}

다음 형식으로 작성해줘:
## 핵심 개념
(2~3문장으로 쉽게 설명)

## 왜 매력적으로 느껴지는가
(도파민, 빠른 수익 기대 심리를 솔직하게 설명)

## 실제로는 이런 일이 벌어집니다
(구체적인 손실 시나리오, 실패 사례)

## ⚠️ 반드시 알아야 할 위험
(원금 손실, 강제 청산, 심리적 함정을 명확하고 강하게 경고)

## 그래도 쓴다면 — 최소한의 원칙
(불가피하게 접근할 때의 안전장치)

말투는 친근하되, 위험에 대해서는 단호하고 명확하게 써줘.
투자 권유가 아닌 교육 목적임을 명시해줘."""

DANGER_COURSES = {"레버리지의 유혹과 위험", "선물시장의 이해"}


@router.post("/lesson/content")
async def get_lesson_content(req: QuizRequest, authorization: Optional[str] = Header(default=None)):
    await _require_auth_if_premium(req.course_title, req.lesson_title, authorization)
    cache_key = f"{req.course_title}::{req.lesson_title}"

    # 캐시 히트: 전체 텍스트를 한 번에 스트리밍
    if cache_key in _lesson_cache:
        async def cached_stream():
            yield f"data: {json.dumps({'text': _lesson_cache[cache_key]})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        return StreamingResponse(cached_stream(), media_type="text/event-stream",
                                 headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"})

    # 신규: 스트리밍으로 토큰 하나씩 전송
    prompt_template = LESSON_PROMPT_DANGER if req.course_title in DANGER_COURSES else LESSON_PROMPT

    async def stream():
        full_text = ""
        with client.messages.stream(
            model="claude-haiku-4-5-20251001",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt_template.format(
                course_title=req.course_title, lesson_title=req.lesson_title
            )}],
        ) as stream_ctx:
            for text in stream_ctx.text_stream:
                full_text += text
                yield f"data: {json.dumps({'text': text})}\n\n"
        _lesson_cache[cache_key] = full_text
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"})


@router.post("/quiz/generate")
async def generate_quiz(req: QuizRequest):
    cache_key = f"{req.course_title}::{req.lesson_title}"
    if cache_key in _quiz_cache:
        return _quiz_cache[cache_key]

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""'{req.lesson_title}' 주제로 4지선다 퀴즈 3문제를 만들어줘.

JSON 형식으로만 답해줘:
{{
  "questions": [
    {{
      "question": "문제",
      "options": ["보기1", "보기2", "보기3", "보기4"],
      "answer": 0,
      "explanation": "정답 해설"
    }}
  ]
}}

answer는 0~3 인덱스. 난이도는 중간 수준으로.""",
            }
        ],
    )

    import json
    import re
    text = message.content[0].text
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        quiz_data = json.loads(json_match.group())
    else:
        quiz_data = {"questions": []}

    _quiz_cache[cache_key] = quiz_data
    return quiz_data


@router.post("/lesson/chat")
async def lesson_chat(req: ChatRequest):
    """레슨 내용 기반 챗봇 - 스트리밍"""
    system_prompt = f"""너는 친절한 금융 교육 튜터야.
지금 학생이 '{req.course_title}' 코스의 '{req.lesson_title}' 레슨을 공부하고 있어.

[레슨 내용]
{req.lesson_content[:3000]}

이 레슨 내용을 바탕으로 학생의 질문에 답해줘.
- 와이프에게 설명하듯 쉽고 친근한 말투
- 레슨과 관련 없는 질문은 "이 레슨 내용과 관련된 질문을 해주세요 😊"라고 답해
- 답변은 3~5문장으로 간결하게
- 투자 권유는 절대 하지 말 것"""

    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    async def chat_stream():
        with client.messages.stream(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=system_prompt,
            messages=messages,
        ) as stream_ctx:
            for text in stream_ctx.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(chat_stream(), media_type="text/event-stream",
                             headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"})


@router.post("/lesson/diagram")
async def get_lesson_diagram(req: QuizRequest):
    """레슨 개념 SVG 다이어그램 - 최초 1회 생성 후 캐시"""
    cache_key = f"diagram::{req.course_title}::{req.lesson_title}"
    if cache_key in _diagram_cache:
        return {"svg": _diagram_cache[cache_key], "cached": True}

    prompt = f"""'{req.lesson_title}' 금융 개념을 설명하는 SVG 다이어그램을 만들어줘.

조건:
- viewBox="0 0 600 200" 고정
- 배경: #0f172a (다크)
- 텍스트 색: white / 연한 회색
- 강조색: #3b82f6(파랑), #10b981(초록), #f59e0b(노랑), #ef4444(빨강)
- 개념 흐름을 박스+화살표로 표현 (3~5단계)
- 한글 텍스트 사용
- font-family="'Malgun Gothic', sans-serif"
- SVG 코드만 반환, 다른 설명 없이"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text
    svg_match = re.search(r'<svg[\s\S]*?</svg>', text, re.IGNORECASE)
    svg = svg_match.group() if svg_match else ""

    if svg:
        _diagram_cache[cache_key] = svg
    return {"svg": svg, "cached": False}


@router.get("/daily-quiz")
async def get_daily_quiz():
    """오늘의 퀴즈 — 날짜 기반 1일 1문제, 캐시"""
    today = str(_date.today())
    if today in _daily_quiz_cache:
        return _daily_quiz_cache[today]

    day_of_year = _date.today().timetuple().tm_yday
    topic = DAILY_QUIZ_TOPICS[day_of_year % len(DAILY_QUIZ_TOPICS)]

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        messages=[{
            "role": "user",
            "content": f"""'{topic}' 주제로 4지선다 퀴즈 1문제를 만들어줘.
초보 투자자도 풀 수 있는 수준으로.

JSON 형식으로만 답해줘:
{{
  "topic": "{topic}",
  "question": "문제 내용",
  "options": ["보기1", "보기2", "보기3", "보기4"],
  "answer": 0,
  "explanation": "정답 해설 2~3문장"
}}

answer는 0~3 인덱스."""
        }],
    )

    text = message.content[0].text
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        quiz_data = json.loads(json_match.group())
    else:
        quiz_data = {"topic": topic, "question": "", "options": [], "answer": 0, "explanation": ""}

    _daily_quiz_cache[today] = quiz_data
    return quiz_data
