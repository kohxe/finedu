"use client";

import { useState, useEffect } from "react";
import { Zap, CheckCircle, XCircle, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const STORAGE_KEY = "daily_quiz";

type QuizData = {
  topic: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

type SavedState = {
  date: string;
  selected: number;
  quiz: QuizData;
};

export default function DailyQuizCard() {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // 오늘 이미 풀었는지 확인
    try {
      const saved: SavedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && saved.date === new Date().toDateString()) {
        setQuiz(saved.quiz);
        setSelected(saved.selected);
        setSubmitted(true);
        setLoading(false);
        return;
      }
    } catch {}

    fetch(`${API_URL}/api/courses/daily-quiz`)
      .then((r) => r.json())
      .then((data) => setQuiz(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSubmit(idx: number) {
    if (submitted || !quiz) return;
    setSelected(idx);
    setSubmitted(true);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: new Date().toDateString(), selected: idx, quiz })
      );
    } catch {}
  }

  const isCorrect = selected === quiz?.answer;

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-yellow-400/10 rounded-lg flex items-center justify-center">
          <Zap size={14} className="text-yellow-400" />
        </div>
        <span className="font-semibold text-white text-sm">오늘의 퀴즈</span>
        {submitted && (
          <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
            isCorrect ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          }`}>
            {isCorrect ? "정답!" : "오답"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-8 gap-2 text-slate-500 text-sm">
          <Loader2 size={16} className="animate-spin" />
          퀴즈 불러오는 중...
        </div>
      ) : !quiz || !quiz.question ? (
        <div className="flex-1 flex items-center justify-center py-8 text-slate-500 text-sm">
          퀴즈를 불러오지 못했습니다
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <p className="text-xs text-slate-500 mb-2">📌 {quiz.topic}</p>
          <p className="text-sm font-medium text-white mb-3 leading-relaxed">{quiz.question}</p>

          <div className="space-y-2 flex-1">
            {quiz.options.map((opt, i) => {
              let cls = "border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white cursor-pointer";
              if (submitted) {
                if (i === quiz.answer) cls = "border-green-500 bg-green-500/10 text-green-300";
                else if (i === selected) cls = "border-red-500 bg-red-500/10 text-red-300";
                else cls = "border-slate-800 text-slate-600 cursor-default";
              } else if (selected === i) {
                cls = "border-blue-500 bg-blue-500/10 text-blue-300";
              }
              return (
                <button
                  key={i}
                  onClick={() => handleSubmit(i)}
                  disabled={submitted}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${cls}`}
                >
                  <span className="text-xs text-slate-500 mr-2">{["①","②","③","④"][i]}</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {submitted && (
            <div className={`mt-3 p-3 rounded-lg flex gap-2 text-xs leading-relaxed ${
              isCorrect ? "bg-green-500/10 text-green-300" : "bg-slate-800 text-slate-400"
            }`}>
              {isCorrect
                ? <CheckCircle size={14} className="shrink-0 mt-0.5 text-green-400" />
                : <XCircle size={14} className="shrink-0 mt-0.5 text-red-400" />}
              <span>{quiz.explanation}</span>
            </div>
          )}

          {!submitted && (
            <p className="mt-3 text-xs text-slate-600 text-center">보기를 클릭하면 바로 채점됩니다</p>
          )}
        </div>
      )}
    </div>
  );
}
