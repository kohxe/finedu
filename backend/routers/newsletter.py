from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
import anthropic
import httpx
import os
import json
from datetime import date as _date
from supabase import create_client

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

_supabase = None

def _get_supabase():
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_KEY", "")
        if url and key:
            _supabase = create_client(url, key)
    return _supabase

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("NEWSLETTER_FROM_EMAIL", "newsletter@finedu.kr")

# 오늘의 뉴스레터 콘텐츠 캐시
_newsletter_cache: dict[str, str] = {}


class SubscribeRequest(BaseModel):
    email: str


@router.post("/subscribe")
async def subscribe(req: SubscribeRequest):
    """뉴스레터 구독 신청"""
    try:
        _get_supabase().table("newsletter_subscribers").upsert(
            {"email": req.email, "active": True},
            on_conflict="email"
        ).execute()
        return {"success": True, "message": "구독 신청이 완료되었습니다!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="구독 처리 중 오류가 발생했습니다.")


@router.post("/unsubscribe")
async def unsubscribe(req: SubscribeRequest):
    """뉴스레터 수신 거부"""
    _get_supabase().table("newsletter_subscribers").update(
        {"active": False}
    ).eq("email", req.email).execute()
    return {"success": True}


async def _generate_daily_content() -> str:
    """오늘의 뉴스레터 콘텐츠 생성 (AI)"""
    today = str(_date.today())
    if today in _newsletter_cache:
        return _newsletter_cache[today]

    today_str = _date.today().strftime("%Y년 %m월 %d일")

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1200,
        messages=[{
            "role": "user",
            "content": f"""{today_str} 금융 교육 뉴스레터 콘텐츠를 만들어줘.

다음 형식으로 작성해줘 (HTML 이메일 형식):

## 오늘의 금융 한 줄 📌
(핵심 금융 개념 1개, 쉽게 설명)

## 오늘 알아두면 좋은 것 💡
(투자에 실용적인 팁 1~2개)

## 오늘의 시장 키워드 📊
(요즘 시장에서 자주 언급되는 키워드 3개와 간단 설명)

## FinEdu 오늘의 추천 레슨 📚
(플랫폼의 어떤 레슨을 공부하면 좋은지 추천)

말투는 친근하고 유익하게. 투자 권유 없이 교육 목적으로만."""
        }],
    )

    content = message.content[0].text
    _newsletter_cache[today] = content
    return content


@router.get("/daily-content")
async def get_daily_content():
    """오늘의 뉴스레터 콘텐츠 미리보기"""
    content = await _generate_daily_content()
    return {"content": content, "date": str(_date.today())}


@router.post("/send-daily")
async def send_daily_newsletter(background_tasks: BackgroundTasks, admin_key: str = ""):
    """일일 뉴스레터 발송 (cron job 또는 관리자 수동 트리거)"""
    if admin_key != os.getenv("ADMIN_KEY", ""):
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="RESEND_API_KEY가 설정되지 않았습니다.")

    background_tasks.add_task(_send_newsletter_background)
    return {"success": True, "message": "뉴스레터 발송을 시작했습니다."}


async def _send_newsletter_background():
    """백그라운드: 모든 활성 구독자에게 이메일 발송"""
    content = await _generate_daily_content()
    today_str = _date.today().strftime("%Y년 %m월 %d일")

    # HTML 이메일 템플릿
    html_content = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="background:#0a0e1a;color:#e2e8f0;font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#60a5fa;margin:0;">📈 FinEdu</h1>
    <p style="color:#64748b;font-size:14px;margin:4px 0 0;">{today_str} 금융 교육 뉴스레터</p>
  </div>
  <div style="background:#111827;border:1px solid #1e293b;border-radius:12px;padding:24px;">
    <div style="white-space:pre-wrap;line-height:1.8;font-size:15px;">{content}</div>
  </div>
  <div style="text-align:center;margin-top:20px;">
    <a href="https://finedu.kr/courses" style="background:#2563eb;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;">오늘 레슨 바로 보기 →</a>
  </div>
  <p style="text-align:center;color:#475569;font-size:12px;margin-top:16px;">
    수신거부: <a href="https://finedu.kr/unsubscribe" style="color:#475569;">여기 클릭</a>
  </p>
</body>
</html>"""

    # 활성 구독자 목록
    result = _get_supabase().table("newsletter_subscribers").select("email").eq("active", True).execute()
    subscribers = result.data or []

    # Resend API로 발송
    async with httpx.AsyncClient() as http:
        for sub in subscribers:
            try:
                await http.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
                    json={
                        "from": FROM_EMAIL,
                        "to": sub["email"],
                        "subject": f"[FinEdu] {today_str} 오늘의 금융 레슨",
                        "html": html_content,
                    },
                    timeout=10,
                )
            except Exception:
                continue
