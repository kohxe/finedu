"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "오류가 발생했습니다.");
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-4">
        <CheckCircle className="text-green-400 shrink-0" size={20} />
        <div>
          <p className="text-sm font-medium text-green-300">구독 완료!</p>
          <p className="text-xs text-slate-500 mt-0.5">매일 아침 금융 레슨이 이메일로 도착합니다</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="이메일 주소 입력"
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
        {loading ? "구독 중..." : "매일 받기"}
      </button>
      {error && <p className="text-red-400 text-xs mt-1 sm:absolute sm:bottom-[-20px]">{error}</p>}
    </form>
  );
}
