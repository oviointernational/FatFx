import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile, UserPermissions, ActivityLog, SystemAccessConfig } from '../types/user';
import { JournalEntry, MonthCapitalConfig } from '../types/journal';
import { Signal } from '../types/signal';
import { Post, PostComment } from '../types/feed';

export const SupabaseService = {
  // ==========================================
  // 1. PROFILES & PERMISSIONS
  // ==========================================
  getProfiles: async (): Promise<UserProfile[] | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_permissions (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[SupabaseService] getProfiles error:', error);
        return null;
      }
      if (!data) return null;

      // Fetch connections to populate network graph
      const { data: connData } = await supabase.from('connections').select('*');
      const connMap: Record<string, Record<string, any>> = {};
      if (connData) {
        connData.forEach(c => {
          if (!connMap[c.requester_id]) connMap[c.requester_id] = {};
          if (!connMap[c.target_id]) connMap[c.target_id] = {};

          const targetProfile = data.find(p => p.id === c.target_id);
          const reqProfile = data.find(p => p.id === c.requester_id);

          connMap[c.requester_id][c.target_id] = {
            targetUserId: c.target_id,
            targetUsername: targetProfile?.username || 'trader',
            state: c.state === 'CONNECTED' ? 'CONNECTED' : 'PENDING_SENT',
            hasPushAccess: c.has_push_access,
            connectedAt: c.created_at
          };

          connMap[c.target_id][c.requester_id] = {
            targetUserId: c.requester_id,
            targetUsername: reqProfile?.username || 'trader',
            state: c.state === 'CONNECTED' ? 'CONNECTED' : 'PENDING_RECEIVED',
            hasPushAccess: c.has_push_access,
            connectedAt: c.created_at
          };
        });
      }

      return data.map(p => ({
        id: p.id,
        username: p.username,
        fullName: p.full_name,
        email: p.email,
        avatarUrl: p.avatar_url,
        role: p.role,
        bio: p.bio,
        winRate: p.win_rate ? Number(p.win_rate) : undefined,
        totalSignalsCount: 0,
        totalJournalsCount: 0,
        isVerified: p.is_verified,
        status: p.status,
        banReason: p.ban_reason,
        passwordHash: p.password_hash,
        joinedDate: p.created_at ? p.created_at.split('T')[0] : '2026-01-01',
        lastActiveDate: p.updated_at ? p.updated_at.split('T')[0] : undefined,
        permissions: p.user_permissions ? {
          canPublishSignals: p.user_permissions.can_publish_signals,
          canPushJournals: p.user_permissions.can_push_journals,
          canViewAllJournals: p.user_permissions.can_view_all_journals,
          canModerateSignals: p.user_permissions.can_moderate_signals,
          maxActiveSignals: p.user_permissions.max_active_signals,
        } : undefined,
        connections: connMap[p.id] || {}
      }));
    } catch (err) {
      console.error('[SupabaseService] getProfiles exception:', err);
      return null;
    }
  },

  sendConnectionRequest: async (requesterId: string, targetId: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('connections').upsert({
        requester_id: requesterId,
        target_id: targetId,
        state: 'PENDING',
        has_push_access: false,
      });
      return !error;
    } catch {
      return false;
    }
  },

  acceptConnectionRequest: async (userId1: string, userId2: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase
        .from('connections')
        .update({ state: 'CONNECTED', has_push_access: true })
        .or(`and(requester_id.eq.${userId1},target_id.eq.${userId2}),and(requester_id.eq.${userId2},target_id.eq.${userId1})`);
      return !error;
    } catch {
      return false;
    }
  },

  deleteConnection: async (userId1: string, userId2: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .or(`and(requester_id.eq.${userId1},target_id.eq.${userId2}),and(requester_id.eq.${userId2},target_id.eq.${userId1})`);
      return !error;
    } catch {
      return false;
    }
  },

  createProfile: async (profile: UserProfile): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: profile.id,
        username: profile.username,
        full_name: profile.fullName,
        email: profile.email,
        avatar_url: profile.avatarUrl,
        role: profile.role,
        bio: profile.bio || 'Forex trader on FatFx.',
        win_rate: profile.winRate || 0,
        is_verified: profile.isVerified ?? false,
        status: profile.status || 'ACTIVE',
        ban_reason: profile.banReason,
        password_hash: profile.passwordHash || profile.password,
      });

      if (profileError) {
        console.error('[SupabaseService] createProfile insert error:', profileError);
        return false;
      }

      if (profile.permissions) {
        await supabase.from('user_permissions').upsert({
          user_id: profile.id,
          can_publish_signals: profile.permissions.canPublishSignals,
          can_push_journals: profile.permissions.canPushJournals,
          can_view_all_journals: profile.permissions.canViewAllJournals,
          can_moderate_signals: profile.permissions.canModerateSignals,
          max_active_signals: profile.permissions.maxActiveSignals,
        });
      }

      return true;
    } catch (err) {
      console.error('[SupabaseService] createProfile exception:', err);
      return false;
    }
  },

  updateProfile: async (userId: string, updates: Partial<UserProfile>): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const payload: Record<string, any> = {};
      if (updates.fullName !== undefined) payload.full_name = updates.fullName;
      if (updates.role !== undefined) payload.role = updates.role;
      if (updates.bio !== undefined) payload.bio = updates.bio;
      if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
      if (updates.isVerified !== undefined) payload.is_verified = updates.isVerified;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.banReason !== undefined) payload.ban_reason = updates.banReason;
      if (updates.winRate !== undefined) payload.win_rate = updates.winRate;

      if (Object.keys(payload).length > 0) {
        const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
        if (error) {
          console.error('[SupabaseService] updateProfile error:', error);
          return false;
        }
      }

      if (updates.permissions) {
        await supabase.from('user_permissions').upsert({
          user_id: userId,
          can_publish_signals: updates.permissions.canPublishSignals,
          can_push_journals: updates.permissions.canPushJournals,
          can_view_all_journals: updates.permissions.canViewAllJournals,
          can_moderate_signals: updates.permissions.canModerateSignals,
          max_active_signals: updates.permissions.maxActiveSignals,
        });
      }
      return true;
    } catch (err) {
      console.error('[SupabaseService] updateProfile exception:', err);
      return false;
    }
  },

  deleteProfile: async (userId: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      return !error;
    } catch {
      return false;
    }
  },

  // ==========================================
  // 2. JOURNALS CRUD
  // ==========================================
  getJournals: async (): Promise<JournalEntry[] | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('journals')
        .select(`
          *,
          profiles:user_id (username),
          pushed_by:pushed_by_id (username),
          journal_push_shares (
            shared_with_id,
            shared_at:created_at,
            shared_with_user:profiles!journal_push_shares_shared_with_id_fkey(username)
          )
        `)
        .order('trade_date', { ascending: false });

      if (error || !data) return null;

      return data.map(j => ({
        id: j.id,
        userId: j.user_id,
        authorUsername: j.profiles?.username || 'trader',
        currency: j.currency,
        monthlyStartBalance: Number(j.monthly_start_balance),
        date: j.trade_date,
        time: j.trade_time || '09:00',
        positionType: j.position_type,
        slPips: Number(j.sl_pips),
        result: j.result,
        grossProfitLoss: Number(j.gross_profit_loss),
        commissions: Number(j.commissions),
        totalProfit: Number(j.total_profit),
        gainPercentage: Number(j.gain_percentage),
        tradingViewUrl: j.tradingview_url || undefined,
        notes: j.notes || undefined,
        isPushed: j.is_pushed,
        pushedBy: j.pushed_by?.username || undefined,
        pushedTo: (j.journal_push_shares || []).map((p: any) => ({
          sharedWithUsername: p.shared_with_user?.username || 'trader',
          sharedAt: p.shared_at,
          sharedByUsername: j.profiles?.username || 'trader'
        })),
        createdAt: j.created_at,
        updatedAt: j.updated_at
      }));
    } catch {
      return null;
    }
  },

  createJournal: async (journal: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('journals').insert({
        user_id: journal.userId,
        currency: journal.currency,
        monthly_start_balance: journal.monthlyStartBalance,
        trade_date: journal.date,
        trade_time: journal.time,
        position_type: journal.positionType,
        sl_pips: journal.slPips,
        result: journal.result,
        gross_profit_loss: journal.grossProfitLoss,
        commissions: journal.commissions,
        total_profit: journal.totalProfit,
        gain_percentage: journal.gainPercentage,
        tradingview_url: journal.tradingViewUrl,
        notes: journal.notes,
        is_pushed: journal.isPushed || false,
      }).select().single();

      if (error) {
        console.error('[SupabaseService] createJournal error:', error);
        return null;
      }
      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        authorUsername: journal.authorUsername,
        currency: data.currency,
        monthlyStartBalance: Number(data.monthly_start_balance),
        date: data.trade_date,
        time: data.trade_time,
        positionType: data.position_type,
        slPips: Number(data.sl_pips),
        result: data.result,
        grossProfitLoss: Number(data.gross_profit_loss),
        commissions: Number(data.commissions),
        totalProfit: Number(data.total_profit),
        gainPercentage: Number(data.gain_percentage),
        tradingViewUrl: data.tradingview_url,
        notes: data.notes,
        isPushed: data.is_pushed,
        pushedTo: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (err) {
      console.error('[SupabaseService] createJournal exception:', err);
      return null;
    }
  },

  updateJournal: async (id: string, updates: Partial<JournalEntry>): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const payload: Record<string, any> = {};
      if (updates.currency !== undefined) payload.currency = updates.currency;
      if (updates.monthlyStartBalance !== undefined) payload.monthly_start_balance = updates.monthlyStartBalance;
      if (updates.date !== undefined) payload.trade_date = updates.date;
      if (updates.time !== undefined) payload.trade_time = updates.time;
      if (updates.positionType !== undefined) payload.position_type = updates.positionType;
      if (updates.slPips !== undefined) payload.sl_pips = updates.slPips;
      if (updates.result !== undefined) payload.result = updates.result;
      if (updates.grossProfitLoss !== undefined) payload.gross_profit_loss = updates.grossProfitLoss;
      if (updates.commissions !== undefined) payload.commissions = updates.commissions;
      if (updates.totalProfit !== undefined) payload.total_profit = updates.totalProfit;
      if (updates.gainPercentage !== undefined) payload.gain_percentage = updates.gainPercentage;
      if (updates.tradingViewUrl !== undefined) payload.tradingview_url = updates.tradingViewUrl;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      const { error } = await supabase.from('journals').update(payload).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  deleteJournal: async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('journals').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  pushJournalToUser: async (journalId: string, senderId: string, recipientId: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('journal_push_shares').insert({
        journal_id: journalId,
        shared_by_id: senderId,
        shared_with_id: recipientId
      });
      return !error;
    } catch {
      return false;
    }
  },

  pushJournal: async (journalId: string, senderId: string, recipientId: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('journal_push_shares').insert({
        journal_id: journalId,
        shared_by_id: senderId,
        shared_with_id: recipientId
      });
      return !error;
    } catch {
      return false;
    }
  },

  // ==========================================
  // 3. SIGNALS CRUD
  // ==========================================
  getSignals: async (): Promise<Signal[] | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('signals')
        .select(`
          *,
          author:author_id (username)
        `)
        .order('created_at', { ascending: false });

      if (error || !data) return null;

      return data.map(s => ({
        id: s.id,
        authorId: s.author_id,
        authorUsername: s.author?.username || 'trader',
        asset: s.asset,
        type: s.type,
        status: s.status,
        timeframe: s.timeframe,
        year: s.signal_year,
        month: s.signal_month,
        date: s.signal_date,
        time: s.signal_time,
        priceLevels: {
          entryPrice: Number(s.entry_price),
          stopLoss: Number(s.stop_loss),
          takeProfit: Number(s.take_profit),
          currentPrice: s.current_price ? Number(s.current_price) : undefined,
          slPips: Number(s.sl_pips),
          tpPips: Number(s.tp_pips),
          riskRewardRatio: Number(s.risk_reward_ratio),
        },
        strategy: s.strategy || undefined,
        notes: s.notes || undefined,
        tradingViewUrl: s.tradingview_url || undefined,
        sharedWith: [],
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }));
    } catch {
      return null;
    }
  },

  createSignal: async (signal: Omit<Signal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Signal | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('signals').insert({
        author_id: signal.authorId,
        asset: signal.asset,
        type: signal.type,
        status: signal.status,
        timeframe: signal.timeframe,
        signal_year: signal.year,
        signal_month: signal.month,
        signal_date: signal.date,
        signal_time: signal.time,
        entry_price: signal.priceLevels.entryPrice,
        stop_loss: signal.priceLevels.stopLoss,
        take_profit: signal.priceLevels.takeProfit,
        current_price: signal.priceLevels.currentPrice,
        sl_pips: signal.priceLevels.slPips,
        tp_pips: signal.priceLevels.tpPips,
        risk_reward_ratio: signal.priceLevels.riskRewardRatio,
        strategy: signal.strategy,
        notes: signal.notes,
        tradingview_url: signal.tradingViewUrl,
      }).select().single();

      if (error) {
        console.error('[SupabaseService] createSignal error:', error);
        return null;
      }
      if (!data) return null;

      return {
        ...signal,
        id: data.id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (err) {
      console.error('[SupabaseService] createSignal exception:', err);
      return null;
    }
  },

  updateSignal: async (id: string, updates: Partial<Signal>): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const payload: Record<string, any> = {};
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.strategy !== undefined) payload.strategy = updates.strategy;
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.priceLevels) {
        if (updates.priceLevels.entryPrice !== undefined) payload.entry_price = updates.priceLevels.entryPrice;
        if (updates.priceLevels.stopLoss !== undefined) payload.stop_loss = updates.priceLevels.stopLoss;
        if (updates.priceLevels.takeProfit !== undefined) payload.take_profit = updates.priceLevels.takeProfit;
        if (updates.priceLevels.currentPrice !== undefined) payload.current_price = updates.priceLevels.currentPrice;
        if (updates.priceLevels.slPips !== undefined) payload.sl_pips = updates.priceLevels.slPips;
        if (updates.priceLevels.tpPips !== undefined) payload.tp_pips = updates.priceLevels.tpPips;
        if (updates.priceLevels.riskRewardRatio !== undefined) payload.risk_reward_ratio = updates.priceLevels.riskRewardRatio;
      }

      const { error } = await supabase.from('signals').update(payload).eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  deleteSignal: async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('signals').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // ==========================================
  // 4. POSTS & FEEDS CRUD
  // ==========================================
  getPosts: async (): Promise<Post[] | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:author_id (
            username,
            full_name,
            avatar_url,
            role,
            is_verified
          ),
          post_likes (user_id),
          post_comments (
            id,
            author_id,
            content,
            created_at,
            author:author_id (username, full_name, avatar_url, role)
          )
        `)
        .order('created_at', { ascending: false });

      if (error || !data) return null;

      return data.map(p => ({
        id: p.id,
        authorId: p.author_id,
        authorUsername: p.author?.username || 'trader',
        authorFullName: p.author?.full_name || 'Trader',
        authorAvatarUrl: p.author?.avatar_url,
        authorRole: p.author?.role || 'USER',
        isAuthorVerified: p.author?.is_verified,
        content: p.content,
        postType: p.post_type,
        steps: p.steps || undefined,
        mediaLinks: p.media_links || undefined,
        tags: p.tags || undefined,
        likes: (p.post_likes || []).map((l: any) => l.user_id),
        comments: (p.post_comments || []).map((c: any) => ({
          id: c.id,
          postId: p.id,
          authorId: c.author_id,
          authorUsername: c.author?.username || 'trader',
          authorFullName: c.author?.full_name || 'Trader',
          authorAvatarUrl: c.author?.avatar_url,
          authorRole: c.author?.role,
          content: c.content,
          createdAt: c.created_at
        })),
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    } catch {
      return null;
    }
  },

  createPost: async (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt' | 'updatedAt'>): Promise<Post | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('posts').insert({
        author_id: post.authorId,
        content: post.content,
        post_type: post.postType,
        steps: post.steps || null,
        media_links: post.mediaLinks || null,
        tags: post.tags || null,
      }).select().single();

      if (error) {
        console.error('[SupabaseService] createPost error:', error);
        return null;
      }
      if (!data) return null;

      return {
        ...post,
        id: data.id,
        likes: [],
        comments: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (err) {
      console.error('[SupabaseService] createPost exception:', err);
      return null;
    }
  },

  deletePost: async (postId: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      return !error;
    } catch {
      return false;
    }
  },

  togglePostLike: async (postId: string, userId: string, isCurrentlyLiked: boolean): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase.from('post_likes').delete().match({ post_id: postId, user_id: userId });
        return !error;
      } else {
        const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
        return !error;
      }
    } catch {
      return false;
    }
  },

  createPostComment: async (postId: string, authorId: string, content: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('post_comments').insert({
        post_id: postId,
        author_id: authorId,
        content,
      });
      return !error;
    } catch {
      return false;
    }
  },

  // ==========================================
  // 5. SYSTEM CONFIG & MENU CONTROLS
  // ==========================================
  getSystemConfig: async (): Promise<SystemAccessConfig | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('system_config').select('*').eq('id', 1).single();
      if (error || !data) return null;

      return {
        isJournalEnabled: data.is_journal_enabled ?? true,
        isSignalsEnabled: data.is_signals_enabled ?? true,
        isFeedsEnabled: data.is_feeds_enabled ?? true,
        isUsersEnabled: data.is_users_enabled ?? true,
        requireSignalApproval: data.require_signal_approval ?? false,
        allowPublicRegistration: data.allow_public_registration ?? true,
        allowPushSharing: data.allow_push_sharing ?? true,
        allowProTraderSignalsOnly: data.allow_pro_trader_signals_only ?? false,
        maintenanceMode: data.maintenance_mode ?? false,
        defaultMonthlyCapital: Number(data.default_monthly_capital || 10000),
      };
    } catch {
      return null;
    }
  },

  updateSystemConfig: async (updates: Partial<SystemAccessConfig>): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    try {
      const payload: Record<string, any> = {};
      if (updates.isJournalEnabled !== undefined) payload.is_journal_enabled = updates.isJournalEnabled;
      if (updates.isSignalsEnabled !== undefined) payload.is_signals_enabled = updates.isSignalsEnabled;
      if (updates.isFeedsEnabled !== undefined) payload.is_feeds_enabled = updates.isFeedsEnabled;
      if (updates.isUsersEnabled !== undefined) payload.is_users_enabled = updates.isUsersEnabled;
      if (updates.requireSignalApproval !== undefined) payload.require_signal_approval = updates.requireSignalApproval;
      if (updates.allowPublicRegistration !== undefined) payload.allow_public_registration = updates.allowPublicRegistration;
      if (updates.allowPushSharing !== undefined) payload.allow_push_sharing = updates.allowPushSharing;
      if (updates.allowProTraderSignalsOnly !== undefined) payload.allow_pro_trader_signals_only = updates.allowProTraderSignalsOnly;
      if (updates.maintenanceMode !== undefined) payload.maintenance_mode = updates.maintenanceMode;
      if (updates.defaultMonthlyCapital !== undefined) payload.default_monthly_capital = updates.defaultMonthlyCapital;

      const { error } = await supabase.from('system_config').upsert({ id: 1, ...payload });
      return !error;
    } catch {
      return false;
    }
  },

  // ==========================================
  // 6. ACTIVITY AUDIT LOGS
  // ==========================================
  getActivityLogs: async (): Promise<ActivityLog[] | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
      if (error || !data) return null;

      return data.map(l => ({
        id: l.id,
        actorUsername: l.actor_username,
        action: l.action,
        target: l.target,
        details: l.details,
        severity: l.severity,
        timestamp: l.created_at,
      }));
    } catch {
      return null;
    }
  },

  createActivityLog: async (log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('activity_logs').insert({
        actor_username: log.actorUsername,
        action: log.action,
        target: log.target,
        details: log.details,
        severity: log.severity,
      });
    } catch {
      // Ignore background log errors
    }
  }
};
