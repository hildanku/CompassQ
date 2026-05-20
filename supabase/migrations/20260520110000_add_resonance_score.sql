-- Add resonance_score column to sessions table
-- Stores user's 1-5 rating of how deeply the verse resonated
alter table public.sessions
    add column resonance_score smallint
    check (resonance_score is null or (resonance_score >= 1 and resonance_score <= 5));

-- Index for efficient resonance-based queries (insights, recommendation weighting)
create index if not exists sessions_user_resonance_idx
    on public.sessions (user_id, resonance_score)
    where resonance_score is not null;
