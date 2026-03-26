from fastapi import APIRouter
from pydantic import BaseModel
import anthropic
import os
import random
from datetime import date
from cache import cache_get, cache_set

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

_daily_cache: dict[str, dict] = {}
_topic_cache: dict[str, dict] = {}

INSIGHT_TOPICS = [
    {"title": "금리와 주식의 관계",           "subtitle": "금리가 오르면 왜 주식이 내릴까?",                      "emoji": "📉", "tag": "금리"},
    {"title": "PER이란?",                     "subtitle": "PER로 주식이 싼지 비싼지 판단하는 법",                  "emoji": "📊", "tag": "주식"},
    {"title": "인플레이션과 투자",             "subtitle": "물가가 오를 때 어떤 자산이 유리할까?",                  "emoji": "🔥", "tag": "경제"},
    {"title": "환율과 수출주",                "subtitle": "달러가 강해지면 삼성전자는?",                           "emoji": "💱", "tag": "환율"},
    {"title": "분산투자의 원리",               "subtitle": "달걀을 한 바구니에 담지 마라",                          "emoji": "🧺", "tag": "투자전략"},
    {"title": "복리의 마법",                  "subtitle": "72의 법칙으로 내 돈이 두 배 되는 시간 계산하기",         "emoji": "✨", "tag": "투자전략"},
    {"title": "ETF란 무엇인가?",              "subtitle": "주식처럼 사고팔 수 있는 펀드",                          "emoji": "🧩", "tag": "펀드"},
    {"title": "FOMC가 뭐길래 시장이 흔들릴까?", "subtitle": "미국 연준의 금리 결정이 전 세계에 미치는 영향",       "emoji": "🏛", "tag": "경제"},
    {"title": "공매도란?",                    "subtitle": "없는 주식을 팔다니, 어떻게 가능할까?",                   "emoji": "🔻", "tag": "주식"},
    {"title": "배당주 투자",                  "subtitle": "매달 월세처럼 받는 배당금",                              "emoji": "💰", "tag": "주식"},
    {"title": "코스피와 코스닥 차이",         "subtitle": "한국 주식시장 두 곳의 차이",                             "emoji": "📋", "tag": "주식"},
    {"title": "달러 자산을 가져야 하는 이유", "subtitle": "원화 말고 달러로 자산 분산하기",                         "emoji": "💵", "tag": "환율"},
    {"title": "건강한 포트폴리오란?",         "subtitle": "주식·채권·현금 비율, 나에게 맞는 배분은?",               "emoji": "⚖️", "tag": "투자전략"},
    {"title": "손절을 못 하는 심리",          "subtitle": "왜 우리는 손해 보는 주식을 못 팔까?",                    "emoji": "🧠", "tag": "투자전략"},
    {"title": "워렌 버핏의 핵심 원칙",        "subtitle": "80년 투자 인생에서 나온 불변의 법칙들",                  "emoji": "🏆", "tag": "투자전략"},
    {"title": "ISA계좌 완벽 활용법",          "subtitle": "세금 혜택 최대로 챙기는 방법",                          "emoji": "🏦", "tag": "주식"},
    {"title": "재무제표 5분 만에 읽기",       "subtitle": "숫자 몰라도 좋은 기업 찾는 법",                         "emoji": "📑", "tag": "주식"},
    {"title": "인덱스 투자 vs 종목 투자",     "subtitle": "개미가 시장을 이기기 어려운 진짜 이유",                  "emoji": "🎯", "tag": "투자전략"},
    {"title": "부동산 vs 주식",               "subtitle": "어디에 투자하는 게 더 나을까?",                         "emoji": "🏠", "tag": "투자전략"},
    {"title": "경기 사이클과 섹터 로테이션",  "subtitle": "경기에 따라 강한 업종이 바뀐다",                        "emoji": "🔄", "tag": "경제"},
    {"title": "리밸런싱이란?",                "subtitle": "포트폴리오를 주기적으로 다듬어야 하는 이유",             "emoji": "🔧", "tag": "투자전략"},
    {"title": "손익비(R:R)의 중요성",         "subtitle": "1번 맞고 2번 틀려도 돈을 버는 방법",                    "emoji": "📐", "tag": "투자전략"},
    {"title": "개미가 항상 지는 이유",        "subtitle": "구조적 불리함과 심리적 함정",                           "emoji": "🐜", "tag": "투자전략"},
    {"title": "금(Gold)에 투자해야 하는가?",  "subtitle": "위기에 강한 안전자산의 진실",                           "emoji": "🥇", "tag": "경제"},
]


def _insight_prompt(title: str, subtitle: str) -> str:
    return f"""금융 인사이트 카드를 만들어줘. 주제: "{title}"
읽고 나서 "아 이거 진짜 몰랐다", "당장 써먹어야겠다" 싶은 느낌으로.

형식 (JSON으로만 답해줘, 마크다운 없이 순수 JSON):
{{
  "title": "{title}",
  "subtitle": "{subtitle}",
  "oneliner": "핵심을 한 문장으로 임팩트 있게 (25자 이내)",
  "body": "친한 선배가 카페에서 알려주듯 쉽고 솔직하게 4~6문장. 실생활 비유와 구체적인 숫자 예시 반드시 포함. 왜 이게 중요한지 느껴지도록.",
  "hidden_truth": "대부분의 사람들이 모르는 반전 사실이나 함정 1가지. 짧고 임팩트 있게.",
  "takeaway": "오늘 당장 실천할 수 있는 구체적인 행동 1가지 (앱 켜기, 검색하기 수준으로 쉬운 것)"
}}"""


@router.get("/list")
def get_insight_list():
    return {"topics": INSIGHT_TOPICS}


@router.get("/daily")
async def get_daily_insight():
    today = str(date.today())
    if today in _daily_cache:
        return _daily_cache[today]

    db_key = f"insight:daily:{today}"
    db_cached = cache_get(db_key)
    if db_cached:
        _daily_cache[today] = db_cached
        return db_cached

    topic = random.choice(INSIGHT_TOPICS)

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        messages=[{"role": "user", "content": _insight_prompt(topic["title"], topic["subtitle"])}],
    )

    import json, re
    text = message.content[0].text
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        result = {**json.loads(match.group()), "emoji": topic["emoji"], "tag": topic["tag"]}
    else:
        result = {"title": topic["title"], "subtitle": topic["subtitle"], "emoji": topic["emoji"],
                  "oneliner": "오늘의 금융 인사이트", "body": text, "takeaway": "", "tag": topic["tag"]}

    _daily_cache[today] = result
    cache_set(db_key, result)
    return result


class TopicRequest(BaseModel):
    title: str
    subtitle: str
    emoji: str
    tag: str


@router.post("/topic")
async def get_topic_insight(req: TopicRequest):
    if req.title in _topic_cache:
        return _topic_cache[req.title]

    db_key = f"insight:topic:{req.title}"
    db_cached = cache_get(db_key)
    if db_cached:
        _topic_cache[req.title] = db_cached
        return db_cached

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        messages=[{"role": "user", "content": _insight_prompt(req.title, req.subtitle)}],
    )

    import json, re
    text = message.content[0].text
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        result = {**json.loads(match.group()), "emoji": req.emoji, "tag": req.tag}
    else:
        result = {"title": req.title, "subtitle": req.subtitle, "emoji": req.emoji,
                  "oneliner": "", "body": text, "takeaway": "", "tag": req.tag}

    _topic_cache[req.title] = result
    cache_set(db_key, result)
    return result
