-- =====================================================
-- ETIMUÈ BOTTLE DROPPER - COMPLETE DATABASE RESET
-- Execute this in Supabase SQL Editor Dashboard
-- =====================================================

-- 🗑️ STEP 1: Complete cleanup (drop everything)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own scores" ON scores;
DROP POLICY IF EXISTS "Anyone can view all scores" ON scores;

DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 🏗️ STEP 2: Create clean, simple tables

-- Profiles table (simplified)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,  -- Simple display name
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scores table (simplified)
CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 600),
    game_duration INTEGER NOT NULL CHECK (game_duration >= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🔒 STEP 3: Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- 📋 STEP 4: Create SIMPLE and CLEAR RLS policies

-- Profiles: Users can manage their own profile
CREATE POLICY "users_own_profile" ON profiles
FOR ALL TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Scores: Users can insert their own scores
CREATE POLICY "users_insert_own_scores" ON scores
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Scores: Everyone can read all scores (for leaderboard)
CREATE POLICY "public_read_scores" ON scores
FOR SELECT TO authenticated, anon
USING (true);

-- 🚀 STEP 5: Create indexes for performance
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX idx_scores_score ON scores(score DESC);
CREATE INDEX idx_scores_leaderboard ON scores(score DESC, created_at ASC);

-- 🎯 STEP 6: Insert test data (optional)
-- This will help verify everything works
INSERT INTO profiles (id, display_name, email)
VALUES (
    '00000000-1111-2222-3333-444444444444'::uuid,
    'Test Player',
    'test@example.com'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO scores (user_id, score, game_duration)
VALUES (
    '00000000-1111-2222-3333-444444444444'::uuid,
    100,
    45
) ON CONFLICT DO NOTHING;

-- ✅ STEP 7: Verify the setup
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'scores')
ORDER BY tablename, policyname;

-- Show table structures
\d profiles;
\d scores;

-- Show test data
SELECT COUNT(*) as profile_count FROM profiles;
SELECT COUNT(*) as score_count FROM scores;

-- 🎉 Database reset complete!
-- Tables are now clean, simple, and optimized
-- RLS policies are clear and functional