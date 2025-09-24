-- =====================================================
-- ETIMUÈ BOTTLE DROPPER - RLS POLICIES ONLY
-- Execute this if you only need to fix policies
-- =====================================================

-- 🔧 STEP 1: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- 🗑️ STEP 2: Remove existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own scores" ON scores;
DROP POLICY IF EXISTS "Anyone can view all scores" ON scores;
DROP POLICY IF EXISTS "Users can view all scores" ON scores;
DROP POLICY IF EXISTS "users_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_scores" ON scores;
DROP POLICY IF EXISTS "public_read_scores" ON scores;

-- 📋 STEP 3: Create SimpleAuth compatible policies

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

-- 📊 STEP 4: Verify policies are created correctly
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

SELECT 'RLS Policies updated successfully for SimpleAuth!' as status;