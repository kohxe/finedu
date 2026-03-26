"use client";

import { useState, useEffect } from "react";
import { Sparkles, Lightbulb, Loader2, X, RefreshCw } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TAG_COLORS: Record<string, string> = {
  주식: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  펀드: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  경제: "bg-green-500/20 text-green-300 border-green-500/30",
  금리: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  환율: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  투자전략: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

type Topic = { title: string; subtitle: string; emoji: string; tag: string };
type Insight = Topic & { oneliner: string; body: string; takeaway: string; hidden_truth?: string };

export default function InsightsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [daily, setDaily] = useState<Insight | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [modal, setModal] = useState<Insight | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/insights/list`)
      .then((r) => r.json())
      .then((d) => setTopics(d.topics || []));

    fetch(`${API_URL}/api/insights/daily`)
      .then((r) => r.json())
      .then((d) => { setDaily(d); setDailyLoading(false); })
      .catch(() => setDailyLoading(false));
  }, []);

  async function openTopic(topic: Topic) {
    setModal({ ...topic, oneliner: "", body: "", takeaway: "" });
    setModalLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/insights/topic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(topic),
      });
      const data = await res.json();
      setModal(data);
    } catch {
      setModal((prev) => prev ? { ...prev, body: "서버 연결을 확인해주세요." } : null);
    } finally {
      setModalLoading(false);
    }
  }

  const tagColor = (tag: string) => TAG_COLORS[tag] || TAG_COLORS["경제"];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">💡 금융 인사이트</h1>
        <p className="text-slate-400">AI가 쉽게 풀어주는 금융 개념 — 오늘 바로 써먹을 수 있는 지식</p>
      </div>

      {/* 오늘의 인사이트 */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="text-yellow-400" size={16} />
          <span className="text-sm font-semibold text-yellow-400">오늘의 인사이트</span>
        </div>
        <div className="relative bg-gradient-to-br from-[#0f1c35] to-[#111827] border border-blue-800/40 rounded-2xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />

          {dailyLoading ? (
            <div className="space-y-3">
              <div className="h-7 bg-slate-800 rounded animate-pulse w-1/3" />
              <div className="h-4 bg-slate-800 rounded animate-pulse w-1/2" />
              <div className="h-24 bg-slate-800 rounded animate-pulse mt-4" />
            </div>
          ) : daily ? (
            <div className="relative">
              <div className="flex items-start gap-4 mb-4">
                <span className="text-5xl">{daily.emoji}</span>
                <div>
                  <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border mb-2 ${tagColor(daily.tag)}`}>
                    {daily.tag}
                  </span>
                  <h2 className="text-2xl font-bold text-white">{daily.title}</h2>
                  <p className="text-slate-400 text-sm">{daily.subtitle}</p>
                </div>
              </div>
              {daily.oneliner && (
                <p className="text-blue-300 font-semibold text-lg mb-3 italic">"{daily.oneliner}"</p>
              )}
              <p className="text-slate-300 leading-relaxed mb-4">{daily.body}</p>
              {(daily as Insight).hidden_truth && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex gap-2 mb-3">
                  <span className="text-amber-400 shrink-0">🔍</span>
                  <p className="text-amber-300 text-sm"><span className="font-semibold">대부분 모르는 사실: </span>{(daily as Insight).hidden_truth}</p>
                </div>
              )}
              {daily.takeaway && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex gap-2">
                  <Lightbulb className="text-blue-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-blue-300 text-sm"><span className="font-semibold">오늘의 실천: </span>{daily.takeaway}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* 전체 토픽 그리드 */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">모든 인사이트 주제</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => (
            <button
              key={topic.title}
              onClick={() => openTopic(topic)}
              className="text-left bg-[#111827] border border-slate-800 rounded-xl p-5 hover:border-slate-600 hover:bg-[#131e2f] transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{topic.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full border mb-1.5 ${tagColor(topic.tag)}`}>
                    {topic.tag}
                  </span>
                  <h3 className="font-semibold text-white text-sm group-hover:text-blue-300 transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{topic.subtitle}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 인사이트 모달 */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl md:rounded-2xl rounded-t-2xl w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{modal.emoji}</span>
                <div>
                  <h2 className="text-lg font-bold text-white">{modal.title}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${tagColor(modal.tag)}`}>
                    {modal.tag}
                  </span>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="p-5">
              {modalLoading ? (
                <div className="flex flex-col items-center py-10">
                  <Loader2 className="text-blue-400 animate-spin mb-3" size={28} />
                  <p className="text-slate-400 text-sm">AI가 인사이트를 작성하고 있어요...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modal.oneliner && (
                    <p className="text-blue-300 font-semibold italic text-base">"{modal.oneliner}"</p>
                  )}
                  <p className="text-slate-300 text-sm leading-relaxed">{modal.body}</p>
                  {modal.hidden_truth && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex gap-2">
                      <span className="text-amber-400 shrink-0">🔍</span>
                      <p className="text-amber-300 text-sm"><span className="font-semibold">대부분 모르는 사실: </span>{modal.hidden_truth}</p>
                    </div>
                  )}
                  {modal.takeaway && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex gap-2">
                      <Lightbulb className="text-blue-400 shrink-0 mt-0.5" size={15} />
                      <p className="text-blue-300 text-sm"><span className="font-semibold">오늘의 실천: </span>{modal.takeaway}</p>
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
