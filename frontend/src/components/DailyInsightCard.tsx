"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, Lightbulb } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TAG_COLORS: Record<string, string> = {
  주식: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  펀드: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  경제: "bg-green-500/20 text-green-300 border-green-500/30",
  금리: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  환율: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  투자전략: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

type Insight = {
  title: string;
  subtitle: string;
  emoji: string;
  oneliner: string;
  body: string;
  takeaway: string;
  tag: string;
};

export default function DailyInsightCard() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchInsight() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/insights/daily`);
      const data = await res.json();
      setInsight(data);
    } catch {
      setInsight({
        title: "복리의 마법",
        subtitle: "시간이 돈을 만드는 원리",
        emoji: "✨",
        oneliner: "일찍 시작할수록 유리하다",
        body: "복리는 이자에 이자가 붙는 구조예요. 매년 10% 수익이 나는 투자에 100만원을 넣으면, 10년 후엔 259만원이 됩니다. 단리라면 200만원이지만, 복리는 59만원이 더 붙어요. 시간이 길수록 차이가 엄청나게 커집니다.",
        takeaway: "💡 오늘 당장 투자 계좌 하나 만들어보세요. 늦은 시작보다 작은 시작이 낫습니다.",
        tag: "투자전략",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInsight(); }, []);

  const tagColor = insight ? (TAG_COLORS[insight.tag] || TAG_COLORS["경제"]) : "";

  return (
    <div className="relative bg-gradient-to-br from-[#0f1c35] to-[#111827] border border-blue-800/40 rounded-2xl p-6 overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <Sparkles className="text-yellow-400" size={16} />
          <span className="text-xs font-medium text-yellow-400">오늘의 금융 인사이트</span>
        </div>
        <button
          onClick={fetchInsight}
          disabled={loading}
          className="text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30"
          title="새로운 인사이트"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 relative">
          <div className="h-6 bg-slate-800 rounded animate-pulse w-2/3" />
          <div className="h-4 bg-slate-800 rounded animate-pulse w-1/2" />
          <div className="h-20 bg-slate-800 rounded animate-pulse mt-4" />
        </div>
      ) : insight ? (
        <div className="relative">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-4xl">{insight.emoji}</span>
            <div>
              <h3 className="text-lg font-bold text-white">{insight.title}</h3>
              <p className="text-sm text-slate-400">{insight.subtitle}</p>
            </div>
          </div>

          {insight.tag && (
            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border mb-3 ${tagColor}`}>
              {insight.tag}
            </span>
          )}

          <p className="text-slate-300 text-sm leading-relaxed mb-4">{insight.body}</p>

          {insight.takeaway && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex gap-2">
              <Lightbulb className="text-blue-400 shrink-0 mt-0.5" size={15} />
              <p className="text-blue-300 text-sm">{insight.takeaway}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
