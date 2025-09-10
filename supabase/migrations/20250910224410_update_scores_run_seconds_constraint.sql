-- Remove the existing check constraint that forces run_seconds = 60
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_run_seconds_check;

-- Add new constraint allowing run_seconds between 45 and 180 seconds
ALTER TABLE scores ADD CONSTRAINT scores_run_seconds_check CHECK (run_seconds >= 45 AND run_seconds <= 180);

-- Add index for better performance on score queries
CREATE INDEX IF NOT EXISTS idx_scores_user_created_at ON scores (user_id, created_at DESC);

-- Add index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_scores_period_score ON scores (score DESC, created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN scores.run_seconds IS 'Game duration in seconds (45-180, allows for power-up bonuses)';
COMMENT ON CONSTRAINT scores_run_seconds_check ON scores IS 'Allows game duration between 45-180 seconds for power-ups and skill variations';