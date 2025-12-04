export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      artist_achievements: {
        Row: {
          achievement_type: string
          id: string
          metadata: Json | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          id?: string
          metadata?: Json | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      artist_activities: {
        Row: {
          actor_user_id: string | null
          artist_id: string
          comment_id: string | null
          created_at: string | null
          id: string
          track_id: string | null
          type: string
        }
        Insert: {
          actor_user_id?: string | null
          artist_id: string
          comment_id?: string | null
          created_at?: string | null
          id?: string
          track_id?: string | null
          type: string
        }
        Update: {
          actor_user_id?: string | null
          artist_id?: string
          comment_id?: string | null
          created_at?: string | null
          id?: string
          track_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_activities_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_activities_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_activities_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_activities_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_beta_access: {
        Row: {
          badge_name: string | null
          code_id: string
          code_used: string | null
          id: string
          redeemed_at: string | null
          referral_bonus_tier: string | null
          tier: string | null
          user_id: string
        }
        Insert: {
          badge_name?: string | null
          code_id: string
          code_used?: string | null
          id?: string
          redeemed_at?: string | null
          referral_bonus_tier?: string | null
          tier?: string | null
          user_id: string
        }
        Update: {
          badge_name?: string | null
          code_id?: string
          code_used?: string | null
          id?: string
          redeemed_at?: string | null
          referral_bonus_tier?: string | null
          tier?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_beta_access_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "beta_access_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_events: {
        Row: {
          artist_id: string
          created_at: string | null
          description: string | null
          end_time: string | null
          event_type: string
          id: string
          location: string | null
          start_time: string
          status: string
          ticket_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          location?: string | null
          start_time: string
          status?: string
          ticket_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          location?: string | null
          start_time?: string
          status?: string
          ticket_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_events_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_live_streams: {
        Row: {
          actual_start: string | null
          artist_id: string
          created_at: string | null
          description: string | null
          ended_at: string | null
          id: string
          is_ticketed: boolean | null
          recording_url: string | null
          scheduled_start: string | null
          status: string
          stream_type: string
          stream_url: string | null
          thumbnail_url: string | null
          ticket_price: number | null
          title: string
          updated_at: string | null
          viewer_count: number | null
        }
        Insert: {
          actual_start?: string | null
          artist_id: string
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_ticketed?: boolean | null
          recording_url?: string | null
          scheduled_start?: string | null
          status?: string
          stream_type?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          ticket_price?: number | null
          title: string
          updated_at?: string | null
          viewer_count?: number | null
        }
        Update: {
          actual_start?: string | null
          artist_id?: string
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_ticketed?: boolean | null
          recording_url?: string | null
          scheduled_start?: string | null
          status?: string
          stream_type?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          ticket_price?: number | null
          title?: string
          updated_at?: string | null
          viewer_count?: number | null
        }
        Relationships: []
      }
      artist_merch_products: {
        Row: {
          artist_id: string
          created_at: string | null
          currency: string
          description: string | null
          external_url: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          name: string
          position: number | null
          price: number
          status: string
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          currency?: string
          description?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name: string
          position?: number | null
          price: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name?: string
          position?: number | null
          price?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      artist_onboarding_progress: {
        Row: {
          created_at: string | null
          has_shared_profile: boolean | null
          has_uploaded_track: boolean | null
          has_uploaded_video: boolean | null
          id: string
          onboarding_completed: boolean | null
          onboarding_skipped: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          has_shared_profile?: boolean | null
          has_uploaded_track?: boolean | null
          has_uploaded_video?: boolean | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_skipped?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          has_shared_profile?: boolean | null
          has_uploaded_track?: boolean | null
          has_uploaded_video?: boolean | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_skipped?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      artist_payouts: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          artist_user_id: string
          created_at: string | null
          id: string
          last_payout_at: string | null
          stripe_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          artist_user_id: string
          created_at?: string | null
          id?: string
          last_payout_at?: string | null
          stripe_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          artist_user_id?: string
          created_at?: string | null
          id?: string
          last_payout_at?: string | null
          stripe_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      artist_posts: {
        Row: {
          artist_id: string
          content: string
          created_at: string | null
          id: string
          pinned: boolean | null
          title: string | null
          updated_at: string | null
          visibility: string
        }
        Insert: {
          artist_id: string
          content: string
          created_at?: string | null
          id?: string
          pinned?: boolean | null
          title?: string | null
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          artist_id?: string
          content?: string
          created_at?: string | null
          id?: string
          pinned?: boolean | null
          title?: string | null
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_posts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_profiles: {
        Row: {
          artist_name: string
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          genre: string | null
          id: string
          instagram_url: string | null
          status: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          artist_name: string
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          genre?: string | null
          id?: string
          instagram_url?: string | null
          status?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          artist_name?: string
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          genre?: string | null
          id?: string
          instagram_url?: string | null
          status?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_referral_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          user_id?: string
        }
        Relationships: []
      }
      artist_referral_uses: {
        Row: {
          id: string
          redeemed_at: string
          referral_code_id: string
          referred_user_id: string
        }
        Insert: {
          id?: string
          redeemed_at?: string
          referral_code_id: string
          referred_user_id: string
        }
        Update: {
          id?: string
          redeemed_at?: string
          referral_code_id?: string
          referred_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_referral_uses_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "artist_referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_stripe_accounts: {
        Row: {
          artist_id: string
          created_at: string | null
          details_submitted: boolean | null
          id: string
          payouts_enabled: boolean | null
          status: string | null
          stripe_account_id: string
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          details_submitted?: boolean | null
          id?: string
          payouts_enabled?: boolean | null
          status?: string | null
          stripe_account_id: string
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          details_submitted?: boolean | null
          id?: string
          payouts_enabled?: boolean | null
          status?: string | null
          stripe_account_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_stripe_accounts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: true
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_video_posts: {
        Row: {
          artist_id: string
          caption: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          is_supporter_only: boolean | null
          release_date: string | null
          required_tier: string | null
          supporter_early_access: boolean | null
          thumbnail_url: string | null
          updated_at: string | null
          video_url: string
          view_count: number | null
        }
        Insert: {
          artist_id: string
          caption?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_supporter_only?: boolean | null
          release_date?: string | null
          required_tier?: string | null
          supporter_early_access?: boolean | null
          thumbnail_url?: string | null
          updated_at?: string | null
          video_url: string
          view_count?: number | null
        }
        Update: {
          artist_id?: string
          caption?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_supporter_only?: boolean | null
          release_date?: string | null
          required_tier?: string | null
          supporter_early_access?: boolean | null
          thumbnail_url?: string | null
          updated_at?: string | null
          video_url?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_video_posts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_access_codes: {
        Row: {
          badge_name: string
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          notes: string | null
          type: string
        }
        Insert: {
          badge_name?: string
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          notes?: string | null
          type?: string
        }
        Update: {
          badge_name?: string
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          notes?: string | null
          type?: string
        }
        Relationships: []
      }
      beta_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string | null
          status: string
          user_type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name?: string | null
          status?: string
          user_type: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string | null
          status?: string
          user_type?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          artist_id: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_achievements: {
        Row: {
          achievement_key: string
          fan_user_id: string
          id: string
          meta: Json | null
          unlocked_at: string
        }
        Insert: {
          achievement_key: string
          fan_user_id: string
          id?: string
          meta?: Json | null
          unlocked_at?: string
        }
        Update: {
          achievement_key?: string
          fan_user_id?: string
          id?: string
          meta?: Json | null
          unlocked_at?: string
        }
        Relationships: []
      }
      fan_onboarding_progress: {
        Row: {
          created_at: string | null
          has_created_stack: boolean | null
          has_followed_artist: boolean | null
          has_viewed_supporter: boolean | null
          has_visited_discover: boolean | null
          has_voted_spotlight: boolean | null
          id: string
          onboarding_completed: boolean | null
          onboarding_skipped: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          has_created_stack?: boolean | null
          has_followed_artist?: boolean | null
          has_viewed_supporter?: boolean | null
          has_visited_discover?: boolean | null
          has_voted_spotlight?: boolean | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_skipped?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          has_created_stack?: boolean | null
          has_followed_artist?: boolean | null
          has_viewed_supporter?: boolean | null
          has_visited_discover?: boolean | null
          has_voted_spotlight?: boolean | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_skipped?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fan_spotlight_stats: {
        Row: {
          created_at: string | null
          current_tier: string | null
          id: string
          last_voted_at: string | null
          total_votes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_tier?: string | null
          id?: string
          last_voted_at?: string | null
          total_votes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_tier?: string | null
          id?: string
          last_voted_at?: string | null
          total_votes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fan_support_scores: {
        Row: {
          artist_id: string
          created_at: string | null
          fan_user_id: string
          id: string
          level: string
          paid_support_count: number | null
          paid_support_value: number | null
          score: number
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          fan_user_id: string
          id?: string
          level?: string
          paid_support_count?: number | null
          paid_support_value?: number | null
          score?: number
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          fan_user_id?: string
          id?: string
          level?: string
          paid_support_count?: number | null
          paid_support_value?: number | null
          score?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fan_support_scores_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_taste_profile: {
        Row: {
          created_at: string | null
          fan_user_id: string
          genres: Json | null
          id: string
          last_updated: string | null
          moods: Json | null
          top_artists: Json | null
          top_tags: Json | null
        }
        Insert: {
          created_at?: string | null
          fan_user_id: string
          genres?: Json | null
          id?: string
          last_updated?: string | null
          moods?: Json | null
          top_artists?: Json | null
          top_tags?: Json | null
        }
        Update: {
          created_at?: string | null
          fan_user_id?: string
          genres?: Json | null
          id?: string
          last_updated?: string | null
          moods?: Json | null
          top_artists?: Json | null
          top_tags?: Json | null
        }
        Relationships: []
      }
      fan_testimonials: {
        Row: {
          artist_id: string
          created_at: string
          fan_user_id: string
          id: string
          is_featured: boolean | null
          rating: number | null
          status: string | null
          testimonial_text: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          fan_user_id: string
          id?: string
          is_featured?: boolean | null
          rating?: number | null
          status?: string | null
          testimonial_text: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          fan_user_id?: string
          id?: string
          is_featured?: boolean | null
          rating?: number | null
          status?: string | null
          testimonial_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fan_testimonials_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          artist_id: string
          created_at: string | null
          fan_id: string
          id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          fan_id: string
          id?: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          fan_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_fan_id_fkey"
            columns: ["fan_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_clips: {
        Row: {
          created_at: string | null
          creator_user_id: string
          duration_seconds: number | null
          id: string
          start_time_seconds: number | null
          stream_id: string
          title: string | null
          video_url: string
        }
        Insert: {
          created_at?: string | null
          creator_user_id: string
          duration_seconds?: number | null
          id?: string
          start_time_seconds?: number | null
          stream_id: string
          title?: string | null
          video_url: string
        }
        Update: {
          created_at?: string | null
          creator_user_id?: string
          duration_seconds?: number | null
          id?: string
          start_time_seconds?: number | null
          stream_id?: string
          title?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_clips_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "artist_live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_gifts: {
        Row: {
          created_at: string | null
          gift_type: string
          id: string
          sender_user_id: string
          stream_id: string
          xp_value: number | null
        }
        Insert: {
          created_at?: string | null
          gift_type: string
          id?: string
          sender_user_id: string
          stream_id: string
          xp_value?: number | null
        }
        Update: {
          created_at?: string | null
          gift_type?: string
          id?: string
          sender_user_id?: string
          stream_id?: string
          xp_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_gifts_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "artist_live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_spotlight_votes: {
        Row: {
          created_at: string | null
          entry_id: string | null
          id: string
          stream_id: string
          voter_user_id: string
        }
        Insert: {
          created_at?: string | null
          entry_id?: string | null
          id?: string
          stream_id: string
          voter_user_id: string
        }
        Update: {
          created_at?: string | null
          entry_id?: string | null
          id?: string
          stream_id?: string
          voter_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_spotlight_votes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "spotlight_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_spotlight_votes_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "artist_live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream_chat: {
        Row: {
          created_at: string | null
          id: string
          is_artist: boolean | null
          message: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_artist?: boolean | null
          message: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_artist?: boolean | null
          message?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_chat_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "artist_live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_history: {
        Row: {
          amount: number
          artist_id: string | null
          created_at: string | null
          id: string
          method: string
          notes: string | null
          paid_at: string
          processed_by: string | null
        }
        Insert: {
          amount: number
          artist_id?: string | null
          created_at?: string | null
          id?: string
          method?: string
          notes?: string | null
          paid_at: string
          processed_by?: string | null
        }
        Update: {
          amount?: number
          artist_id?: string | null
          created_at?: string | null
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string
          processed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_history_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          added_at: string | null
          id: string
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          playlist_id: string
          position?: number
          track_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      promo_events: {
        Row: {
          artist_id: string
          created_at: string | null
          event_type: string
          id: string
          ip_hash: string | null
          promo_id: string
          user_agent: string | null
          user_id: string | null
          utm_source: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          event_type: string
          id?: string
          ip_hash?: string | null
          promo_id: string
          user_agent?: string | null
          user_id?: string | null
          utm_source?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          ip_hash?: string | null
          promo_id?: string
          user_agent?: string | null
          user_id?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_events_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_events_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promo_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_links: {
        Row: {
          artist_id: string
          campaign_name: string | null
          click_count: number | null
          content_id: string | null
          content_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          slug: string
          updated_at: string | null
          utm_source: string | null
        }
        Insert: {
          artist_id: string
          campaign_name?: string | null
          click_count?: number | null
          content_id?: string | null
          content_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          slug: string
          updated_at?: string | null
          utm_source?: string | null
        }
        Update: {
          artist_id?: string
          campaign_name?: string | null
          click_count?: number | null
          content_id?: string | null
          content_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          slug?: string
          updated_at?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_links_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spotlight_campaigns: {
        Row: {
          banner_image_url: string | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      spotlight_entries: {
        Row: {
          artist_id: string
          cached_rank: number | null
          campaign_id: string
          created_at: string | null
          description: string | null
          id: string
          status: string
          title: string | null
          total_votes: number | null
          track_id: string
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          cached_rank?: number | null
          campaign_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string
          title?: string | null
          total_votes?: number | null
          track_id: string
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          cached_rank?: number | null
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string
          title?: string | null
          total_votes?: number | null
          track_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spotlight_entries_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotlight_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "spotlight_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotlight_entries_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      spotlight_votes: {
        Row: {
          campaign_id: string
          created_at: string | null
          entry_id: string
          fan_user_id: string
          id: string
          vote_type: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          entry_id: string
          fan_user_id: string
          id?: string
          vote_type?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          entry_id?: string
          fan_user_id?: string
          id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotlight_votes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "spotlight_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotlight_votes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "spotlight_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotlight_votes_fan_user_id_fkey"
            columns: ["fan_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_tickets: {
        Row: {
          fan_user_id: string
          id: string
          price_paid: number
          purchased_at: string | null
          stream_id: string
          stripe_payment_id: string | null
        }
        Insert: {
          fan_user_id: string
          id?: string
          price_paid: number
          purchased_at?: string | null
          stream_id: string
          stripe_payment_id?: string | null
        }
        Update: {
          fan_user_id?: string
          id?: string
          price_paid?: number
          purchased_at?: string | null
          stream_id?: string
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_tickets_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "artist_live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      supporter_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          paid_at: string
          raw: Json | null
          stripe_event_id: string
          stripe_invoice_id: string | null
          subscription_id: string | null
          type: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at: string
          raw?: Json | null
          stripe_event_id: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at?: string
          raw?: Json | null
          stripe_event_id?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supporter_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "supporter_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      supporter_subscriptions: {
        Row: {
          artist_id: string
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          fan_user_id: string
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          tier_id: string | null
          total_paid: number | null
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          fan_user_id: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          tier_id?: string | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          fan_user_id?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          tier_id?: string | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supporter_subscriptions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supporter_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "supporter_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      supporter_tiers: {
        Row: {
          artist_id: string
          created_at: string | null
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          interval: string | null
          is_active: boolean | null
          name: string
          price_cents: number
          slug: string
          sort_order: number | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          interval?: string | null
          is_active?: boolean | null
          name: string
          price_cents: number
          slug: string
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          interval?: string | null
          is_active?: boolean | null
          name?: string
          price_cents?: number
          slug?: string
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supporter_tiers_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      track_collaborators: {
        Row: {
          collaborator_artist_id: string
          created_at: string
          id: string
          invited_at: string
          responded_at: string | null
          role: string | null
          status: string | null
          track_id: string
        }
        Insert: {
          collaborator_artist_id: string
          created_at?: string
          id?: string
          invited_at?: string
          responded_at?: string | null
          role?: string | null
          status?: string | null
          track_id: string
        }
        Update: {
          collaborator_artist_id?: string
          created_at?: string
          id?: string
          invited_at?: string
          responded_at?: string | null
          role?: string | null
          status?: string | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_collaborators_collaborator_artist_id_fkey"
            columns: ["collaborator_artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_collaborators_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          artist_id: string
          audio_url: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          genre: string | null
          id: string
          is_supporter_only: boolean | null
          play_count: number | null
          release_date: string | null
          required_tier: string | null
          supporter_early_access: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          audio_url: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          genre?: string | null
          id?: string
          is_supporter_only?: boolean | null
          play_count?: number | null
          release_date?: string | null
          required_tier?: string | null
          supporter_early_access?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          audio_url?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          genre?: string | null
          id?: string
          is_supporter_only?: boolean | null
          play_count?: number | null
          release_date?: string | null
          required_tier?: string | null
          supporter_early_access?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_collection_items: {
        Row: {
          added_at: string | null
          collection_id: string
          id: string
          position: number | null
          video_id: string
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          id?: string
          position?: number | null
          video_id: string
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          id?: string
          position?: number | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "video_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_collection_items_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "artist_video_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      video_collections: {
        Row: {
          artist_id: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          position: number | null
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          position?: number | null
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          position?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_collections_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "video_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      video_comments: {
        Row: {
          created_at: string | null
          id: string
          parent_comment_id: string | null
          text: string
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          text: string
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          text?: string
          updated_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "video_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "artist_video_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      video_views: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          referrer_id: string | null
          session_id: string | null
          user_id: string | null
          video_id: string
          watch_duration_seconds: number | null
          watch_segments: Json | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          referrer_id?: string | null
          session_id?: string | null
          user_id?: string | null
          video_id: string
          watch_duration_seconds?: number | null
          watch_segments?: Json | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          referrer_id?: string | null
          session_id?: string | null
          user_id?: string | null
          video_id?: string
          watch_duration_seconds?: number | null
          watch_segments?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "artist_video_posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_taste_score: {
        Args: {
          _artist_id: string
          _fan_user_id: string
          _genre: string
          _tags?: string[]
        }
        Returns: number
      }
      check_and_unlock_fan_achievements: {
        Args: { _fan_user_id: string }
        Returns: Json
      }
      generate_artist_referral_code: {
        Args: { _user_id: string }
        Returns: string
      }
      get_for_you_feed: {
        Args: { _limit?: number; _offset?: number; _user_id: string }
        Returns: {
          artist_avatar: string
          artist_id: string
          artist_name: string
          artist_user_id: string
          caption: string
          content_id: string
          content_type: string
          cover_url: string
          created_at: string
          genre: string
          media_url: string
          score: number
          spotlight_campaign_id: string
          spotlight_entry_id: string
          title: string
        }[]
      }
      get_genre_content: {
        Args: { _genre: string; _limit?: number }
        Returns: {
          artist_avatar: string
          artist_id: string
          artist_name: string
          artist_user_id: string
          content_id: string
          content_type: string
          cover_url: string
          created_at: string
          genre: string
          media_url: string
          title: string
        }[]
      }
      get_promo_link_stats: {
        Args: { _artist_id: string }
        Returns: {
          total_clicks: number
          total_follows: number
          total_spotlight_votes: number
          total_supporters: number
          total_views: number
        }[]
      }
      get_rising_artists: {
        Args: { _days?: number; _limit?: number }
        Returns: {
          artist_avatar: string
          artist_id: string
          artist_name: string
          artist_user_id: string
          created_at: string
          follower_count: number
          genre: string
          new_followers: number
          new_likes: number
          rising_score: number
          supporter_xp: number
        }[]
      }
      get_trending_content: {
        Args: { _hours?: number; _limit?: number }
        Returns: {
          artist_avatar: string
          artist_id: string
          artist_name: string
          artist_user_id: string
          content_id: string
          content_type: string
          cover_url: string
          genre: string
          likes: number
          media_url: string
          plays: number
          spotlight_votes: number
          title: string
          trending_score: number
        }[]
      }
      get_video_engagement_heatmap: {
        Args: { segment_duration?: number; video_id_param: string }
        Returns: Json
      }
      has_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_promo_click: { Args: { _promo_id: string }; Returns: undefined }
      increment_video_view_safe: {
        Args: { _user_id?: string; _video_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      redeem_beta_code: {
        Args: { _code: string; _user_id: string }
        Returns: Json
      }
      redeem_referral_code: {
        Args: { _code: string; _user_id: string }
        Returns: Json
      }
      update_taste_profile: {
        Args: {
          _artist_id: string
          _fan_user_id: string
          _interaction: string
          _track_id?: string
          _video_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "artist" | "fan"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "artist", "fan"],
    },
  },
} as const
