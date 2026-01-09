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
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      albums: {
        Row: {
          artist_id: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          release_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          release_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          release_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "albums_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
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
            foreignKeyName: "artist_activities_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          code_id: string | null
          code_used: string | null
          id: string
          redeemed_at: string | null
          referral_bonus_tier: string | null
          tier: string | null
          user_id: string
        }
        Insert: {
          badge_name?: string | null
          code_id?: string | null
          code_used?: string | null
          id?: string
          redeemed_at?: string | null
          referral_bonus_tier?: string | null
          tier?: string | null
          user_id: string
        }
        Update: {
          badge_name?: string | null
          code_id?: string | null
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
          community_id: string | null
          content: string
          created_at: string | null
          id: string
          media_urls: Json | null
          pinned: boolean | null
          tier_required: string | null
          title: string | null
          updated_at: string | null
          visibility: string
        }
        Insert: {
          artist_id: string
          community_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          media_urls?: Json | null
          pinned?: boolean | null
          tier_required?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          artist_id?: string
          community_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          media_urls?: Json | null
          pinned?: boolean | null
          tier_required?: string | null
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
          {
            foreignKeyName: "artist_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_presskit_media: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          presskit_id: string
          sort_order: number | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          presskit_id: string
          sort_order?: number | null
          type: string
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          presskit_id?: string
          sort_order?: number | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_presskit_media_presskit_id_fkey"
            columns: ["presskit_id"]
            isOneToOne: false
            referencedRelation: "artist_presskits"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_presskits: {
        Row: {
          achievements_highlights: string | null
          artist_id: string
          availability_notes: string | null
          available_for: string[] | null
          bio_long: string | null
          bio_short: string | null
          brand_tags: string[] | null
          contact_email: string | null
          created_at: string | null
          experience_level: string | null
          id: string
          is_default: boolean | null
          location: string | null
          previous_collabs: string | null
          slug: string
          tagline: string | null
          tech_info: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          achievements_highlights?: string | null
          artist_id: string
          availability_notes?: string | null
          available_for?: string[] | null
          bio_long?: string | null
          bio_short?: string | null
          brand_tags?: string[] | null
          contact_email?: string | null
          created_at?: string | null
          experience_level?: string | null
          id?: string
          is_default?: boolean | null
          location?: string | null
          previous_collabs?: string | null
          slug: string
          tagline?: string | null
          tech_info?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          achievements_highlights?: string | null
          artist_id?: string
          availability_notes?: string | null
          available_for?: string[] | null
          bio_long?: string | null
          bio_short?: string | null
          brand_tags?: string[] | null
          contact_email?: string | null
          created_at?: string | null
          experience_level?: string | null
          id?: string
          is_default?: boolean | null
          location?: string | null
          previous_collabs?: string | null
          slug?: string
          tagline?: string | null
          tech_info?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_presskits_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_pricing_overrides: {
        Row: {
          artist_id: string
          created_at: string | null
          discount_percent: number | null
          expires_at: string | null
          granted_by: string | null
          id: string
          reason: string
          scope: Database["public"]["Enums"]["discount_scope"]
          starts_at: string | null
          status: Database["public"]["Enums"]["pricing_status"]
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          reason: string
          scope?: Database["public"]["Enums"]["discount_scope"]
          starts_at?: string | null
          status?: Database["public"]["Enums"]["pricing_status"]
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          reason?: string
          scope?: Database["public"]["Enums"]["discount_scope"]
          starts_at?: string | null
          status?: Database["public"]["Enums"]["pricing_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_pricing_overrides_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: true
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_profiles: {
        Row: {
          artist_name: string
          avatar_url: string | null
          banner_crop_data: Json | null
          banner_crop_data_mobile: Json | null
          banner_media_type: string | null
          banner_media_type_mobile: string | null
          banner_position_y: number | null
          banner_url: string | null
          banner_url_mobile: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          genre: string | null
          id: string
          instagram_url: string | null
          profile_theme: string | null
          show_name_on_banner: boolean | null
          status: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          user_id: string
          video_autoplay_enabled: boolean | null
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          artist_name: string
          avatar_url?: string | null
          banner_crop_data?: Json | null
          banner_crop_data_mobile?: Json | null
          banner_media_type?: string | null
          banner_media_type_mobile?: string | null
          banner_position_y?: number | null
          banner_url?: string | null
          banner_url_mobile?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          genre?: string | null
          id?: string
          instagram_url?: string | null
          profile_theme?: string | null
          show_name_on_banner?: boolean | null
          status?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id: string
          video_autoplay_enabled?: boolean | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          artist_name?: string
          avatar_url?: string | null
          banner_crop_data?: Json | null
          banner_crop_data_mobile?: Json | null
          banner_media_type?: string | null
          banner_media_type_mobile?: string | null
          banner_position_y?: number | null
          banner_url?: string | null
          banner_url_mobile?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          genre?: string | null
          id?: string
          instagram_url?: string | null
          profile_theme?: string | null
          show_name_on_banner?: boolean | null
          status?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id?: string
          video_autoplay_enabled?: boolean | null
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
          {
            foreignKeyName: "artist_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
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
      artist_shoutouts: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          message: string | null
          shoutout_type: string
          supporter_ids: string[] | null
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          message?: string | null
          shoutout_type?: string
          supporter_ids?: string[] | null
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          message?: string | null
          shoutout_type?: string
          supporter_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_shoutouts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_spotlight_media: {
        Row: {
          artist_id: string
          created_at: string | null
          display_duration_seconds: number | null
          display_order: number
          end_date: string | null
          id: string
          is_active: boolean | null
          link_label: string | null
          link_platform: string | null
          link_type: string | null
          link_url: string | null
          media_type: string
          media_url: string
          start_date: string | null
          template_data: Json | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          display_duration_seconds?: number | null
          display_order?: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          link_label?: string | null
          link_platform?: string | null
          link_type?: string | null
          link_url?: string | null
          media_type: string
          media_url: string
          start_date?: string | null
          template_data?: Json | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          display_duration_seconds?: number | null
          display_order?: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          link_label?: string | null
          link_platform?: string | null
          link_type?: string | null
          link_url?: string | null
          media_type?: string
          media_url?: string
          start_date?: string | null
          template_data?: Json | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_spotlight_media_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_spotlight_media_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "spotlight_templates"
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
      artist_verifications: {
        Row: {
          created_at: string | null
          documents_url: string[] | null
          id: string
          rejection_reason: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
          verification_type: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          documents_url?: string[] | null
          id?: string
          rejection_reason?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
          verification_type?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          documents_url?: string[] | null
          id?: string
          rejection_reason?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
          verification_type?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      artist_video_posts: {
        Row: {
          artist_id: string
          caption: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          is_supporter_only: boolean | null
          mood: string | null
          release_date: string | null
          required_tier: string | null
          status: string | null
          supporter_early_access: boolean | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          upload_batch_id: string | null
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
          mood?: string | null
          release_date?: string | null
          required_tier?: string | null
          status?: string | null
          supporter_early_access?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          upload_batch_id?: string | null
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
          mood?: string | null
          release_date?: string | null
          required_tier?: string | null
          status?: string | null
          supporter_early_access?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          upload_batch_id?: string | null
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
      auth_email_events: {
        Row: {
          correlation_id: string
          created_at: string
          email_hash: string
          error_code: string | null
          event: string
          id: string
          locale: string
          provider: string
          provider_message_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          correlation_id: string
          created_at?: string
          email_hash: string
          error_code?: string | null
          event: string
          id?: string
          locale?: string
          provider?: string
          provider_message_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          correlation_id?: string
          created_at?: string
          email_hash?: string
          error_code?: string | null
          event?: string
          id?: string
          locale?: string
          provider?: string
          provider_message_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
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
      beta_invites: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          email: string
          id: string
          last_error: string | null
          redeemed_at: string | null
          replaced_at: string | null
          replaced_by: string | null
          role: string
          sent_at: string | null
          status: string
          waitlist_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          last_error?: string | null
          redeemed_at?: string | null
          replaced_at?: string | null
          replaced_by?: string | null
          role: string
          sent_at?: string | null
          status?: string
          waitlist_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          last_error?: string | null
          redeemed_at?: string | null
          replaced_at?: string | null
          replaced_by?: string | null
          role?: string
          sent_at?: string | null
          status?: string
          waitlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_invites_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "beta_waitlist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_beta_invites_replaced_by"
            columns: ["replaced_by"]
            isOneToOne: false
            referencedRelation: "beta_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_at: string | null
          invited_by: string | null
          message: string | null
          name: string | null
          status: string
          user_type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          message?: string | null
          name?: string | null
          status?: string
          user_type: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          message?: string | null
          name?: string | null
          status?: string
          user_type?: string
        }
        Relationships: []
      }
      boost_tokens: {
        Row: {
          created_at: string
          id: string
          last_reset_at: string
          tokens_available: number
          tokens_used_this_week: number
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reset_at?: string
          tokens_available?: number
          tokens_used_this_week?: number
          user_id: string
          week_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reset_at?: string
          tokens_available?: number
          tokens_used_this_week?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      boost_usage: {
        Row: {
          artist_id: string
          boost_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          artist_id: string
          boost_type?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          artist_id?: string
          boost_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boost_usage_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_applications: {
        Row: {
          admin_notes: string | null
          budget_range: string | null
          campaign_goals: string | null
          company_name: string
          company_type: string
          contact_person: string
          created_at: string
          email: string
          id: string
          intended_use: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_genres: string[] | null
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          budget_range?: string | null
          campaign_goals?: string | null
          company_name: string
          company_type: string
          contact_person: string
          created_at?: string
          email: string
          id?: string
          intended_use?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_genres?: string[] | null
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          budget_range?: string | null
          campaign_goals?: string | null
          company_name?: string
          company_type?: string
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          intended_use?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_genres?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      brand_messages: {
        Row: {
          application_id: string | null
          artist_id: string | null
          collab_entity_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          recipient_user_id: string
          sender_user_id: string
          subject: string | null
        }
        Insert: {
          application_id?: string | null
          artist_id?: string | null
          collab_entity_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          recipient_user_id: string
          sender_user_id: string
          subject?: string | null
        }
        Update: {
          application_id?: string | null
          artist_id?: string | null
          collab_entity_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          recipient_user_id?: string
          sender_user_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "collab_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_messages_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_messages_collab_entity_id_fkey"
            columns: ["collab_entity_id"]
            isOneToOne: false
            referencedRelation: "collab_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      changelog_subscriptions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          unsubscribe_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          unsubscribe_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          unsubscribe_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "changelog_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "changelog_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_applications: {
        Row: {
          artist_id: string
          created_at: string | null
          id: string
          match_score: number | null
          message: string | null
          opportunity_id: string
          presskit_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          match_score?: number | null
          message?: string | null
          opportunity_id: string
          presskit_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          match_score?: number | null
          message?: string | null
          opportunity_id?: string
          presskit_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collab_applications_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "collab_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_applications_presskit_id_fkey"
            columns: ["presskit_id"]
            isOneToOne: false
            referencedRelation: "artist_presskits"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_entities: {
        Row: {
          avoid_categories: string | null
          brand_values: string | null
          budget_range: string | null
          collab_types: string[] | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          location: string | null
          logo_url: string | null
          mission: string | null
          name: string
          slug: string
          social_links: Json | null
          style_tags: string[] | null
          type: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avoid_categories?: string | null
          brand_values?: string | null
          budget_range?: string | null
          collab_types?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          logo_url?: string | null
          mission?: string | null
          name: string
          slug: string
          social_links?: Json | null
          style_tags?: string[] | null
          type: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avoid_categories?: string | null
          brand_values?: string | null
          budget_range?: string | null
          collab_types?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          logo_url?: string | null
          mission?: string | null
          name?: string
          slug?: string
          social_links?: Json | null
          style_tags?: string[] | null
          type?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      collab_entity_admins: {
        Row: {
          collab_entity_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          collab_entity_id: string
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          collab_entity_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_entity_admins_collab_entity_id_fkey"
            columns: ["collab_entity_id"]
            isOneToOne: false
            referencedRelation: "collab_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_interest: {
        Row: {
          artist_id: string
          collab_entity_id: string
          created_at: string | null
          id: string
          note: string | null
          source: string
          status: string
        }
        Insert: {
          artist_id: string
          collab_entity_id: string
          created_at?: string | null
          id?: string
          note?: string | null
          source?: string
          status?: string
        }
        Update: {
          artist_id?: string
          collab_entity_id?: string
          created_at?: string | null
          id?: string
          note?: string | null
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_interest_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_interest_collab_entity_id_fkey"
            columns: ["collab_entity_id"]
            isOneToOne: false
            referencedRelation: "collab_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_opportunities: {
        Row: {
          application_deadline: string | null
          budget_range: string | null
          collab_entity_id: string
          created_at: string | null
          description: string | null
          genres: string[] | null
          id: string
          is_active: boolean | null
          location: string | null
          min_supporters: number | null
          min_xp_level: string | null
          remote_ok: boolean | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          application_deadline?: string | null
          budget_range?: string | null
          collab_entity_id: string
          created_at?: string | null
          description?: string | null
          genres?: string[] | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          min_supporters?: number | null
          min_xp_level?: string | null
          remote_ok?: boolean | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          application_deadline?: string | null
          budget_range?: string | null
          collab_entity_id?: string
          created_at?: string | null
          description?: string | null
          genres?: string[] | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          min_supporters?: number | null
          min_xp_level?: string | null
          remote_ok?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collab_opportunities_collab_entity_id_fkey"
            columns: ["collab_entity_id"]
            isOneToOne: false
            referencedRelation: "collab_entities"
            referencedColumns: ["id"]
          },
        ]
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
          is_hidden: boolean | null
          is_pinned: boolean | null
          parent_comment_id: string | null
          reported_at: string | null
          reported_by: string | null
          text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          parent_comment_id?: string | null
          reported_at?: string | null
          reported_by?: string | null
          text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          parent_comment_id?: string | null
          reported_at?: string | null
          reported_by?: string | null
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
      communities: {
        Row: {
          about_content: string | null
          about_links: Json | null
          about_mission: string | null
          artist_id: string
          banner_media_type: string | null
          banner_media_url: string | null
          banner_source: string | null
          community_rules: string | null
          created_at: string | null
          description: string | null
          id: string
          moderators: Json
          name: string
          settings: Json
          spotlight_carousel: Json
          updated_at: string | null
        }
        Insert: {
          about_content?: string | null
          about_links?: Json | null
          about_mission?: string | null
          artist_id: string
          banner_media_type?: string | null
          banner_media_url?: string | null
          banner_source?: string | null
          community_rules?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          moderators?: Json
          name: string
          settings?: Json
          spotlight_carousel?: Json
          updated_at?: string | null
        }
        Update: {
          about_content?: string | null
          about_links?: Json | null
          about_mission?: string | null
          artist_id?: string
          banner_media_type?: string | null
          banner_media_url?: string | null
          banner_source?: string | null
          community_rules?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          moderators?: Json
          name?: string
          settings?: Json
          spotlight_carousel?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: true
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_member_events: {
        Row: {
          community_id: string
          created_at: string | null
          event_type: string
          id: string
          tier: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          event_type: string
          id?: string
          tier?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          tier?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_member_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_moderators: {
        Row: {
          assigned_at: string | null
          assigned_by: string
          can_hide_comments: boolean | null
          can_hide_posts: boolean | null
          can_pin_comments: boolean | null
          can_pin_posts: boolean | null
          community_id: string
          id: string
          is_active: boolean | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by: string
          can_hide_comments?: boolean | null
          can_hide_posts?: boolean | null
          can_pin_comments?: boolean | null
          can_pin_posts?: boolean | null
          community_id: string
          id?: string
          is_active?: boolean | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string
          can_hide_comments?: boolean | null
          can_hide_posts?: boolean | null
          can_pin_comments?: boolean | null
          can_pin_posts?: boolean | null
          community_id?: string
          id?: string
          is_active?: boolean | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_moderators_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_notification_preferences: {
        Row: {
          community_id: string
          created_at: string | null
          email_enabled: boolean | null
          id: string
          notify_artist_posts: boolean | null
          notify_mentions: boolean | null
          notify_new_posts: boolean | null
          notify_pinned_posts: boolean | null
          notify_replies: boolean | null
          push_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_artist_posts?: boolean | null
          notify_mentions?: boolean | null
          notify_new_posts?: boolean | null
          notify_pinned_posts?: boolean | null
          notify_replies?: boolean | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_artist_posts?: boolean | null
          notify_mentions?: boolean | null
          notify_new_posts?: boolean | null
          notify_pinned_posts?: boolean | null
          notify_replies?: boolean | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_notification_preferences_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          author_type: string
          comment_count: number
          community_id: string
          content: string
          created_at: string
          id: string
          is_archived: boolean
          is_pinned: boolean
          media_urls: Json
          post_type: string
          reaction_count: number
          tier_required: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_type: string
          comment_count?: number
          community_id: string
          content: string
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          media_urls?: Json
          post_type?: string
          reaction_count?: number
          tier_required?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_type?: string
          comment_count?: number
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          media_urls?: Json
          post_type?: string
          reaction_count?: number
          tier_required?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      crowd_push_participants: {
        Row: {
          crowd_push_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          crowd_push_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          crowd_push_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crowd_push_participants_crowd_push_id_fkey"
            columns: ["crowd_push_id"]
            isOneToOne: false
            referencedRelation: "crowd_pushes"
            referencedColumns: ["id"]
          },
        ]
      }
      crowd_pushes: {
        Row: {
          activated_at: string | null
          artist_id: string
          created_at: string
          current_supporters: number
          expires_at: string
          id: string
          status: string
          target_supporters: number
        }
        Insert: {
          activated_at?: string | null
          artist_id: string
          created_at?: string
          current_supporters?: number
          expires_at?: string
          id?: string
          status?: string
          target_supporters?: number
        }
        Update: {
          activated_at?: string | null
          artist_id?: string
          created_at?: string
          current_supporters?: number
          expires_at?: string
          id?: string
          status?: string
          target_supporters?: number
        }
        Relationships: [
          {
            foreignKeyName: "crowd_pushes_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_function_logs: {
        Row: {
          correlation_id: string
          created_at: string | null
          details: Json | null
          execution_time_ms: number | null
          function_name: string
          id: string
          level: string
          message: string | null
          status_code: number | null
          step: string
          user_id: string | null
        }
        Insert: {
          correlation_id: string
          created_at?: string | null
          details?: Json | null
          execution_time_ms?: number | null
          function_name: string
          id?: string
          level?: string
          message?: string | null
          status_code?: number | null
          step: string
          user_id?: string | null
        }
        Update: {
          correlation_id?: string
          created_at?: string | null
          details?: Json | null
          execution_time_ms?: number | null
          function_name?: string
          id?: string
          level?: string
          message?: string | null
          status_code?: number | null
          step?: string
          user_id?: string | null
        }
        Relationships: []
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
      fan_beta_access: {
        Row: {
          badge_name: string | null
          code_id: string | null
          id: string
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          badge_name?: string | null
          code_id?: string | null
          id?: string
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          badge_name?: string | null
          code_id?: string | null
          id?: string
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fan_beta_access_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "beta_access_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_engagement_scores: {
        Row: {
          comment_count: number | null
          community_id: string
          created_at: string | null
          id: string
          last_activity_at: string | null
          post_count: number | null
          previous_rank: number | null
          rank: number | null
          reaction_given_count: number | null
          reaction_received_count: number | null
          reply_count: number | null
          total_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment_count?: number | null
          community_id: string
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          post_count?: number | null
          previous_rank?: number | null
          rank?: number | null
          reaction_given_count?: number | null
          reaction_received_count?: number | null
          reply_count?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment_count?: number | null
          community_id?: string
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          post_count?: number | null
          previous_rank?: number | null
          rank?: number | null
          reaction_given_count?: number | null
          reaction_received_count?: number | null
          reply_count?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fan_engagement_scores_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_invite_sessions: {
        Row: {
          code_id: string | null
          created_at: string | null
          email: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          code_id?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          code_id?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fan_invite_sessions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "beta_access_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_monthly_wraps: {
        Row: {
          artists_discovered: number | null
          generated_at: string
          id: string
          month: number
          spotlight_votes_cast: number | null
          top_artists: Json | null
          top_tracks: Json | null
          total_plays: number | null
          total_xp_earned: number | null
          user_id: string
          year: number
        }
        Insert: {
          artists_discovered?: number | null
          generated_at?: string
          id?: string
          month: number
          spotlight_votes_cast?: number | null
          top_artists?: Json | null
          top_tracks?: Json | null
          total_plays?: number | null
          total_xp_earned?: number | null
          user_id: string
          year: number
        }
        Update: {
          artists_discovered?: number | null
          generated_at?: string
          id?: string
          month?: number
          spotlight_votes_cast?: number | null
          top_artists?: Json | null
          top_tracks?: Json | null
          total_plays?: number | null
          total_xp_earned?: number | null
          user_id?: string
          year?: number
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
      feature_flags: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          enabled_for_artists: string[] | null
          enabled_for_brands: boolean | null
          enabled_for_elite: boolean | null
          enabled_for_free: boolean | null
          enabled_for_pro: boolean | null
          flag_key: string
          flag_name: string
          id: string
          is_enabled: boolean
          requires_legal_approval: boolean | null
          requires_payment_setup: boolean | null
          requires_subscription: boolean | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          enabled_for_artists?: string[] | null
          enabled_for_brands?: boolean | null
          enabled_for_elite?: boolean | null
          enabled_for_free?: boolean | null
          enabled_for_pro?: boolean | null
          flag_key: string
          flag_name: string
          id?: string
          is_enabled?: boolean
          requires_legal_approval?: boolean | null
          requires_payment_setup?: boolean | null
          requires_subscription?: boolean | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          enabled_for_artists?: string[] | null
          enabled_for_brands?: boolean | null
          enabled_for_elite?: boolean | null
          enabled_for_free?: boolean | null
          enabled_for_pro?: boolean | null
          flag_key?: string
          flag_name?: string
          id?: string
          is_enabled?: boolean
          requires_legal_approval?: boolean | null
          requires_payment_setup?: boolean | null
          requires_subscription?: boolean | null
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "follows_fan_id_fkey"
            columns: ["fan_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_tracking: {
        Row: {
          artist_id: string
          campaign_name: string | null
          converted_to_follow: boolean | null
          converted_to_support: boolean | null
          created_at: string | null
          id: string
          landing_id: string | null
          landing_type: string
          referrer_url: string | null
          session_id: string | null
          source_platform: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          artist_id: string
          campaign_name?: string | null
          converted_to_follow?: boolean | null
          converted_to_support?: boolean | null
          created_at?: string | null
          id?: string
          landing_id?: string | null
          landing_type: string
          referrer_url?: string | null
          session_id?: string | null
          source_platform: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          artist_id?: string
          campaign_name?: string | null
          converted_to_follow?: boolean | null
          converted_to_support?: boolean | null
          created_at?: string | null
          id?: string
          landing_id?: string | null
          landing_type?: string
          referrer_url?: string | null
          session_id?: string | null
          source_platform?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbound_tracking_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_messages: {
        Row: {
          assigned_key: string | null
          assigned_to: string | null
          attachments: Json | null
          created_at: string | null
          dedupe_key: string
          id: string
          payload: Json | null
          priority: string
          resolution_details: Json | null
          resolution_summary: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          summary: string | null
          title: string
          type: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          verified_device: string | null
          verified_route: string | null
        }
        Insert: {
          assigned_key?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          created_at?: string | null
          dedupe_key: string
          id?: string
          payload?: Json | null
          priority?: string
          resolution_details?: Json | null
          resolution_summary?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          summary?: string | null
          title: string
          type?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          verified_device?: string | null
          verified_route?: string | null
        }
        Update: {
          assigned_key?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          created_at?: string | null
          dedupe_key?: string
          id?: string
          payload?: Json | null
          priority?: string
          resolution_details?: Json | null
          resolution_summary?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          summary?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          verified_device?: string | null
          verified_route?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbox_messages_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_messages_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_messages_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_messages_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_messages_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_messages_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_updates: {
        Row: {
          author_id: string | null
          created_at: string | null
          id: string
          is_system: boolean | null
          language: string | null
          message_id: string
          update_text: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          language?: string | null
          message_id: string
          update_text: string
        }
        Update: {
          author_id?: string | null
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          language?: string | null
          message_id?: string
          update_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_updates_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "inbox_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_acceptances: {
        Row: {
          accepted_at: string
          accepted_language: string | null
          document_type: string
          document_version: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          accepted_language?: string | null
          document_type: string
          document_version?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          accepted_language?: string | null
          document_type?: string
          document_version?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          changelog: string | null
          created_at: string | null
          current_version: string
          document_path: string
          document_type: string
          id: string
          last_updated: string
          requires_reaccept: boolean | null
          title: string
        }
        Insert: {
          changelog?: string | null
          created_at?: string | null
          current_version?: string
          document_path: string
          document_type: string
          id?: string
          last_updated?: string
          requires_reaccept?: boolean | null
          title: string
        }
        Update: {
          changelog?: string | null
          created_at?: string | null
          current_version?: string
          document_path?: string
          document_type?: string
          id?: string
          last_updated?: string
          requires_reaccept?: boolean | null
          title?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
      mission_completions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          period_start: string
          progress: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          period_start?: string
          progress?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          period_start?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_completions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          mission_key: string
          mission_type: string
          target_count: number
          title: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          mission_key: string
          mission_type?: string
          target_count?: number
          title: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          mission_key?: string
          mission_type?: string
          target_count?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
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
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
      platform_updates: {
        Row: {
          activation_log: Json | null
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          priority: string | null
          published_at: string | null
          target_roles: string[]
          title: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          activation_log?: Json | null
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          priority?: string | null
          published_at?: string | null
          target_roles?: string[]
          title: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          activation_log?: Json | null
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          priority?: string | null
          published_at?: string | null
          target_roles?: string[]
          title?: string
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_pinned: boolean | null
          is_public: boolean
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          is_public?: boolean
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          is_public?: boolean
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          author_type: string | null
          content: string
          created_at: string
          display_name: string | null
          hidden_at: string | null
          hidden_by: string | null
          id: string
          is_deleted: boolean
          is_hidden: boolean | null
          is_pinned: boolean | null
          parent_comment_id: string | null
          post_id: string
          reaction_count: number
          updated_at: string
        }
        Insert: {
          author_id: string
          author_type?: string | null
          content: string
          created_at?: string
          display_name?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_deleted?: boolean
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          parent_comment_id?: string | null
          post_id: string
          reaction_count?: number
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_type?: string | null
          content?: string
          created_at?: string
          display_name?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_deleted?: boolean
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          parent_comment_id?: string | null
          post_id?: string
          reaction_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_plans: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          plan_key: string
          plan_name: string
          price_monthly: number | null
          price_yearly: number | null
          sort_order: number | null
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          updated_at: string | null
          user_type: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          plan_key: string
          plan_name: string
          price_monthly?: number | null
          price_yearly?: number | null
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string | null
          user_type: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          plan_key?: string
          plan_name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      pricing_override_audit_log: {
        Row: {
          action: string
          artist_id: string
          changed_at: string | null
          changed_by: string | null
          id: string
          new_values: Json | null
          notes: string | null
          old_values: Json | null
          override_id: string | null
        }
        Insert: {
          action: string
          artist_id: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          override_id?: string | null
        }
        Update: {
          action?: string
          artist_id?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          override_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_override_audit_log_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_override_audit_log_override_id_fkey"
            columns: ["override_id"]
            isOneToOne: false
            referencedRelation: "artist_pricing_overrides"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_inbox_language: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_suspended: boolean | null
          preferred_language: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          admin_inbox_language?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_suspended?: boolean | null
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          admin_inbox_language?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_suspended?: boolean | null
          preferred_language?: string | null
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
          {
            foreignKeyName: "promo_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      qa_check_results: {
        Row: {
          check_name: string
          check_type: string
          created_at: string
          id: string
          metadata: Json | null
          passed: boolean
          reason: string | null
          response_time_ms: number | null
        }
        Insert: {
          check_name: string
          check_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          passed: boolean
          reason?: string | null
          response_time_ms?: number | null
        }
        Update: {
          check_name?: string
          check_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          passed?: boolean
          reason?: string | null
          response_time_ms?: number | null
        }
        Relationships: []
      }
      qa_report_runs: {
        Row: {
          created_at: string
          db_checks_passed: number | null
          db_checks_total: number | null
          errors_24h: number | null
          id: string
          overall_passed: boolean
          report_sent_to: string[] | null
          route_checks_passed: number | null
          route_checks_total: number | null
          run_type: string
        }
        Insert: {
          created_at?: string
          db_checks_passed?: number | null
          db_checks_total?: number | null
          errors_24h?: number | null
          id?: string
          overall_passed: boolean
          report_sent_to?: string[] | null
          route_checks_passed?: number | null
          route_checks_total?: number | null
          run_type: string
        }
        Update: {
          created_at?: string
          db_checks_passed?: number | null
          db_checks_total?: number | null
          errors_24h?: number | null
          id?: string
          overall_passed?: boolean
          report_sent_to?: string[] | null
          route_checks_passed?: number | null
          route_checks_total?: number | null
          run_type?: string
        }
        Relationships: []
      }
      release_notifications: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          notified: boolean | null
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          notified?: boolean | null
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          notified?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      runtime_errors: {
        Row: {
          component: string | null
          created_at: string
          error_message: string
          error_stack: string | null
          id: string
          route: string | null
          sentry_event_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component?: string | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          id?: string
          route?: string | null
          sentry_event_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component?: string | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          id?: string
          route?: string | null
          sentry_event_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      smart_link_anomaly_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          details: Json | null
          external_link_id: string | null
          id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          smart_link_page_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          details?: Json | null
          external_link_id?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          smart_link_page_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          details?: Json | null
          external_link_id?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          smart_link_page_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_anomaly_alerts_external_link_id_fkey"
            columns: ["external_link_id"]
            isOneToOne: false
            referencedRelation: "smart_link_external_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_link_anomaly_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_link_anomaly_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_link_anomaly_alerts_smart_link_page_id_fkey"
            columns: ["smart_link_page_id"]
            isOneToOne: false
            referencedRelation: "smart_link_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_link_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          performed_by: string
          performed_by_role: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          performed_by: string
          performed_by_role: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          performed_by?: string
          performed_by_role?: string
        }
        Relationships: []
      }
      smart_link_clicks: {
        Row: {
          artist_id: string
          created_at: string
          external_link_id: string
          id: string
          ip_hash: string | null
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string
          external_link_id: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string
          external_link_id?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_clicks_external_link_id_fkey"
            columns: ["external_link_id"]
            isOneToOne: false
            referencedRelation: "smart_link_external_links"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_link_external_links: {
        Row: {
          artist_id: string
          click_count: number
          created_at: string
          flag_reason: string | null
          flagged_at: string | null
          flagged_by: string | null
          id: string
          is_permanently_blocked: boolean | null
          platform: string
          removal_reason: string | null
          removed_at: string | null
          removed_by: string | null
          smart_link_page_id: string
          sort_order: number
          status: string
          updated_at: string
          url: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          artist_id: string
          click_count?: number
          created_at?: string
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_permanently_blocked?: boolean | null
          platform: string
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          smart_link_page_id: string
          sort_order?: number
          status?: string
          updated_at?: string
          url: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          artist_id?: string
          click_count?: number
          created_at?: string
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_permanently_blocked?: boolean | null
          platform?: string
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          smart_link_page_id?: string
          sort_order?: number
          status?: string
          updated_at?: string
          url?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_external_links_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_link_external_links_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_link_external_links_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_link_external_links_smart_link_page_id_fkey"
            columns: ["smart_link_page_id"]
            isOneToOne: false
            referencedRelation: "smart_link_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_link_external_links_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_link_external_links_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_link_page_visits: {
        Row: {
          artist_id: string
          clicked_external: boolean
          created_at: string
          external_platform: string | null
          id: string
          ip_hash: string | null
          played_on_flymusic: boolean
          smart_link_page_id: string
          user_id: string | null
        }
        Insert: {
          artist_id: string
          clicked_external?: boolean
          created_at?: string
          external_platform?: string | null
          id?: string
          ip_hash?: string | null
          played_on_flymusic?: boolean
          smart_link_page_id: string
          user_id?: string | null
        }
        Update: {
          artist_id?: string
          clicked_external?: boolean
          created_at?: string
          external_platform?: string | null
          id?: string
          ip_hash?: string | null
          played_on_flymusic?: boolean
          smart_link_page_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_page_visits_smart_link_page_id_fkey"
            columns: ["smart_link_page_id"]
            isOneToOne: false
            referencedRelation: "smart_link_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_link_pages: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          slug: string
          status: string
          suspended_at: string | null
          suspended_by: string | null
          suspended_until: string | null
          suspension_reason: string | null
          suspension_type: string | null
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          slug: string
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          suspension_type?: string | null
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          slug?: string
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_until?: string | null
          suspension_reason?: string | null
          suspension_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_pages_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_link_pages_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_link_pages_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_link_rate_limits: {
        Row: {
          action_type: string
          artist_id: string
          created_at: string | null
          id: string
          window_start: string | null
        }
        Insert: {
          action_type: string
          artist_id: string
          created_at?: string | null
          id?: string
          window_start?: string | null
        }
        Update: {
          action_type?: string
          artist_id?: string
          created_at?: string | null
          id?: string
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_rate_limits_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spotlight_campaigns: {
        Row: {
          admin_notes: string | null
          banner_image_url: string | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_paused: boolean | null
          name: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          banner_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_paused?: boolean | null
          name: string
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          banner_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_paused?: boolean | null
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
      spotlight_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_premium: boolean | null
          layout_config: Json
          name: string
          sort_order: number | null
          thumbnail_url: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          layout_config?: Json
          name: string
          sort_order?: number | null
          thumbnail_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          layout_config?: Json
          name?: string
          sort_order?: number | null
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      spotlight_views: {
        Row: {
          artist_id: string
          clicked_link: boolean | null
          created_at: string | null
          id: string
          link_type: string | null
          referrer_url: string | null
          session_id: string
          source: string | null
          spotlight_media_id: string
          user_id: string | null
          view_duration_ms: number | null
        }
        Insert: {
          artist_id: string
          clicked_link?: boolean | null
          created_at?: string | null
          id?: string
          link_type?: string | null
          referrer_url?: string | null
          session_id: string
          source?: string | null
          spotlight_media_id: string
          user_id?: string | null
          view_duration_ms?: number | null
        }
        Update: {
          artist_id?: string
          clicked_link?: boolean | null
          created_at?: string | null
          id?: string
          link_type?: string | null
          referrer_url?: string | null
          session_id?: string
          source?: string | null
          spotlight_media_id?: string
          user_id?: string | null
          view_duration_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spotlight_views_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotlight_views_spotlight_media_id_fkey"
            columns: ["spotlight_media_id"]
            isOneToOne: false
            referencedRelation: "artist_spotlight_media"
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
          {
            foreignKeyName: "spotlight_votes_fan_user_id_fkey"
            columns: ["fan_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          stripe_product_id: string | null
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
          stripe_product_id?: string | null
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
          stripe_product_id?: string | null
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
      telemetry_events: {
        Row: {
          created_at: string | null
          decoded_error: string | null
          duration_ms: number | null
          flow: string
          id: string
          location: string
          meta: Json | null
          session_id: string
          status: string
          step: string
          timestamp: string
          trace_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          decoded_error?: string | null
          duration_ms?: number | null
          flow: string
          id?: string
          location: string
          meta?: Json | null
          session_id: string
          status: string
          step: string
          timestamp?: string
          trace_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          decoded_error?: string | null
          duration_ms?: number | null
          flow?: string
          id?: string
          location?: string
          meta?: Json | null
          session_id?: string
          status?: string
          step?: string
          timestamp?: string
          trace_id?: string
          user_id?: string | null
        }
        Relationships: []
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
          album_id: string | null
          artist_id: string
          audio_url: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          genre: string | null
          id: string
          is_supporter_only: boolean | null
          lyrics: string | null
          mood: string | null
          play_count: number | null
          release_date: string | null
          required_tier: string | null
          status: string | null
          supporter_early_access: boolean | null
          tags: string[] | null
          title: string
          track_order: number | null
          updated_at: string | null
          upload_batch_id: string | null
          visibility: string | null
        }
        Insert: {
          album_id?: string | null
          artist_id: string
          audio_url: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          genre?: string | null
          id?: string
          is_supporter_only?: boolean | null
          lyrics?: string | null
          mood?: string | null
          play_count?: number | null
          release_date?: string | null
          required_tier?: string | null
          status?: string | null
          supporter_early_access?: boolean | null
          tags?: string[] | null
          title: string
          track_order?: number | null
          updated_at?: string | null
          upload_batch_id?: string | null
          visibility?: string | null
        }
        Update: {
          album_id?: string | null
          artist_id?: string
          audio_url?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          genre?: string | null
          id?: string
          is_supporter_only?: boolean | null
          lyrics?: string | null
          mood?: string | null
          play_count?: number | null
          release_date?: string | null
          required_tier?: string | null
          status?: string | null
          supporter_early_access?: boolean | null
          tags?: string[] | null
          title?: string
          track_order?: number | null
          updated_at?: string | null
          upload_batch_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_sessions: {
        Row: {
          artist_id: string
          completed_files: number | null
          created_at: string | null
          failed_files: number | null
          file_type: string | null
          id: string
          status: string | null
          total_files: number
          user_id: string
        }
        Insert: {
          artist_id: string
          completed_files?: number | null
          created_at?: string | null
          failed_files?: number | null
          file_type?: string | null
          id?: string
          status?: string | null
          total_files?: number
          user_id: string
        }
        Update: {
          artist_id?: string
          completed_files?: number | null
          created_at?: string | null
          failed_files?: number | null
          file_type?: string | null
          id?: string
          status?: string | null
          total_files?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_sessions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          pause_music_on_video: boolean | null
          pip_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pause_music_on_video?: boolean | null
          pip_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pause_music_on_video?: boolean | null
          pip_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_recurring: boolean | null
          metadata: Json | null
          plan_key: string
          started_at: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          plan_key: string
          started_at?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          plan_key?: string
          started_at?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["plan_key"]
          },
        ]
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
          is_hidden: boolean | null
          is_pinned: boolean | null
          parent_comment_id: string | null
          reported_at: string | null
          reported_by: string | null
          text: string
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          parent_comment_id?: string | null
          reported_at?: string | null
          reported_by?: string | null
          text: string
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          parent_comment_id?: string | null
          reported_at?: string | null
          reported_by?: string | null
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
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_delete_user_data: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_export_user_data: {
        Args: { target_user_id: string }
        Returns: Json
      }
      calculate_artist_match_score: {
        Args: { _artist_id: string; _collab_entity_id: string }
        Returns: Json
      }
      calculate_opportunity_match_score: {
        Args: { _artist_id: string; _opportunity_id: string }
        Returns: Json
      }
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
      check_artist_pricing_status: {
        Args: { p_artist_id: string }
        Returns: Json
      }
      check_brand_application_status: {
        Args: { _email: string }
        Returns: string
      }
      check_feature_access: {
        Args: { _feature_key: string; _user_id: string }
        Returns: Json
      }
      check_smart_link_rate_limit: {
        Args: {
          _action_type?: string
          _artist_id: string
          _max_actions?: number
        }
        Returns: boolean
      }
      generate_artist_referral_code: {
        Args: { _user_id: string }
        Returns: string
      }
      get_app_mode: { Args: never; Returns: string }
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
      get_my_pricing_status: { Args: never; Returns: Json }
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
      get_top_artists_for_entity: {
        Args: { _collab_entity_id: string; _limit?: number }
        Returns: {
          artist_id: string
          artist_name: string
          avatar_url: string
          city: string
          collab_type_score: number
          country: string
          genre: string
          genre_score: number
          location_score: number
          supporters_score: number
          total_score: number
          xp_score: number
        }[]
      }
      get_top_partners_for_artist: {
        Args: { _artist_id: string; _limit?: number }
        Returns: {
          collab_type_score: number
          entity_id: string
          entity_name: string
          entity_type: string
          genre_score: number
          location: string
          location_score: number
          logo_url: string
          supporters_score: number
          total_score: number
          xp_score: number
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
      get_user_plan: {
        Args: { _user_id: string; _user_type?: string }
        Returns: string
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
      increment_play_count: { Args: { track_id: string }; Returns: undefined }
      increment_promo_click: { Args: { _promo_id: string }; Returns: undefined }
      increment_smart_link_click: {
        Args: { _link_id: string }
        Returns: undefined
      }
      increment_video_view_safe: {
        Args: { _user_id?: string; _video_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_collab_entity_admin: {
        Args: { _entity_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      process_scheduled_releases: { Args: never; Returns: Json }
      record_smart_link_action: {
        Args: { _action_type: string; _artist_id: string }
        Returns: undefined
      }
      redeem_beta_code: {
        Args: { _code: string; _user_id: string }
        Returns: Json
      }
      redeem_referral_code: {
        Args: { _code: string; _user_id: string }
        Returns: Json
      }
      set_app_mode: { Args: { _mode: string }; Returns: boolean }
      tier_level: { Args: { tier: string }; Returns: number }
      tier_rank: { Args: { tier: string }; Returns: number }
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
      upsert_inbox_message:
        | {
            Args: {
              _dedupe_key: string
              _payload: Json
              _priority: string
              _summary: string
              _title: string
            }
            Returns: string
          }
        | {
            Args: {
              _dedupe_key: string
              _payload: Json
              _priority: string
              _summary: string
              _title: string
              _type: string
            }
            Returns: string
          }
      user_can_view_post: {
        Args: { p_artist_id: string; p_tier_required: string }
        Returns: boolean
      }
      validate_fan_invite_code: { Args: { _code: string }; Returns: Json }
      validate_invite_code_universal: { Args: { _code: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "artist" | "fan" | "brand" | "super_admin"
      discount_scope: "platform_fees" | "subscriptions" | "features" | "all"
      pricing_status: "beta_free" | "discounted" | "standard"
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
      app_role: ["admin", "artist", "fan", "brand", "super_admin"],
      discount_scope: ["platform_fees", "subscriptions", "features", "all"],
      pricing_status: ["beta_free", "discounted", "standard"],
    },
  },
} as const
