"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/courses` },
      });
      if (error) {
        if (error.message.includes("already registered")) {
          setError("이미 가입된 이메일입니다. 로그인해주세요.");
        } else {
          setError(error.message);
        }
        return;
      }
      setDone(true);
    } catch {
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-8">
            <CheckCircle className="text-green-400 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-white mb-2">이메일을 확인해주세요!</h2>
            <p className="text-slate-400 text-sm mb-6">
              <span className="text-blue-400 font-medium">{email}</span>으로 인증 메일을 보냈습니다.
              <br />메일의 링크를 클릭하면 바로 사용할 수 있어요.
            </p>
            <Link
              href="/login"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors text-sm"
            >
              로그인 페이지로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-white">
            <TrendingUp className="text-blue-400" size={28} />
            <span>Fin<span className="text-blue-400">Edu</span></span>
          </Link>
          <p className="text-slate-400 mt-2 text-sm">무료로 시작하고, PRO로 더 깊이</p>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-white mb-6">무료 가입</h1>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">비밀번호 (6자 이상)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="비밀번호 입력"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 pr-10 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">비밀번호 확인</label>
              <input
                type={showPassword ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                placeholder="비밀번호 재입력"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "가입 중..." : "무료 가입하기"}
            </button>
          </form>

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-300">
              ✓ 무료 코스 4개 즉시 이용<br />
              ✓ PRO 코스 14개 잠금 해제<br />
              ✓ AI 레슨 + 챗봇 일일 5회
            </p>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-800 text-center text-sm text-slate-500">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
