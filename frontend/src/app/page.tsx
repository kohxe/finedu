import Link from "next/link";
import { BookOpen, Brain, BarChart2, TrendingUp, Zap, Shield, ChevronRight } from "lucide-react";
import DailyInsightCard from "@/components/DailyInsightCard";
import DailyQuizCard from "@/components/DailyQuizCard";
import NewsletterForm from "@/components/NewsletterForm";

const features = [
  {
    icon: BookOpen,
    title: "AI 용어 사전",
    description: "주식, 펀드, 거시/미시 경제 용어를 AI가 쉽게 설명해줍니다. 초보자도 이해할 수 있는 비유와 예시로.",
    href: "/terms",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Brain,
    title: "단계별 트레이닝 코스",
    description: "주식 기초부터 차트 분석, 거시경제까지. 퀴즈로 확인하며 단계별로 실력을 키워보세요.",
    href: "/courses",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: BarChart2,
    title: "차트 + AI 해설",
    description: "한국/미국 주요 종목 실시간 차트와 함께 'Why?'를 알려줍니다. 차트 뒤에 숨겨진 이유를 파악하세요.",
    href: "/charts",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
];

const stats = [
  { label: "금융 용어", value: "200+" },
  { label: "학습 코스", value: "14개" },
  { label: "AI 레슨", value: "80+" },
  { label: "무료 코스", value: "4개" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-6">
            <Zap size={14} />
            AI 기반 금융 교육 플랫폼
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            차트 뒤에 숨겨진
            <br />
            <span className="text-blue-400">이유</span>를 알면
            <br />
            투자가 달라집니다
          </h1>

          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            빨간불 파란불만 보지 마세요. 왜 오르고 왜 내리는지,
            세계 경제 흐름부터 개별 종목까지 AI와 함께 학습하세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/courses"
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              무료로 시작하기
              <ChevronRight size={20} />
            </Link>
            <Link
              href="/charts"
              className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              <TrendingUp size={20} />
              차트 보러가기
            </Link>
          </div>
        </div>
      </section>

      {/* 오늘의 인사이트 + 퀴즈 + 카테고리 */}
      <section className="py-10 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          <DailyInsightCard />
          <DailyQuizCard />

          {/* 카테고리 빠른 접근 */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 md:col-span-1">
            <h3 className="font-semibold text-white mb-3 text-sm">📚 용어 카테고리</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "stock",      emoji: "📈", label: "주식",        count: 25 },
                { id: "macro",      emoji: "🌍", label: "거시경제",    count: 21 },
                { id: "trading",    emoji: "📊", label: "차트·매매",   count: 22 },
                { id: "account",    emoji: "🏦", label: "계좌·세금",   count: 18 },
                { id: "fund",       emoji: "🧺", label: "펀드·ETF",    count: 17 },
                { id: "bond",       emoji: "📜", label: "채권·금리",   count: 15 },
                { id: "global",     emoji: "🌐", label: "글로벌 시장", count: 16 },
                { id: "realestate", emoji: "🏠", label: "부동산·대출", count: 16 },
              ].map(({ id, emoji, label, count }) => (
                <Link
                  key={id}
                  href={`/terms?cat=${id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors group"
                >
                  <span className="text-lg">{emoji}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-300 group-hover:text-white truncate">{label}</div>
                    <div className="text-[10px] text-slate-600">{count}개</div>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/terms" className="mt-3 flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors pt-2 border-t border-slate-800">
              전체 200+ 용어 보기 <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* 통계 */}
      <section className="py-10 px-4 border-y border-slate-800/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-white">{value}</div>
              <div className="text-sm text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 기능 카드 */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">무엇을 배울 수 있나요?</h2>
            <p className="text-slate-400">처음 시작하는 분부터 심화 학습까지, 모든 단계를 다룹니다</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, href, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="group bg-[#111827] border border-slate-800 hover:border-slate-600 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20"
              >
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={color} size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
                <div className={`flex items-center gap-1 mt-4 text-sm ${color} font-medium`}>
                  바로가기 <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 학습 흐름 */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-slate-900/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">이런 순서로 배워요</h2>
          </div>
          <div className="space-y-4">
            {[
              { step: "01", title: "용어부터 시작", desc: "모르는 용어가 나오면 AI 사전에서 바로 검색. 쉬운 비유로 빠르게 이해." },
              { step: "02", title: "트레이닝 코스 수강", desc: "주식 기초 → 차트 읽기 → 거시경제 순서로 체계적으로 학습." },
              { step: "03", title: "실제 차트에 적용", desc: "배운 내용을 실제 종목 차트에서 확인. AI가 왜 이렇게 됐는지 해설." },
              { step: "04", title: "퀴즈로 복습", desc: "각 레슨 후 AI 생성 퀴즈로 이해도 체크. 틀린 부분 다시 확인." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4 bg-[#111827] border border-slate-800 rounded-xl p-5">
                <div className="text-2xl font-bold text-blue-400/30 min-w-[48px]">{step}</div>
                <div>
                  <div className="font-semibold text-white mb-1">{title}</div>
                  <div className="text-sm text-slate-400">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 뉴스레터 구독 */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-400">매일 아침 금융 레슨</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">오늘도 하나씩 배워요</h2>
            <p className="text-slate-400 text-sm mb-6">
              매일 아침 금융 개념 1개 + 시장 키워드 + 오늘의 추천 레슨을<br className="hidden sm:block" />
              이메일로 받아보세요. 3분이면 충분합니다.
            </p>
            <NewsletterForm />
            <p className="text-xs text-slate-600 mt-3">스팸 없음 · 언제든지 수신 거부 가능</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-800/30 rounded-2xl p-12">
          <Shield className="text-blue-400 mx-auto mb-4" size={40} />
          <h2 className="text-3xl font-bold text-white mb-3">지금 바로 무료로 시작</h2>
          <p className="text-slate-400 mb-8">기본 콘텐츠는 전부 무료. 회원가입 없이도 대부분 이용 가능합니다.</p>
          <Link
            href="/courses"
            className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-colors inline-flex items-center gap-2"
          >
            첫 번째 코스 시작하기
            <ChevronRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
