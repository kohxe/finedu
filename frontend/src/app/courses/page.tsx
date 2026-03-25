"use client";

import { useState, useRef, useEffect } from "react";
import { Brain, Lock, ChevronRight, CheckCircle, BookOpen, Loader2, X, Send, MessageCircle, Zap, Crown } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const DAILY_CHAT_LIMIT = 5;

const COURSES = [
  {
    id: "intro-stock",
    title: "주식 기초 입문",
    description: "주식이 뭔지부터 첫 매수까지",
    level: "beginner",
    levelLabel: "입문",
    levelColor: "text-green-400 bg-green-400/10",
    lessons: [
      { id: 1, title: "주식이란 무엇인가?", premium: false },
      { id: 2, title: "증권 계좌 만들기", premium: false },
      { id: 3, title: "코스피 vs 코스닥", premium: false },
      { id: 4, title: "첫 주식 매수하기", premium: false },
      { id: 5, title: "PER, PBR로 기업 가치 보는 법", premium: true },
      { id: 6, title: "재무제표 읽는 법", premium: true },
    ],
  },
  {
    id: "chart-reading",
    title: "차트 읽기 기초",
    description: "캔들차트부터 이동평균선까지",
    level: "beginner",
    levelLabel: "입문",
    levelColor: "text-green-400 bg-green-400/10",
    lessons: [
      { id: 1, title: "캔들차트 이해하기", premium: false },
      { id: 2, title: "거래량이 말해주는 것", premium: false },
      { id: 3, title: "이동평균선(MA) 활용법", premium: false },
      { id: 4, title: "지지선과 저항선", premium: true },
      { id: 5, title: "RSI로 과매수/과매도 판단", premium: true },
      { id: 6, title: "MACD 활용 전략", premium: true },
    ],
  },
  {
    id: "macro-economy",
    title: "거시경제와 주식시장",
    description: "금리, 환율, 인플레이션이 주가에 미치는 영향",
    level: "intermediate",
    levelLabel: "중급",
    levelColor: "text-blue-400 bg-blue-400/10",
    lessons: [
      { id: 1, title: "기준금리란?", premium: false },
      { id: 2, title: "금리 인상/인하와 주식시장", premium: false },
      { id: 3, title: "인플레이션과 투자 전략", premium: true },
      { id: 4, title: "환율이 수출주에 미치는 영향", premium: true },
      { id: 5, title: "FOMC 결과 해석하기", premium: true },
    ],
  },
  {
    id: "us-stock",
    title: "미국 주식 투자",
    description: "나스닥, S&P500, 미국 ETF 투자 방법",
    level: "intermediate",
    levelLabel: "중급",
    levelColor: "text-blue-400 bg-blue-400/10",
    lessons: [
      { id: 1, title: "미국 주식 시장 구조", premium: false },
      { id: 2, title: "S&P500 vs 나스닥 vs 다우", premium: false },
      { id: 3, title: "미국 ETF 투자 방법", premium: false },
      { id: 4, title: "환헤지 여부 결정하기", premium: true },
      { id: 5, title: "미국 실적 시즌 활용법", premium: true },
    ],
  },
  // ── 중급 PRO
  {
    id: "hedging-portfolio",
    title: "헷징과 포트폴리오 전략",
    description: "리스크를 줄이면서 수익을 지키는 분산 전략",
    level: "intermediate-pro",
    levelLabel: "중급 PRO",
    levelColor: "text-purple-400 bg-purple-400/10",
    lessons: [
      { id: 1, title: "포트폴리오란 무엇인가?", premium: true },
      { id: 2, title: "상관관계와 분산투자의 원리", premium: true },
      { id: 3, title: "주식 + 채권 비율 설계하기", premium: true },
      { id: 4, title: "헷징이란? 하락장에서 자산 지키기", premium: true },
      { id: 5, title: "인버스 ETF와 풋옵션 활용법", premium: true },
      { id: 6, title: "리밸런싱 전략 — 언제 어떻게 조정할까", premium: true },
    ],
  },
  {
    id: "sound-finance",
    title: "건전한 자산 설계",
    description: "월급쟁이도 할 수 있는 장기 자산 형성 로드맵",
    level: "intermediate-pro",
    levelLabel: "중급 PRO",
    levelColor: "text-purple-400 bg-purple-400/10",
    lessons: [
      { id: 1, title: "비상금 → 투자금 단계별 자산 배분", premium: true },
      { id: 2, title: "연금저축 vs IRP vs ISA 비교", premium: true },
      { id: 3, title: "세금 아끼는 절세 계좌 활용법", premium: true },
      { id: 4, title: "복리로 1억 만드는 시뮬레이션", premium: true },
      { id: 5, title: "인플레이션을 이기는 실물자산 배분", premium: true },
    ],
  },
  // ── 고급 PRO
  {
    id: "warren-buffett",
    title: "워렌 버핏의 가치투자",
    description: "오마하의 현인이 80년간 증명한 투자 원칙",
    level: "advanced",
    levelLabel: "고급 PRO",
    levelColor: "text-yellow-400 bg-yellow-400/10",
    lessons: [
      { id: 1, title: "버핏이 말하는 '좋은 기업'의 조건", premium: true },
      { id: 2, title: "경제적 해자(Moat)란 무엇인가?", premium: true },
      { id: 3, title: "내재가치 계산법 — DCF 쉽게 이해하기", premium: true },
      { id: 4, title: "안전마진 — 얼마나 쌀 때 살까?", premium: true },
      { id: 5, title: "버핏이 절대 하지 않는 것들", premium: true },
      { id: 6, title: "버크셔 해서웨이 포트폴리오 분석", premium: true },
    ],
  },
  {
    id: "peter-lynch",
    title: "피터 린치의 성장주 투자",
    description: "내가 아는 것에 투자하라 — 10루타 주식 찾는 법",
    level: "advanced",
    levelLabel: "고급 PRO",
    levelColor: "text-yellow-400 bg-yellow-400/10",
    lessons: [
      { id: 1, title: "10루타(Tenbagger)란? 린치의 투자 철학", premium: true },
      { id: 2, title: "6가지 주식 유형으로 종목 분류하기", premium: true },
      { id: 3, title: "PEG 지표 — 성장주의 적정 가격 판단", premium: true },
      { id: 4, title: "내 주변에서 다음 대박 종목 찾는 법", premium: true },
      { id: 5, title: "린치가 피하는 '기관이 좋아하는 주식'", premium: true },
      { id: 6, title: "마젤란 펀드 13년 29배 수익의 비밀", premium: true },
    ],
  },
  // ── 고급 PRO — 위험 상품
  {
    id: "leverage-danger",
    title: "레버리지의 유혹과 위험",
    description: "⚠️ 2배 수익의 꿈, 하지만 현실은 — 레버리지 완전 해부",
    level: "advanced-warning",
    levelLabel: "고급 PRO ⚠️",
    levelColor: "text-red-400 bg-red-400/10",
    lessons: [
      { id: 1, title: "레버리지란? 빌린 돈으로 투자하는 원리", premium: true },
      { id: 2, title: "왜 레버리지는 도파민을 자극하는가", premium: true },
      { id: 3, title: "반대매매와 마진콜 — 강제 청산의 공포", premium: true },
      { id: 4, title: "레버리지 ETF의 함정 — 장기보유하면 왜 손해날까", premium: true },
      { id: 5, title: "실제 레버리지 투자 실패 사례 분석", premium: true },
      { id: 6, title: "레버리지를 써도 되는 상황과 절대 안 되는 상황", premium: true },
    ],
  },
  {
    id: "futures-market",
    title: "선물시장의 이해",
    description: "⚠️ 전문가들의 게임 — 선물/옵션 구조와 개인투자자 생존법",
    level: "advanced-warning",
    levelLabel: "고급 PRO ⚠️",
    levelColor: "text-red-400 bg-red-400/10",
    lessons: [
      { id: 1, title: "선물이란? 미래 가격을 오늘 거래하는 구조", premium: true },
      { id: 2, title: "콘탱고와 백워데이션 — 롤오버 비용의 진실", premium: true },
      { id: 3, title: "옵션 기초 — 콜/풋, 프리미엄 개념 이해", premium: true },
      { id: 4, title: "개인이 선물시장에서 지는 이유 — 구조적 불리함", premium: true },
      { id: 5, title: "선물을 헷징 목적으로 쓰는 올바른 방법", premium: true },
      { id: 6, title: "도박이 되지 않으려면 — 투자와 투기의 경계선", premium: true },
    ],
  },
  // ── 실전 트레이딩
  {
    id: "chart-indicators",
    title: "차트 고급 지표 마스터",
    description: "일목균형표부터 피보나치까지 — 프로 트레이더의 지표 활용법",
    level: "intermediate-pro",
    levelLabel: "중급 PRO",
    levelColor: "text-purple-400 bg-purple-400/10",
    lessons: [
      { id: 1, title: "일목균형표 — 구름대·기준선·전환선 읽기", premium: true },
      { id: 2, title: "볼린저밴드 — 변동성으로 방향 잡기", premium: true },
      { id: 3, title: "피보나치 되돌림 — 지지/저항 예측하기", premium: true },
      { id: 4, title: "VWAP와 거래량 프로파일 활용", premium: true },
      { id: 5, title: "다이버전스 — 지표와 가격의 엇갈림 포착", premium: true },
      { id: 6, title: "복합 지표 조합 — 신호 겹치는 구간 공략", premium: true },
    ],
  },
  {
    id: "trading-strategy",
    title: "스윙매매 & 스캘핑 전략",
    description: "단기 트레이딩의 모든 것 — 진입·청산·손절 완전 정복",
    level: "advanced",
    levelLabel: "고급 PRO",
    levelColor: "text-yellow-400 bg-yellow-400/10",
    lessons: [
      { id: 1, title: "스캘핑 — 1분봉 단타 매매의 구조와 현실", premium: true },
      { id: 2, title: "스윙매매 — 2일~2주 포지션 유지 전략", premium: true },
      { id: 3, title: "진입 타이밍 — 눌림목·돌파·역추세 3가지 기법", premium: true },
      { id: 4, title: "손절을 잘 하는 방법 — 기계적 손절의 원칙", premium: true },
      { id: 5, title: "손익비(R:R) — 1번 맞고 2번 틀려도 버는 이유", premium: true },
      { id: 6, title: "매매일지 작성법 — 실력이 느는 유일한 방법", premium: true },
    ],
  },
  {
    id: "market-slang-forces",
    title: "시장 은어 & 세력 분석",
    description: "매집·주포·개미털기 — 차트 뒤에 숨은 세력의 언어를 읽다",
    level: "advanced",
    levelLabel: "고급 PRO",
    levelColor: "text-yellow-400 bg-yellow-400/10",
    lessons: [
      { id: 1, title: "주식 은어 완전 정복 — 매집·주포·작전주·불타기·손절", premium: true },
      { id: 2, title: "기관 투자자의 매매 패턴 — 어떻게 움직이나", premium: true },
      { id: 3, title: "외국인 순매수/순매도 — 어떻게 해석할까", premium: true },
      { id: 4, title: "수급 분석 — 투자자별 매매동향으로 방향 읽기", premium: true },
      { id: 5, title: "차트에 숨겨진 세력의 흔적 — 매집봉·거래량 급증", premium: true },
      { id: 6, title: "작전주 피하는 법 — 함정에 빠지지 않는 10가지 신호", premium: true },
    ],
  },
  {
    id: "financial-statements",
    title: "재무제표 완전 정복",
    description: "숫자 뒤에 숨겨진 기업의 진실 — 손익계산서부터 현금흐름까지",
    level: "intermediate-pro",
    levelLabel: "중급 PRO",
    levelColor: "text-purple-400 bg-purple-400/10",
    lessons: [
      { id: 1, title: "손익계산서 읽기 — 매출·영업이익·순이익 차이", premium: true },
      { id: 2, title: "재무상태표(대차대조표) — 자산·부채·자본 구조", premium: true },
      { id: 3, title: "현금흐름표 — 돈이 실제로 도는 경로", premium: true },
      { id: 4, title: "좋은 재무제표 vs 나쁜 재무제표 — 비교 분석", premium: true },
      { id: 5, title: "분식회계 의심 신호 — 투자자가 반드시 알아야 할 경고", premium: true },
      { id: 6, title: "PER·PBR·ROE·부채비율 — 핵심 재무비율 한 번에 정리", premium: true },
    ],
  },
  // ── 시장 맥락 읽기
  {
    id: "news-market",
    title: "뉴스와 시장의 관계",
    description: "경제 지표·실적·지정학 — 뉴스가 주가를 움직이는 원리",
    level: "intermediate-pro",
    levelLabel: "중급 PRO",
    levelColor: "text-purple-400 bg-purple-400/10",
    lessons: [
      { id: 1, title: "경제 지표 캘린더 — 발표 전후 시장이 움직이는 이유", premium: true },
      { id: 2, title: "미국 CPI·PPI·고용지표와 주식/채권 반응", premium: true },
      { id: 3, title: "어닝 시즌 — 실적 발표 전략과 서프라이즈 읽기", premium: true },
      { id: 4, title: "지정학적 리스크 — 전쟁·제재가 시장에 미치는 영향", premium: true },
      { id: 5, title: "루머와 팩트 — '소문에 사고 뉴스에 팔아라'의 진짜 의미", premium: true },
      { id: 6, title: "시장 선반영 vs 후반영 — 타이밍을 읽는 법", premium: true },
    ],
  },
  {
    id: "integrated-analysis",
    title: "유기적 시장 분석 — 종합편",
    description: "모든 변수를 연결하라 — 거시부터 종목까지 하나의 프레임으로",
    level: "advanced",
    levelLabel: "고급 PRO",
    levelColor: "text-yellow-400 bg-yellow-400/10",
    lessons: [
      { id: 1, title: "탑다운 분석 — 거시경제 → 섹터 → 종목 흐름 잡기", premium: true },
      { id: 2, title: "섹터 로테이션 — 경기 사이클마다 강한 업종이 다르다", premium: true },
      { id: 3, title: "달러 인덱스 → 신흥국 → 한국 시장 연결 고리", premium: true },
      { id: 4, title: "VIX·공포탐욕지수로 시장 심리 읽기", premium: true },
      { id: 5, title: "변수 조합 실전 — 금리·환율·수급·차트를 한눈에", premium: true },
      { id: 6, title: "나만의 투자 원칙 만들기 — 흔들리지 않는 기준", premium: true },
    ],
  },
];

type Lesson = { id: number; title: string; premium: boolean };
type Course = typeof COURSES[0];
type ChatMsg = { role: "user" | "assistant"; content: string };

function CourseCard({
  course,
  onOpen,
  user,
  completions,
}: {
  course: Course;
  onOpen: (c: Course, l: Lesson) => void;
  user: User | null;
  completions: Set<string>;
}) {
  const allPro = course.lessons.every(l => l.premium);
  const isWarning = course.level === "advanced-warning";

  // 완료 가능한 레슨 수 (잠기지 않은)
  const accessibleLessons = course.lessons.filter(l => !l.premium || user);
  const completedCount = accessibleLessons.filter(l => completions.has(`${course.id}::${l.id}`)).length;
  const isCourseComplete = accessibleLessons.length > 0 && completedCount === accessibleLessons.length;

  return (
    <div className={`bg-[#111827] border rounded-2xl overflow-hidden ${
      isCourseComplete ? "border-green-500/40" : isWarning ? "border-red-500/30" : allPro ? "border-yellow-500/20" : "border-slate-800"
    }`}>
      {isWarning && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2">
          <span className="text-red-400 text-xs font-semibold">⚠️ 고위험 상품 — 원금 손실 가능, 반드시 이해 후 접근</span>
        </div>
      )}
      <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${course.levelColor}`}>
              {course.levelLabel}
            </span>
            {isCourseComplete && (
              <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle size={10} />
                수료 완료
              </span>
            )}
            {!isCourseComplete && accessibleLessons.length > 0 && completedCount > 0 && (
              <span className="text-xs text-slate-500">{completedCount}/{accessibleLessons.length}</span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-white mt-2">{course.title}</h2>
          <p className="text-sm text-slate-400">{course.description}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {course.lessons.map((lesson) => {
          const locked = lesson.premium && !user;
          const done = completions.has(`${course.id}::${lesson.id}`);
          return (
            <button
              key={lesson.id}
              onClick={() => onOpen(course, lesson)}
              disabled={locked}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                locked
                  ? "text-slate-600 cursor-not-allowed"
                  : done
                  ? "text-green-400/80 hover:bg-slate-800"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                {locked ? (
                  <Lock size={14} className="text-slate-700" />
                ) : done ? (
                  <CheckCircle size={14} className="text-green-500 shrink-0" />
                ) : (
                  <BookOpen size={14} className={lesson.premium ? "text-yellow-400" : "text-purple-400"} />
                )}
                <span className={done ? "line-through decoration-green-600/50" : ""}>{lesson.title}</span>
              </div>
              {locked
                ? <span className="text-xs bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded shrink-0">PRO</span>
                : lesson.premium && !done
                ? <Crown size={13} className="text-yellow-400/60 shrink-0" />
                : !done
                ? <ChevronRight size={14} className="text-slate-600" />
                : null}
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}

// 일일 채팅 횟수 관리 (localStorage)
function getDailyUsage(): number {
  try {
    const data = JSON.parse(localStorage.getItem("chat_daily") || "{}");
    if (data.date !== new Date().toDateString()) return 0;
    return data.count ?? 0;
  } catch { return 0; }
}
function incrementDailyUsage() {
  try {
    const count = getDailyUsage() + 1;
    localStorage.setItem("chat_daily", JSON.stringify({ date: new Date().toDateString(), count }));
    return count;
  } catch { return 0; }
}

export default function CoursesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  // "courseId::lessonId" 형태의 완료 레슨 Set
  const [completions, setCompletions] = useState<Set<string>>(new Set());

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [content, setContent] = useState("");
  const [quiz, setQuiz] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // 챗봇 상태
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [dailyUsed, setDailyUsed] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 다이어그램 상태
  const [diagram, setDiagram] = useState("");
  const [loadingDiagram, setLoadingDiagram] = useState(false);

  // 인증 상태 초기화
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
      if (data.user) loadCompletions(data.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadCompletions(session.user.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setDailyUsed(getDailyUsage());
  }, [selectedLesson]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // JWT 토큰 가져오기
  async function getAuthHeaders(): Promise<HeadersInit> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return { "Content-Type": "application/json" };
  }

  // Supabase에서 완료 레슨 불러오기
  async function loadCompletions(userId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("lesson_completions")
      .select("course_id, lesson_id")
      .eq("user_id", userId);
    if (data) {
      setCompletions(new Set(data.map((r: { course_id: string; lesson_id: number }) => `${r.course_id}::${r.lesson_id}`)));
    }
  }

  // 레슨 완료 저장
  async function markLessonComplete(courseId: string, lessonId: number) {
    if (!user) return;
    const key = `${courseId}::${lessonId}`;
    if (completions.has(key)) return;
    const supabase = createClient();
    await supabase.from("lesson_completions").upsert(
      { user_id: user.id, course_id: courseId, lesson_id: lessonId },
      { onConflict: "user_id,course_id,lesson_id" }
    );
    setCompletions(prev => new Set([...prev, key]));
  }

  async function openLesson(course: Course, lesson: Lesson) {
    if (lesson.premium && !user) {
      setShowLoginPrompt(true);
      return;
    }
    setSelectedCourse(course);
    setSelectedLesson(lesson);
    setContent("");
    setQuiz(null);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setChatMessages([]);
    setChatInput("");
    setDiagram("");
    setLoadingContent(true);

    const headers = await getAuthHeaders();

    // 다이어그램 병렬 요청
    setLoadingDiagram(true);
    fetch(`${API_URL}/api/courses/lesson/diagram`, {
      method: "POST",
      headers,
      body: JSON.stringify({ lesson_title: lesson.title, course_title: course.title }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.svg) setDiagram(d.svg); })
      .catch(() => {})
      .finally(() => setLoadingDiagram(false));

    try {
      const res = await fetch(`${API_URL}/api/courses/lesson/content`, {
        method: "POST",
        headers,
        body: JSON.stringify({ lesson_title: lesson.title, course_title: course.title }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.text) setContent((prev) => prev + parsed.text);
            if (parsed.done) setLoadingContent(false);
          } catch {}
        }
      }
    } catch {
      setContent("콘텐츠를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoadingContent(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading || !selectedCourse || !selectedLesson) return;
    if (dailyUsed >= DAILY_CHAT_LIMIT) return;

    const userMsg: ChatMsg = { role: "user", content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    const newUsed = incrementDailyUsage();
    setDailyUsed(newUsed);

    // AI 응답 자리 추가
    setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const chatHeaders = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/courses/lesson/chat`, {
        method: "POST",
        headers: chatHeaders,
        body: JSON.stringify({
          lesson_title: selectedLesson.title,
          course_title: selectedCourse.title,
          lesson_content: content,
          messages: newMessages,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.text) {
              setChatMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: updated[updated.length - 1].content + parsed.text,
                };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch {
      setChatMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "오류가 발생했습니다. 다시 시도해주세요." };
        return updated;
      });
    } finally {
      setChatLoading(false);
    }
  }

  async function generateQuiz() {
    if (!selectedCourse || !selectedLesson) return;
    setLoadingQuiz(true);
    try {
      const res = await fetch(`${API_URL}/api/courses/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_title: selectedLesson.title, course_title: selectedCourse.title }),
      });
      const data = await res.json();
      setQuiz(data);
      setQuizAnswers(new Array(data.questions?.length || 0).fill(-1));
      setQuizSubmitted(false);
    } catch {
      console.error("퀴즈 생성 실패");
    } finally {
      setLoadingQuiz(false);
    }
  }

  const remainingChats = DAILY_CHAT_LIMIT - dailyUsed;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <Brain className="text-purple-400" size={32} />
          트레이닝 코스
        </h1>
        <p className="text-slate-400">단계별로 금융 지식을 쌓아보세요. AI가 설명하고, 퀴즈로 확인합니다.</p>
      </div>

      {/* 무료 코스 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <BookOpen size={18} className="text-green-400" />
          무료 코스
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {COURSES.filter(c => !c.lessons.every(l => l.premium)).map((course) => (
            <CourseCard key={course.id} course={course} onOpen={openLesson} user={user} completions={completions} />
          ))}
        </div>
      </div>

      {/* PRO 코스 */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
            <Crown size={18} className="text-yellow-400" />
            PRO 코스
          </h2>
          {user ? (
            <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
              ✓ 잠금 해제됨
            </span>
          ) : (
            <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
              로그인 필요
            </span>
          )}
        </div>
        {!user && !authLoading && (
          <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-300">PRO 코스 14개가 잠겨 있습니다</p>
              <p className="text-xs text-slate-500 mt-0.5">무료 가입 후 모든 코스를 바로 이용하세요</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href="/login" className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 transition-colors">
                로그인
              </Link>
              <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
                무료 가입
              </Link>
            </div>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-5">
          {COURSES.filter(c => c.lessons.every(l => l.premium)).map((course) => (
            <CourseCard key={course.id} course={course} onOpen={openLesson} user={user} completions={completions} />
          ))}
        </div>
      </div>

      {/* 로그인 안내 모달 */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-sm p-8 text-center">
            <Crown className="text-yellow-400 mx-auto mb-4" size={40} />
            <h2 className="text-xl font-bold text-white mb-2">PRO 코스</h2>
            <p className="text-slate-400 text-sm mb-6">
              PRO 코스는 로그인 후 이용할 수 있습니다.<br />
              무료로 가입하고 모든 코스를 바로 열어보세요!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm transition-colors"
              >
                닫기
              </button>
              <Link
                href="/signup"
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors text-center"
              >
                무료 가입
              </Link>
            </div>
            <Link href="/login" className="block mt-3 text-xs text-slate-500 hover:text-slate-300">
              이미 계정이 있어요
            </Link>
          </div>
        </div>
      )}

      {/* 레슨 모달 — 모바일: 바텀시트, 데스크탑: 센터 모달 */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black/70 flex items-end md:items-start justify-center z-50 md:p-4 md:overflow-y-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-t-2xl md:rounded-2xl w-full max-w-2xl md:my-8 max-h-[92vh] md:max-h-none overflow-y-auto">
            {/* 모바일 드래그 핸들 */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 md:p-6 border-b border-slate-800">
              <div>
                <p className="text-xs text-slate-500 mb-1">{selectedCourse?.title}</p>
                <h2 className="text-xl font-bold text-white">{selectedLesson.title}</h2>
              </div>
              <button
                onClick={() => { setSelectedLesson(null); setQuiz(null); setChatMessages([]); setDiagram(""); }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-5 py-5 md:p-6">
              {/* SVG 다이어그램 */}
              {(loadingDiagram || diagram) && (
                <div className="mb-5 rounded-xl overflow-hidden border border-slate-700">
                  {loadingDiagram ? (
                    <div className="bg-[#0f172a] h-[200px] flex items-center justify-center gap-2 text-slate-500 text-sm">
                      <Loader2 size={16} className="animate-spin" />
                      개념도 생성 중...
                    </div>
                  ) : (
                    <div
                      className="w-full"
                      dangerouslySetInnerHTML={{ __html: diagram }}
                    />
                  )}
                </div>
              )}

              {/* 레슨 콘텐츠 */}
              {loadingContent && !content ? (
                <div className="flex flex-col items-center py-12">
                  <Loader2 className="text-purple-400 animate-spin mb-3" size={32} />
                  <p className="text-slate-400 text-sm">AI가 설명을 작성하고 있습니다...</p>
                </div>
              ) : (
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {content}
                  {loadingContent && (
                    <span className="inline-block w-0.5 h-4 bg-purple-400 animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              )}

              {/* 완료 버튼 */}
              {!loadingContent && content.length > 0 && user && selectedCourse && selectedLesson && (
                <div className="mt-5">
                  {completions.has(`${selectedCourse.id}::${selectedLesson.id}`) ? (
                    <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                      <CheckCircle size={16} className="text-green-400" />
                      <span className="text-sm font-medium text-green-400">이 레슨 완료!</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => markLessonComplete(selectedCourse.id, selectedLesson.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                    >
                      <CheckCircle size={15} />
                      이 레슨 완료로 표시
                    </button>
                  )}
                </div>
              )}

              {/* 퀴즈 영역 */}
              {!loadingContent && content.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-800">
                  {!quiz ? (
                    <button
                      onClick={generateQuiz}
                      disabled={loadingQuiz}
                      className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {loadingQuiz ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
                      {loadingQuiz ? "퀴즈 생성 중..." : "퀴즈로 확인하기"}
                    </button>
                  ) : (
                    <div>
                      <h3 className="font-semibold text-white mb-4">퀴즈</h3>
                      <div className="space-y-5">
                        {quiz.questions?.map((q: any, qi: number) => (
                          <div key={qi}>
                            <p className="text-sm font-medium text-white mb-2">{qi + 1}. {q.question}</p>
                            <div className="space-y-2">
                              {q.options.map((opt: string, oi: number) => {
                                let cls = "border-slate-700 text-slate-300";
                                if (quizSubmitted) {
                                  if (oi === q.answer) cls = "border-green-500 bg-green-500/10 text-green-300";
                                  else if (oi === quizAnswers[qi] && oi !== q.answer) cls = "border-red-500 bg-red-500/10 text-red-300";
                                } else if (quizAnswers[qi] === oi) {
                                  cls = "border-blue-500 bg-blue-500/10 text-blue-300";
                                }
                                return (
                                  <button
                                    key={oi}
                                    disabled={quizSubmitted}
                                    onClick={() => {
                                      const next = [...quizAnswers];
                                      next[qi] = oi;
                                      setQuizAnswers(next);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${cls}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            {quizSubmitted && (
                              <p className="text-xs text-slate-400 mt-2 pl-1">💡 {q.explanation}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {!quizSubmitted && (
                        <button
                          onClick={() => setQuizSubmitted(true)}
                          disabled={quizAnswers.includes(-1)}
                          className="mt-5 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-2.5 rounded-xl font-medium transition-colors"
                        >
                          제출하기
                        </button>
                      )}

                      {quizSubmitted && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                          <CheckCircle className="text-green-400 mx-auto mb-1" size={20} />
                          <p className="text-sm text-green-300 font-medium">
                            {quizAnswers.filter((a, i) => a === quiz.questions[i]?.answer).length} / {quiz.questions?.length} 정답
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* AI 챗봇 */}
              {!loadingContent && content.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-800">
                  {/* 챗봇 헤더 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle size={16} className="text-blue-400" />
                      <span className="text-sm font-semibold text-white">이 레슨이 궁금해요</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap size={12} className={remainingChats > 0 ? "text-yellow-400" : "text-slate-600"} />
                      <span className={`text-xs font-medium ${remainingChats > 0 ? "text-yellow-400" : "text-slate-500"}`}>
                        오늘 {remainingChats}/{DAILY_CHAT_LIMIT} 남음
                      </span>
                    </div>
                  </div>

                  {/* 채팅 내역 */}
                  {chatMessages.length > 0 && (
                    <div className="space-y-3 mb-3 max-h-64 overflow-y-auto pr-1">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                              msg.role === "user"
                                ? "bg-blue-600 text-white rounded-br-sm"
                                : "bg-slate-800 text-slate-300 rounded-bl-sm"
                            }`}
                          >
                            {msg.content || (
                              <span className="flex items-center gap-1 text-slate-500">
                                <Loader2 size={12} className="animate-spin" /> 생각 중...
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={chatBottomRef} />
                    </div>
                  )}

                  {/* 입력창 */}
                  {remainingChats > 0 ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                        placeholder="레슨 내용에 대해 궁금한 점을 물어보세요"
                        disabled={chatLoading}
                        className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      />
                      <button
                        onClick={sendChat}
                        disabled={chatLoading || !chatInput.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-colors"
                      >
                        {chatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-3 px-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <p className="text-sm text-slate-400">오늘의 AI 질문을 모두 사용했습니다</p>
                      <p className="text-xs text-slate-500 mt-0.5">내일 자정에 {DAILY_CHAT_LIMIT}회 충전됩니다 ✨</p>
                    </div>
                  )}

                  {chatMessages.length === 0 && remainingChats > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {["이걸 실생활에 어떻게 활용해요?", "더 쉽게 설명해줘", "예시를 더 들어줘"].map((q) => (
                        <button
                          key={q}
                          onClick={() => { setChatInput(q); }}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
                        >
                          {q}
                        </button>
                      ))}
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
