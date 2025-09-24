-- =====================================================
-- ETIMUÈ BOTTLE DROPPER - SYSTEM VERIFICATION
-- Execute this to verify everything is working
-- =====================================================

-- 📊 STEP 1: Check table structures
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('profiles', 'scores')
ORDER BY table_name, ordinal_position;

-- 🔒 STEP 2: Check RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'scores');

-- 📋 STEP 3: Check policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'scores')
ORDER BY tablename, policyname;

-- 🚀 STEP 4: Check indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('profiles', 'scores')
ORDER BY tablename, indexname;

-- 📈 STEP 5: Check data counts
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'scores' as table_name, COUNT(*) as record_count FROM scores;

-- 🎯 STEP 6: Test leaderboard query (SimpleAuth style)
SELECT
    s.id,
    s.score,
    s.game_duration,
    s.created_at,
    p.display_name,
    s.user_id
FROM scores s
LEFT JOIN profiles p ON s.user_id = p.id
WHERE s.created_at >= NOW() - INTERVAL '7 days'
ORDER BY s.score DESC, s.created_at ASC
LIMIT 10;

-- ✅ STEP 7: Final status check
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM profiles LIMIT 1)
        AND EXISTS (SELECT 1 FROM scores LIMIT 1)
        AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles')
        AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scores')
        THEN '✅ SimpleAuth Database System: READY!'
        ELSE '❌ SimpleAuth Database System: NOT READY'
    END as system_status;

SELECT 'Verification completed!' as result;