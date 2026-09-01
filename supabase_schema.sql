-- ============================================================================
-- FATFX — SUPABASE PRODUCTION DATABASE SCHEMA & ACCESS CONTROL (RLS)
-- ============================================================================
-- Fully-compliant PostgreSQL / Supabase Schema for FatFx Forex & Crypto Terminal
-- Clean Production Database: Zero dummy data, full CRUD, dynamic menu access control,
-- Row Level Security (RLS), RBAC permissions, and automated triggers.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'PRO_TRADER', 'MODERATOR', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE position_type AS ENUM ('BUY', 'SELL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE trade_result AS ENUM ('WIN', 'LOSS', 'BE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE signal_status AS ENUM ('ACTIVE', 'HIT_TP', 'HIT_SL', 'CLOSED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE connection_state AS ENUM ('PENDING', 'CONNECTED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE log_severity AS ENUM ('INFO', 'WARNING', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE post_type AS ENUM ('STANDARD', 'STEPPER', 'THREAD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- PROFILES (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    role user_role DEFAULT 'USER' NOT NULL,
    bio TEXT DEFAULT 'Forex trader on FatFx.',
    win_rate NUMERIC(5,2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    status account_status DEFAULT 'ACTIVE' NOT NULL,
    ban_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- USER PERMISSIONS (Granular RBAC Matrix)
CREATE TABLE IF NOT EXISTS public.user_permissions (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    can_publish_signals BOOLEAN DEFAULT TRUE NOT NULL,
    can_push_journals BOOLEAN DEFAULT TRUE NOT NULL,
    can_view_all_journals BOOLEAN DEFAULT FALSE NOT NULL,
    can_moderate_signals BOOLEAN DEFAULT FALSE NOT NULL,
    max_active_signals INTEGER DEFAULT 5 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- USER CONNECTIONS (Peer-to-Peer network)
CREATE TABLE IF NOT EXISTS public.connections (
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

-- TRADING JOURNALS
CREATE TABLE IF NOT EXISTS public.journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency TEXT NOT NULL,                         -- e.g. "XAUUSD", "EURUSD"
    monthly_start_balance NUMERIC(12,2) NOT NULL,   -- Capital
    trade_date DATE NOT NULL,                      -- YYYY-MM-DD
    trade_time TIME,                               -- HH:mm
    position_type position_type NOT NULL,          -- BUY / SELL
    sl_pips NUMERIC(8,2) NOT NULL,                 -- Stop Loss in Pips
    result trade_result NOT NULL,                  -- WIN / LOSS / BE
    gross_profit_loss NUMERIC(12,2) NOT NULL,      -- Gross Profit/Loss ($)
    commissions NUMERIC(10,2) DEFAULT 0.00 NOT NULL,-- Commissions ($)
    total_profit NUMERIC(12,2) NOT NULL,           -- Total Net Profit ($)
    gain_percentage NUMERIC(8,4) NOT NULL,         -- Gain %
    tradingview_url TEXT,                          -- TradingView chart URL
    notes TEXT,                                    -- Strategy / Trade narrative
    is_pushed BOOLEAN DEFAULT FALSE NOT NULL,       -- Received via Push
    pushed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- JOURNAL PUSH SHARES (Direct peer sharing)
CREATE TABLE IF NOT EXISTS public.journal_push_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
    shared_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shared_with_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_journal_push_share UNIQUE (journal_id, shared_with_id)
);

-- TRADING SIGNALS
CREATE TABLE IF NOT EXISTS public.signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset TEXT NOT NULL,                           -- e.g. "XAUUSD", "EURUSD"
    type position_type NOT NULL,                   -- BUY (Long) / SELL (Short)
    status signal_status DEFAULT 'ACTIVE' NOT NULL,
    timeframe TEXT DEFAULT '15M' NOT NULL,         -- e.g. "15M", "1H", "4H"
    year INTEGER NOT NULL,                         -- e.g. 2026
    month INTEGER NOT NULL,                        -- 0-11 (Jan=0, Dec=11)
    signal_date DATE NOT NULL,
    signal_time TIME NOT NULL,
    entry_price NUMERIC(12,5) NOT NULL,            -- Point where red meets green
    stop_loss NUMERIC(12,5) NOT NULL,              -- Bottom of long / top of short
    take_profit NUMERIC(12,5) NOT NULL,            -- End of green box
    current_price NUMERIC(12,5),
    sl_pips NUMERIC(8,2) DEFAULT 0.00,
    tp_pips NUMERIC(8,2) DEFAULT 0.00,
    risk_reward_ratio NUMERIC(5,2) NOT NULL,       -- e.g. 3.0 (1:3.0)
    strategy TEXT,                                 -- e.g. "ICT FVG + OB Sweep"
    notes TEXT,
    tradingview_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- SIGNAL SHARES (Peer signal broadcasts)
CREATE TABLE IF NOT EXISTS public.signal_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
    shared_with_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_signal_share UNIQUE (signal_id, shared_with_id)
);

-- FEEDS & POSTS (Textfield, Stepper, Multi-textbox with '+', and Media Link Embeds)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    post_type post_type DEFAULT 'STANDARD' NOT NULL,
    steps JSONB,                                   -- Array of steps for Stepper mode
    media_links JSONB,                             -- Attached images, videos, chart links
    tags TEXT[],                                   -- Tags e.g. ARRAY['#XAUUSD', '#ICT']
    likes_count INTEGER DEFAULT 0 NOT NULL,
    comments_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- POST LIKES
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_post_like UNIQUE (post_id, user_id)
);

-- POST COMMENTS
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- MONTH CAPITAL CONFIGURATION
CREATE TABLE IF NOT EXISTS public.month_capital_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,                        -- 0-11
    capital NUMERIC(12,2) DEFAULT 10000.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_month_capital UNIQUE (user_id, year, month)
);

-- AUDIT ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_username TEXT NOT NULL,
    action TEXT NOT NULL,                          -- e.g. "ROLE_UPDATED", "SIGNAL_APPROVED"
    target TEXT,
    details TEXT NOT NULL,
    severity log_severity DEFAULT 'INFO' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- GLOBAL SYSTEM ACCESS CONFIGURATION & MENU CONTROL
CREATE TABLE IF NOT EXISTS public.system_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    -- Menu Enable / Disable Toggles
    is_journal_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    is_signals_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    is_feeds_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    is_users_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    -- Global Platform Feature Flags
    require_signal_approval BOOLEAN DEFAULT FALSE NOT NULL,
    allow_public_registration BOOLEAN DEFAULT TRUE NOT NULL,
    allow_push_sharing BOOLEAN DEFAULT TRUE NOT NULL,
    allow_pro_trader_signals_only BOOLEAN DEFAULT FALSE NOT NULL,
    maintenance_mode BOOLEAN DEFAULT FALSE NOT NULL,
    default_monthly_capital NUMERIC(12,2) DEFAULT 10000.00 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT single_row_system_config CHECK (id = 1)
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON public.journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_date ON public.journals(trade_date);
CREATE INDEX IF NOT EXISTS idx_signals_year_month ON public.signals(year, month);
CREATE INDEX IF NOT EXISTS idx_signals_author ON public.signals(author_id);
CREATE INDEX IF NOT EXISTS idx_signals_status ON public.signals(status);
CREATE INDEX IF NOT EXISTS idx_connections_users ON public.connections(requester_id, target_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- ============================================================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Automatically create profile and permissions on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    clean_username TEXT;
    user_role_val user_role := 'USER';
BEGIN
    clean_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        SPLIT_PART(NEW.email, '@', 1)
    );

    -- If first user in database, elevate to ADMIN automatically
    IF NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN
        user_role_val := 'ADMIN';
    END IF;

    INSERT INTO public.profiles (
        id, username, full_name, email, avatar_url, role, is_verified, status
    ) VALUES (
        NEW.id,
        clean_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', clean_username),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
        user_role_val,
        (user_role_val = 'ADMIN'),
        'ACTIVE'
    );

    INSERT INTO public.user_permissions (
        user_id, can_publish_signals, can_push_journals, can_view_all_journals, can_moderate_signals, max_active_signals
    ) VALUES (
        NEW.id,
        TRUE,
        TRUE,
        (user_role_val = 'ADMIN'),
        (user_role_val = 'ADMIN'),
        CASE WHEN user_role_val = 'ADMIN' THEN 999 ELSE 5 END
    );

    INSERT INTO public.activity_logs (
        actor_id, actor_username, action, target, details, severity
    ) VALUES (
        NEW.id,
        clean_username,
        'USER_CREATED',
        clean_username,
        'User account registered successfully.',
        'INFO'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Automatic updated_at timestamp refresher
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_connections_updated_at ON public.connections;
CREATE TRIGGER set_connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_journals_updated_at ON public.journals;
CREATE TRIGGER set_journals_updated_at BEFORE UPDATE ON public.journals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_signals_updated_at ON public.signals;
CREATE TRIGGER set_signals_updated_at BEFORE UPDATE ON public.signals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_posts_updated_at ON public.posts;
CREATE TRIGGER set_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_month_capital_updated_at ON public.month_capital_configs;
CREATE TRIGGER set_month_capital_updated_at BEFORE UPDATE ON public.month_capital_configs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_system_config_updated_at ON public.system_config;
CREATE TRIGGER set_system_config_updated_at BEFORE UPDATE ON public.system_config FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
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

-- Helper function: Check if current authenticated user is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated, anon
    USING (TRUE);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can delete profiles"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- USER PERMISSIONS POLICIES
CREATE POLICY "Users can view their own permissions, admins view all"
    ON public.user_permissions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can modify permissions"
    ON public.user_permissions FOR ALL
    TO authenticated
    USING (public.is_admin());

-- CONNECTIONS POLICIES
CREATE POLICY "Users can view connections they are part of, admins view all"
    ON public.connections FOR SELECT
    TO authenticated
    USING (auth.uid() = requester_id OR auth.uid() = target_id OR public.is_admin());

CREATE POLICY "Users can create connection requests"
    ON public.connections FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Participants can update connection state"
    ON public.connections FOR UPDATE
    TO authenticated
    USING (auth.uid() = requester_id OR auth.uid() = target_id OR public.is_admin());

CREATE POLICY "Participants can delete connection"
    ON public.connections FOR DELETE
    TO authenticated
    USING (auth.uid() = requester_id OR auth.uid() = target_id OR public.is_admin());

-- JOURNALS POLICIES (Private by default, shared via Push or approved Connection)
CREATE POLICY "Users can view their own journals, pushed journals, and approved connection journals"
    ON public.journals FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.journal_push_shares
            WHERE journal_id = journals.id AND shared_with_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.connections
            WHERE state = 'CONNECTED' AND has_push_access = TRUE
              AND ((requester_id = auth.uid() AND target_id = journals.user_id)
                OR (target_id = auth.uid() AND requester_id = journals.user_id))
        )
    );

CREATE POLICY "Users can insert their own journals"
    ON public.journals FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journals"
    ON public.journals FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete their own journals, admins can delete any"
    ON public.journals FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

-- JOURNAL PUSH SHARES POLICIES
CREATE POLICY "Users can view push shares they sent or received"
    ON public.journal_push_shares FOR SELECT
    TO authenticated
    USING (auth.uid() = shared_by_id OR auth.uid() = shared_with_id OR public.is_admin());

CREATE POLICY "Users can insert push shares"
    ON public.journal_push_shares FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = shared_by_id);

-- POSTS & FEEDS POLICIES
CREATE POLICY "Posts are viewable by connected users or public if pro trader"
    ON public.posts FOR SELECT
    TO authenticated, anon
    USING (
        auth.uid() = author_id
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = posts.author_id AND role IN ('PRO_TRADER', 'ADMIN', 'MODERATOR')
        )
        OR EXISTS (
            SELECT 1 FROM public.connections
            WHERE state = 'CONNECTED'
              AND ((requester_id = auth.uid() AND target_id = posts.author_id)
                OR (target_id = auth.uid() AND requester_id = posts.author_id))
        )
    );

CREATE POLICY "Users can create posts"
    ON public.posts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and admins can update posts"
    ON public.posts FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id OR public.is_admin());

CREATE POLICY "Authors and admins can delete posts"
    ON public.posts FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id OR public.is_admin());

-- POST LIKES POLICIES
CREATE POLICY "Likes are viewable by all authenticated users"
    ON public.post_likes FOR SELECT
    TO authenticated, anon
    USING (TRUE);

CREATE POLICY "Users can like posts"
    ON public.post_likes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
    ON public.post_likes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- POST COMMENTS POLICIES
CREATE POLICY "Comments are viewable by authenticated users"
    ON public.post_comments FOR SELECT
    TO authenticated, anon
    USING (TRUE);

CREATE POLICY "Users can comment on posts"
    ON public.post_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete comments"
    ON public.post_comments FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id OR public.is_admin());

-- SIGNALS POLICIES
CREATE POLICY "Signals are viewable by all users"
    ON public.signals FOR SELECT
    TO authenticated, anon
    USING (TRUE);

CREATE POLICY "Traders with permissions can create signals"
    ON public.signals FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (
            SELECT 1 FROM public.user_permissions
            WHERE user_id = auth.uid() AND can_publish_signals = TRUE
        )
    );

CREATE POLICY "Authors and moderators/admins can update signals"
    ON public.signals FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = author_id
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('ADMIN', 'MODERATOR')
        )
    );

CREATE POLICY "Authors and admins can delete signals"
    ON public.signals FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id OR public.is_admin());

-- MONTH CAPITAL CONFIGS POLICIES
CREATE POLICY "Users can CRUD their month capital configs"
    ON public.month_capital_configs FOR ALL
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ACTIVITY LOGS POLICIES
CREATE POLICY "Admins can view all activity logs"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "System and users can insert activity logs"
    ON public.activity_logs FOR INSERT
    TO authenticated, anon
    WITH CHECK (TRUE);

-- SYSTEM CONFIG POLICIES
CREATE POLICY "System config is viewable by all users"
    ON public.system_config FOR SELECT
    TO authenticated, anon
    USING (TRUE);

CREATE POLICY "Only admins can update system config"
    ON public.system_config FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- ============================================================================
-- 7. INITIAL PRODUCTION SINGLETON CONFIGURATION
-- ============================================================================
INSERT INTO public.system_config (
    id,
    is_journal_enabled,
    is_signals_enabled,
    is_feeds_enabled,
    is_users_enabled,
    require_signal_approval,
    allow_public_registration,
    allow_push_sharing,
    allow_pro_trader_signals_only,
    maintenance_mode,
    default_monthly_capital
)
VALUES (1, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, FALSE, FALSE, 10000.00)
ON CONFLICT (id) DO UPDATE SET
    updated_at = TIMEZONE('utc'::text, NOW());

-- ============================================================================
-- SCHEMA SETUP COMPLETE
-- ============================================================================
