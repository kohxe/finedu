from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="FinEdu API", version="1.0.0")

_origins_env = os.getenv("FRONTEND_URL", "http://localhost:7777")
_allow_origins = [o.strip() for o in _origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import terms, courses, charts, ai, insights, newsletter

app.include_router(terms.router, prefix="/api/terms", tags=["용어사전"])
app.include_router(courses.router, prefix="/api/courses", tags=["트레이닝코스"])
app.include_router(charts.router, prefix="/api/charts", tags=["차트"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI해설"])
app.include_router(insights.router, prefix="/api/insights", tags=["인사이트"])
app.include_router(newsletter.router, prefix="/api/newsletter", tags=["뉴스레터"])


@app.get("/")
def root():
    return {"status": "ok", "message": "FinEdu API 실행 중"}
