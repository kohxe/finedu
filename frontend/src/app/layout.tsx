import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "FinEdu - 금융 교육 플랫폼",
  description: "주식, 펀드, 경제 용어부터 차트 읽는 법까지. AI와 함께 쉽게 배우는 금융 교육",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#0a0e1a] text-slate-200 antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
