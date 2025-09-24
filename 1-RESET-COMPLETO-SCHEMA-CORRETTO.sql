-- =====================================================
-- ETIMUÈ BOTTLE DROPPER - COMPLETE DATABASE RESET (SCHEMA CORRETTO)
-- Execute this in Supabase SQL Editor Dashboard
-- =====================================================

-- 🗑️ STEP 1: Complete cleanup (drop everything)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own scores" ON scores;
DROP POLICY IF EXISTS "Anyone can view all scores" ON scores;
DROP POLICY IF EXISTS "Users can view all scores" ON scores;
DROP POLICY IF EXISTS "users_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_scores" ON scores;
DROP POLICY IF EXISTS "public_read_scores" ON scores;

-- Drop views
DROP VIEW IF EXISTS weekly_leaderboard;
DROP VIEW IF EXISTS monthly_leaderboard;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_updated_at();

-- Drop tables
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 🏗️ STEP 2: Create tables with COMPLETE schema

-- Profiles table (COMPLETE with all required fields)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT,
    instagram TEXT,
    consent_marketing BOOLEAN NOT NULL DEFAULT false,
    consent_ts TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scores table (compatible with old system)
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
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX idx_scores_score ON scores(score DESC);
CREATE INDEX idx_scores_leaderboard ON scores(score DESC, created_at ASC);

-- 🎯 STEP 6: Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ✅ STEP 7: Verify the setup
SELECT 'Database reset completed with COMPLETE schema!' as status;

SELECT COUNT(*) as profile_count FROM profiles;
SELECT COUNT(*) as score_count FROM scores;

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

-- 🎉 Database reset complete!
-- Schema now includes ALL required fields:
-- - display_name, email, whatsapp, instagram
-- - consent_marketing, consent_ts
-- - created_at, updated_at with trigger