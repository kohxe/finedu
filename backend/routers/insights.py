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
    {"title": "금리와 주식의 관계",       "subtitle": "금리가 오르면 왜 주식이 내릴까?",               "emoji": "📉", "tag": "금리"},
    {"title": "PER이란?",                 "subtitle": "PER로 주식이 싼지 비싼지 판단하는 법",           "emoji": "📊", "tag": "주식"},
    {"title": "인플레이션과 투자",         "subtitle": "물가가 오를 때 어떤 자산이 유리할까?",           "emoji": "🔥", "tag": "경제"},
    {"title": "환율과 수출주",             "subtitle": "달러가 강해지면 삼성전자는?",                    "emoji": "💱", "tag": "환율"},
    {"title": "분산투자의 원리",           "subtitle": "달걀을 한 바구니에 담지 마라",                   "emoji": "🧺", "tag": "투자전략"},
    {"title": "복리의 마법",              "subtitle": "72의 법칙으로 내 돈이 두 배 되는 시간 계산하기",  "emoji": "✨", "tag": "투자전략"},
    {"title": "ETF란 무엇인가?",          "subtitle": "주식처럼 사고팔 수 있는 펀드",                   "emoji": "🧩", "tag": "펀드"},
    {"title": "FOMC가 뭐길래 시장이 흔들릴까?", "subtitle": "미국 연준의 금리 결정이 전 세계에 미치는 영향", "emoji": "🏛", "tag": "경제"},
    {"title": "공매도란?",                "subtitle": "없는 주식을 팔다니, 어떻게 가능할까?",            "emoji": "🔻", "tag": "주식"},
    {"title": "배당주 투자",              "subtitle": "매달 월세처럼 받는 배당금",                       "emoji": "💰", "tag": "주식"},
    {"title": "코스피와 코스닥 차이",     "subtitle": "한국 주식시장 두 곳의 차이",                      "emoji": "📋", "tag": "주식"},
    {"title": "달러 자산을 가져야 하는 이유", "subtitle": "원화 말고 달러로 자산 분산하기",              "emoji": "💵", "tag": "환율"},
]


def _insight_prompt(title: str, subtitle: str) -> str:
    return f"""금융 인사이트 카드를 만들어줘. 주제: "{title}"

형식 (JSON으로만 답해줘):
{{
  "title": "{title}",
  "subtitle": "{subtitle}",
  "oneliner": "핵심을 한 문장으로 (20자 이내)",
  "body": "와이프에게 설명하듯 쉽고 친근하게 3~4문장. 실생활 비유 포함.",
  "takeaway": "오늘 바로 써먹을 수 있는 팁 1가지"
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
