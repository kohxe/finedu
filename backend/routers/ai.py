from fastapi import APIRouter
from pydantic import BaseModel
import anthropic
import os

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


class ChartExplainRequest(BaseModel):
    symbol: str
    name: str
    market: str
    period: str = "1개월"


class NewsAnalyzeRequest(BaseModel):
    headline: str
    content: str = ""


@router.post("/chart-explain")
async def explain_chart_movement(req: ChartExplainRequest):
    market_text = "한국 코스피/코스닥" if req.market == "KR" else "미국 나스닥/NYSE"

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""{market_text} 상장 종목 '{req.name}({req.symbol})'의 최근 {req.period} 주가 흐름에 대해 설명해줘.

다음을 포함해서 설명해줘:
1. 해당 종목이 속한 섹터/산업
2. 최근 주가에 영향을 줄 수 있는 거시경제 요인 (금리, 환율, 유가 등)
3. 해당 기업/산업에 영향을 주는 최근 이슈
4. 투자자가 주목해야 할 포인트

주의: 실제 주가 데이터 없이 일반적인 맥락으로 설명해줘. 투자 권유가 아닌 교육 목적임을 명시해줘.
말투는 친근하고 쉽게.""",
            }
        ],
    )

    return {
        "symbol": req.symbol,
        "name": req.name,
        "explanation": message.content[0].text,
    }


@router.post("/news-analyze")
async def analyze_news(req: NewsAnalyzeRequest):
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""다음 경제/금융 뉴스를 중립적인 시각으로 분석해줘.

헤드라인: {req.headline}
{f"내용: {req.content}" if req.content else ""}

다음 형식으로 분석해줘:
## 핵심 요약
(2~3문장)

## 시장에 미치는 영향
- 긍정적 측면:
- 부정적 측면:
- 영향받는 섹터:

## 투자자가 주목할 포인트

## 중립적 시각
(편향 없이 다양한 관점 제시)

교육 목적의 분석이며 투자 권유가 아님을 명시해줘.""",
            }
        ],
    )

    return {
        "headline": req.headline,
        "analysis": message.content[0].text,
    }


@router.post("/economy-issue")
async def explain_economy_issue(topic: str):
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1500,
        messages=[
            {
                "role": "user",
                "content": f"""경제 이슈 '{topic}'에 대해 설명해줘.

다음 형식으로:
## 무슨 일이 있었나
## 왜 중요한가
## 경제/시장에 미치는 영향
## 관련 투자 섹터
## 역사적 유사 사례 (있다면)

중립적이고 교육적으로, 초보자도 이해할 수 있게.""",
            }
        ],
    )

    return {"topic": topic, "explanation": message.content[0].text}
