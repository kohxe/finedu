-- FinEdu Supabase 테이블 설정
-- Supabase Dashboard > SQL Editor 에서 실행하세요

-- 1. 학습 완료 기록 테이블
CREATE TABLE IF NOT EXISTS lesson_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id, lesson_id)
);

-- RLS 활성화
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 읽기/쓰기 허용
CREATE POLICY "Users can read own completions"
    ON lesson_completions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
    ON lesson_completions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions"
    ON lesson_completions FOR DELETE
    USING (auth.uid() = user_id);


-- 2. 뉴스레터 구독자 테이블
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);

-- RLS 활성화 (백엔드 service key만 접근 가능)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 구독자는 본인 이메일만 삽입 가능 (anon 허용)
CREATE POLICY "Anyone can subscribe"
    ON newsletter_subscribers FOR INSERT
    WITH CHECK (true);

-- 업데이트는 service key(백엔드)만 가능 (no public policy = service role only)
