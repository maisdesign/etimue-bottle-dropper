# 🚨 NEXT SESSION TODO - IMMEDIATE ACTIONS

## 📸 FIRST: CHECK SCREENSHOTS
- Screenshots/ folder contiene console errors del score submission failure
- 4 immagini con error data da analizzare
- Delete screenshots after reading

## 🔴 CRITICAL BUG 1: Score Submission Failure
**STATUS**: BLOCCA GAMEPLAY - punteggi non si salvano

**SYMPTOMS**: 
- Messaggio "invio punteggio fallito" 
- Account test: cardia.marco85@gmail.com (fuori gara - corretto)
- UI flow corretta ma submission fails

**DEBUG STEPS**:
1. Analizza console errors negli screenshots
2. Verifica Edge Function `submit-score` su Supabase
3. Test timeout (attualmente 15 sec)
4. Check validation logic (score/duration ranges)
5. Test fallback direct database method
6. Network connectivity issues?

**FILES TO CHECK**:
- `src/scenes/GameOverScene.ts:307` (submitScore call)
- `src/net/supabaseClient.ts:180` (scoreService.submitScore)
- Supabase Functions: `submit-score` edge function

## 🟡 CRITICAL BUG 2: Bottle Disappearing 
**STATUS**: Gameplay impact aumentato

**SYMPTOMS**:
- Bottiglie marroni spariscono prima di toccare fondo
- Frequenza aumentata ("un po' più del dovuto")
- Particolarmente bottiglie lente

**DEBUG STEPS**:
1. Check object pool destroy logic
2. Lifetime management bottles
3. Speed-dependent destruction bug
4. Test in different scenarios

## ✅ SUCCESS THIS SESSION
- Fixed 5 critical UX bugs from manual testing
- Deployed successfully to dual repository system
- Created DEPLOYMENT_REMINDER.md to prevent future deployment confusion
- All major UI flows working correctly

## 🎯 SESSION PRIORITY
1. **SCORE SUBMISSION** (blocking users)
2. **BOTTLE DISAPPEARING** (gameplay quality)
3. Code quality warnings (nice-to-have)

---
*Session ended at 00:50 on 2025-09-13*
*User needs to sleep - continue debugging next session*