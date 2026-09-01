export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          email: string
          avatar_url: string | null
          role: 'USER' | 'PRO_TRADER' | 'MODERATOR' | 'ADMIN'
          bio: string | null
          win_rate: number | null
          is_verified: boolean
          status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION'
          ban_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name: string
          email: string
          avatar_url?: string | null
          role?: 'USER' | 'PRO_TRADER' | 'MODERATOR' | 'ADMIN'
          bio?: string | null
          win_rate?: number | null
          is_verified?: boolean
          status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION'
          ban_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string
          email?: string
          avatar_url?: string | null
          role?: 'USER' | 'PRO_TRADER' | 'MODERATOR' | 'ADMIN'
          bio?: string | null
          win_rate?: number | null
          is_verified?: boolean
          status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION'
          ban_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      journals: {
        Row: {
          id: string
          user_id: string
          currency: string
          monthly_start_balance: number
          trade_date: string
          trade_time: string | null
          position_type: 'BUY' | 'SELL'
          sl_pips: number
          result: 'WIN' | 'LOSS' | 'BE'
          gross_profit_loss: number
          commissions: number
          total_profit: number
          gain_percentage: number
          tradingview_url: string | null
          notes: string | null
          is_pushed: boolean
          pushed_by_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          currency: string
          monthly_start_balance: number
          trade_date: string
          trade_time?: string | null
          position_type: 'BUY' | 'SELL'
          sl_pips: number
          result: 'WIN' | 'LOSS' | 'BE'
          gross_profit_loss: number
          commissions?: number
          total_profit: number
          gain_percentage: number
          tradingview_url?: string | null
          notes?: string | null
          is_pushed?: boolean
          pushed_by_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          currency?: string
          monthly_start_balance?: number
          trade_date?: string
          trade_time?: string | null
          position_type?: 'BUY' | 'SELL'
          sl_pips?: number
          result?: 'WIN' | 'LOSS' | 'BE'
          gross_profit_loss?: number
          commissions?: number
          total_profit?: number
          gain_percentage?: number
          tradingview_url?: string | null
          notes?: string | null
          is_pushed?: boolean
          pushed_by_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      signals: {
        Row: {
          id: string
          author_id: string
          asset: string
          type: 'BUY' | 'SELL'
          status: 'ACTIVE' | 'HIT_TP' | 'HIT_SL' | 'CLOSED' | 'CANCELLED'
          timeframe: string
          year: number
          month: number
          signal_date: string
          signal_time: string
          entry_price: number
          stop_loss: number
          take_profit: number
          current_price: number | null
          sl_pips: number
          tp_pips: number
          risk_reward_ratio: number
          strategy: string | null
          notes: string | null
          tradingview_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          asset: string
          type: 'BUY' | 'SELL'
          status?: 'ACTIVE' | 'HIT_TP' | 'HIT_SL' | 'CLOSED' | 'CANCELLED'
          timeframe?: string
          year: number
          month: number
          signal_date: string
          signal_time: string
          entry_price: number
          stop_loss: number
          take_profit: number
          current_price?: number | null
          sl_pips?: number
          tp_pips?: number
          risk_reward_ratio: number
          strategy?: string | null
          notes?: string | null
          tradingview_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          asset?: string
          type?: 'BUY' | 'SELL'
          status?: 'ACTIVE' | 'HIT_TP' | 'HIT_SL' | 'CLOSED' | 'CANCELLED'
          timeframe?: string
          year?: number
          month?: number
          signal_date?: string
          signal_time?: string
          entry_price?: number
          stop_loss?: number
          take_profit?: number
          current_price?: number | null
          sl_pips?: number
          tp_pips?: number
          risk_reward_ratio?: number
          strategy?: string | null
          notes?: string | null
          tradingview_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          content: string
          post_type: 'STANDARD' | 'STEPPER' | 'THREAD'
          steps: Json | null
          media_links: Json | null
          tags: string[] | null
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          post_type?: 'STANDARD' | 'STEPPER' | 'THREAD'
          steps?: Json | null
          media_links?: Json | null
          tags?: string[] | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          content?: string
          post_type?: 'STANDARD' | 'STEPPER' | 'THREAD'
          steps?: Json | null
          media_links?: Json | null
          tags?: string[] | null
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          created_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          requester_id: string
          target_id: string
          state: 'PENDING' | 'CONNECTED' | 'REJECTED'
          has_push_access: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          target_id: string
          state?: 'PENDING' | 'CONNECTED' | 'REJECTED'
          has_push_access?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          target_id?: string
          state?: 'PENDING' | 'CONNECTED' | 'REJECTED'
          has_push_access?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
