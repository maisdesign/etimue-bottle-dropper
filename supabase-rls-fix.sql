-- =====================================================
-- SUPABASE RLS POLICIES FIX
-- Esegui questo script nel Supabase SQL Editor
-- =====================================================

-- 🔧 STEP 1: Assicurarsi che RLS sia abilitato
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- 🗑️ STEP 2: Rimuovere policies esistenti (se presenti)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own scores" ON scores;
DROP POLICY IF EXISTS "Anyone can view all scores" ON scores;

-- 📋 STEP 3: Creare policies per PROFILES
-- Permettere agli utenti autenticati di inserire il proprio profilo
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Permettere agli utenti autenticati di vedere il proprio profilo
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Permettere agli utenti autenticati di aggiornare il proprio profilo
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 🏆 STEP 4: Creare policies per SCORES
-- Permettere agli utenti autenticati di inserire i propri punteggi
CREATE POLICY "Users can insert own scores" ON scores
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permettere a tutti di vedere tutti i punteggi (per la classifica)
CREATE POLICY "Anyone can view all scores" ON scores
FOR SELECT TO anon, authenticated
USING (true);

-- 📊 STEP 5: Verificare che le policies siano state create
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'scores')
ORDER BY tablename, policyname;

-- ✅ STEP 6: Test rapido di inserimento
-- Questo dovrebbe funzionare se sei autenticato
-- INSERT INTO profiles (id, username, email, consent_marketing, consent_ts)
-- VALUES (auth.uid(), 'test-user', 'test@example.com', false, null);

-- 🎯 Fine script - Ora il salvataggio dovrebbe funzionare!