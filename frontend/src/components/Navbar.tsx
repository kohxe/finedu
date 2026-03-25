"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TrendingUp, BookOpen, BarChart2, Brain, Menu, X, User, LogOut, Crown, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const navItems = [
  { href: "/terms", label: "용어 사전", icon: BookOpen },
  { href: "/courses", label: "트레이닝 코스", icon: Brain },
  { href: "/charts", label: "차트 분석", icon: BarChart2 },
  { href: "/insights", label: "인사이트", icon: Lightbulb },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const emailShort = user?.email?.split("@")[0] ?? "";

  return (
    <nav className="border-b border-slate-800 bg-[#0d1323] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <TrendingUp className="text-blue-400" size={24} />
          <span>Fin<span className="text-blue-400">Edu</span></span>
        </Link>

        {/* 데스크탑 메뉴 */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>

        {/* 로그인 상태 */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Crown size={14} className="text-yellow-400" />
                <span className="max-w-[120px] truncate">{emailShort}</span>
                <User size={14} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a2332] border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-xs text-slate-500">로그인됨</p>
                    <p className="text-sm text-white font-medium truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                      PRO 멤버
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <LogOut size={14} />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
                로그인
              </Link>
              <Link href="/signup" className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                무료 시작
              </Link>
            </>
          )}
        </div>

        {/* 모바일 햄버거 */}
        <button
          className="md:hidden text-slate-400 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0d1323] px-4 py-3 flex flex-col gap-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <div className="flex gap-3 mt-2 pt-2 border-t border-slate-800">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 text-sm text-slate-400 py-2 hover:text-white"
              >
                <LogOut size={14} />
                로그아웃 ({emailShort})
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm text-slate-400 py-2 hover:text-white">로그인</Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500">무료 시작</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
