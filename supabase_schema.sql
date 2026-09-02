-- ============================================================================
-- FATFX — SUPABASE PRODUCTION DATABASE SCHEMA (CLEAN RESET & REBUILD)
-- v2.0 — Full Journal Overhaul: Two-Phase (Draft/Publish), 16 new fields
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('USER', 'PRO_TRADER', 'MODERATOR', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE account_status AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE position_type AS ENUM ('BUY', 'SELL'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE trade_result AS ENUM ('WIN', 'LOSS', 'BE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE signal_status AS ENUM ('ACTIVE', 'HIT_TP', 'HIT_SL', 'CLOSED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE connection_state AS ENUM ('PENDING', 'CONNECTED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE log_severity AS ENUM ('INFO', 'WARNING', 'CRITICAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE post_type AS ENUM ('STANDARD', 'STEPPER', 'THREAD'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- 3. CLEAN EXISTING TABLES
-- ============================================================================
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.signal_shares CASCADE;
DROP TABLE IF EXISTS public.signals CASCADE;
DROP TABLE IF EXISTS public.journal_push_shares CASCADE;
DROP TABLE IF EXISTS public.journals CASCADE;
DROP TABLE IF EXISTS public.connections CASCADE;
DROP TABLE IF EXISTS public.user_permissions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.month_capital_configs CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.system_config CASCADE;

-- ============================================================================
-- 4. TABLES
-- ============================================================================

-- PROFILES (supports direct API signups; no auth.users FK)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,          -- NOT unique: one email → multiple accounts
    avatar_url TEXT,
    role user_role DEFAULT 'USER' NOT NULL,
    bio TEXT DEFAULT 'Forex trader on FatFx.',
    win_rate NUMERIC(5,2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    status account_status DEFAULT 'ACTIVE' NOT NULL,
    ban_reason TEXT,
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- USER PERMISSIONS
CREATE TABLE public.user_permissions (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    can_publish_signals BOOLEAN DEFAULT TRUE NOT NULL,
    can_push_journals BOOLEAN DEFAULT TRUE NOT NULL,
    can_view_all_journals BOOLEAN DEFAULT FALSE NOT NULL,
    can_moderate_signals BOOLEAN DEFAULT FALSE NOT NULL,
    max_active_signals INTEGER DEFAULT 5 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- USER CONNECTIONS
CREATE TABLE public.connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    state connection_state DEFAULT 'PENDING' NOT NULL,
    has_push_access BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_connection UNIQUE (requester_id, target_id),
    CONSTRAINT check_self_connection CHECK (requester_id <> target_id)
);

-- ============================================================================
-- TRADING JOURNALS — Full two-phase (Draft → Publish) schema
-- ============================================================================
CREATE TABLE public.journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- ── Phase 1: Save as Draft fields ──────────────────────────────────────
    currency TEXT NOT NULL,                   -- Asset ticker (XAUUSD, EURUSD…)
    monthly_start_balance NUMERIC(15,2) NOT NULL DEFAULT 10000.00,
    trade_date DATE NOT NULL,
    trade_time TEXT NOT NULL DEFAULT '09:00', -- Exact execution time HH:mm
    direction TEXT NOT NULL DEFAULT 'LONG',   -- 'LONG' or 'SHORT'
    strategy TEXT NOT NULL DEFAULT '',        -- Setup name
    position_size NUMERIC(10,4) NOT NULL DEFAULT 0.01, -- Lots/contracts
    entry_price NUMERIC(15,5) NOT NULL DEFAULT 0,
    stop_loss_level NUMERIC(15,5) NOT NULL DEFAULT 0,
    take_profit_level NUMERIC(15,5) NOT NULL DEFAULT 0,
    fees NUMERIC(15,2) NOT NULL DEFAULT 0,    -- Commissions + slippage
    market_condition TEXT NOT NULL DEFAULT 'TREND', -- TREND/RANGE/VOLATILE/OTHER
    setup_screenshot_url TEXT,               -- Chart URL
    notes TEXT,

    -- ── Phase 2: Publish fields (filled after trade completes) ─────────────
    exit_price NUMERIC(15,5),
    net_pnl NUMERIC(15,2),                   -- Final cash outcome (drives calendar)
    r_multiple NUMERIC(8,3),                 -- R-multiple achieved
    emotional_state TEXT,                    -- CALM/GREEDY/FEARFUL etc.
    rule_compliance NUMERIC(4,1),            -- 0–10 discipline score
    mistakes_made TEXT,                      -- Deviations from plan

    -- ── Status ──────────────────────────────────────────────────────────────
    publish_status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT' or 'PUBLISHED'

    -- ── Legacy columns (kept for backward compatibility) ────────────────────
    position_type position_type,             -- Legacy BUY/SELL
    sl_pips NUMERIC(8,2) DEFAULT 20.00,
    result trade_result,
    gross_profit_loss NUMERIC(15,2),
    commissions NUMERIC(15,2) DEFAULT 0,
    total_profit NUMERIC(15,2),
    gain_percentage NUMERIC(8,2),
    tradingview_url TEXT,

    -- ── Push sharing ────────────────────────────────────────────────────────
    is_pushed BOOLEAN DEFAULT FALSE NOT NULL,
    pushed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- JOURNAL PUSH SHARES
CREATE TABLE public.journal_push_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
    shared_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shared_with_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_journal_share UNIQUE (journal_id, shared_with_id)
);

-- SIGNALS
CREATE TABLE public.signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset TEXT NOT NULL,
    type position_type NOT NULL,
    status signal_status DEFAULT 'ACTIVE' NOT NULL,
    timeframe TEXT NOT NULL DEFAULT '15M',
    signal_year INTEGER NOT NULL,
    signal_month INTEGER NOT NULL,
    signal_date DATE NOT NULL,
    signal_time TEXT NOT NULL,
    entry_price NUMERIC(15,5) NOT NULL,
    stop_loss NUMERIC(15,5) NOT NULL,
    take_profit NUMERIC(15,5) NOT NULL,
    current_price NUMERIC(15,5),
    tp_pips NUMERIC(10,2),
    sl_pips NUMERIC(10,2),
    risk_reward_ratio NUMERIC(5,2) NOT NULL DEFAULT 3.00,
    strategy TEXT,
    notes TEXT,
    tradingview_url TEXT,
    is_moderated BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- SIGNAL SHARES
CREATE TABLE public.signal_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
    recipient_username TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_signal_share UNIQUE (signal_id, recipient_username)
);

-- POSTS
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    post_type post_type DEFAULT 'STANDARD' NOT NULL,
    steps JSONB DEFAULT '[]'::jsonb,
    media_links JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- POST LIKES
CREATE TABLE public.post_likes (
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

-- POST COMMENTS
CREATE TABLE public.post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- MONTH CAPITAL CONFIGS
CREATE TABLE public.month_capital_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    config_year INTEGER NOT NULL,
    config_month INTEGER NOT NULL,
    capital NUMERIC(15,2) NOT NULL DEFAULT 10000.00,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_month_capital UNIQUE (user_id, config_year, config_month)
);

-- ACTIVITY AUDIT LOGS
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_username TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT,
    details TEXT NOT NULL,
    severity log_severity DEFAULT 'INFO' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- SYSTEM CONFIG
CREATE TABLE public.system_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    is_journal_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    is_signals_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    is_feeds_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    is_users_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    require_signal_approval BOOLEAN DEFAULT FALSE NOT NULL,
    allow_public_registration BOOLEAN DEFAULT TRUE NOT NULL,
    allow_push_sharing BOOLEAN DEFAULT TRUE NOT NULL,
    allow_pro_trader_signals_only BOOLEAN DEFAULT FALSE NOT NULL,
    maintenance_mode BOOLEAN DEFAULT FALSE NOT NULL,
    default_monthly_capital NUMERIC(15,2) DEFAULT 10000.00 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.system_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

CREATE INDEX IF NOT EXISTS idx_journals_user_id ON public.journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_trade_date ON public.journals(trade_date);
CREATE INDEX IF NOT EXISTS idx_journals_publish_status ON public.journals(publish_status);

CREATE INDEX IF NOT EXISTS idx_signals_author_id ON public.signals(author_id);
CREATE INDEX IF NOT EXISTS idx_signals_date_month ON public.signals(signal_year, signal_month);

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_requester ON public.connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_target ON public.connections(target_id);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_journals_updated_at BEFORE UPDATE ON public.journals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_signals_updated_at BEFORE UPDATE ON public.signals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_system_config_updated_at BEFORE UPDATE ON public.system_config FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_push_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.month_capital_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Full permissive policies for anon + authenticated API access
CREATE POLICY "profiles_all" ON public.profiles FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "user_permissions_all" ON public.user_permissions FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "connections_all" ON public.connections FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "journals_all" ON public.journals FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "journal_push_shares_all" ON public.journal_push_shares FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "signals_all" ON public.signals FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "signal_shares_all" ON public.signal_shares FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "posts_all" ON public.posts FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "post_likes_all" ON public.post_likes FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "post_comments_all" ON public.post_comments FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "month_capital_configs_all" ON public.month_capital_configs FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "activity_logs_all" ON public.activity_logs FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "system_config_all" ON public.system_config FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

-- ============================================================================
-- 8. GRANTS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ============================================================================
-- END
-- ============================================================================
