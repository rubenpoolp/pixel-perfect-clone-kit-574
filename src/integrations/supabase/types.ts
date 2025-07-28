export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      analysis_reports: {
        Row: {
          created_at: string
          demo_session_id: string | null
          export_data: Json | null
          id: string
          metrics: Json | null
          recommendations: Json | null
          session_id: string | null
          summary: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          demo_session_id?: string | null
          export_data?: Json | null
          id?: string
          metrics?: Json | null
          recommendations?: Json | null
          session_id?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          demo_session_id?: string | null
          export_data?: Json | null
          id?: string
          metrics?: Json | null
          recommendations?: Json | null
          session_id?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_sessions: {
        Row: {
          created_at: string
          current_page: string | null
          demo_session_id: string | null
          id: string
          session_data: Json | null
          updated_at: string
          user_id: string | null
          website_id: string | null
        }
        Insert: {
          created_at?: string
          current_page?: string | null
          demo_session_id?: string | null
          id?: string
          session_data?: Json | null
          updated_at?: string
          user_id?: string | null
          website_id?: string | null
        }
        Update: {
          created_at?: string
          current_page?: string | null
          demo_session_id?: string | null
          id?: string
          session_data?: Json | null
          updated_at?: string
          user_id?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_sessions_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          content: string
          created_at: string
          demo_session_id: string | null
          id: string
          metadata: Json | null
          role: string
          session_id: string | null
          suggestions: Json | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          demo_session_id?: string | null
          id?: string
          metadata?: Json | null
          role: string
          session_id?: string | null
          suggestions?: Json | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          demo_session_id?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string | null
          suggestions?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cua_ab_tests: {
        Row: {
          control_url: string
          created_at: string
          ended_at: string | null
          id: string
          results: Json | null
          started_at: string | null
          statistical_significance: number | null
          status: string
          success_metrics: Json
          test_description: string | null
          test_duration_days: number
          test_name: string
          traffic_split: Json
          updated_at: string
          user_id: string | null
          variant_configs: Json
          website_id: string | null
          winning_variant: string | null
        }
        Insert: {
          control_url: string
          created_at?: string
          ended_at?: string | null
          id?: string
          results?: Json | null
          started_at?: string | null
          statistical_significance?: number | null
          status?: string
          success_metrics: Json
          test_description?: string | null
          test_duration_days?: number
          test_name: string
          traffic_split?: Json
          updated_at?: string
          user_id?: string | null
          variant_configs: Json
          website_id?: string | null
          winning_variant?: string | null
        }
        Update: {
          control_url?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          results?: Json | null
          started_at?: string | null
          statistical_significance?: number | null
          status?: string
          success_metrics?: Json
          test_description?: string | null
          test_duration_days?: number
          test_name?: string
          traffic_split?: Json
          updated_at?: string
          user_id?: string | null
          variant_configs?: Json
          website_id?: string | null
          winning_variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cua_ab_tests_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      cua_competitive_analysis: {
        Row: {
          analysis_results: Json
          analysis_type: string
          analyzed_at: string
          benchmark_score: number | null
          competitor_url: string
          created_at: string
          id: string
          industry: string | null
          performance_metrics: Json | null
          recommendations: Json | null
          updated_at: string
          user_id: string | null
          website_id: string | null
        }
        Insert: {
          analysis_results: Json
          analysis_type: string
          analyzed_at?: string
          benchmark_score?: number | null
          competitor_url: string
          created_at?: string
          id?: string
          industry?: string | null
          performance_metrics?: Json | null
          recommendations?: Json | null
          updated_at?: string
          user_id?: string | null
          website_id?: string | null
        }
        Update: {
          analysis_results?: Json
          analysis_type?: string
          analyzed_at?: string
          benchmark_score?: number | null
          competitor_url?: string
          created_at?: string
          id?: string
          industry?: string | null
          performance_metrics?: Json | null
          recommendations?: Json | null
          updated_at?: string
          user_id?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cua_competitive_analysis_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      cua_conversion_events: {
        Row: {
          ab_test_id: string | null
          conversion_value: number | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          referrer: string | null
          session_id: string | null
          timestamp: string
          url: string
          user_agent: string | null
          variant: string | null
          visitor_id: string
          website_id: string | null
        }
        Insert: {
          ab_test_id?: string | null
          conversion_value?: number | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          referrer?: string | null
          session_id?: string | null
          timestamp?: string
          url: string
          user_agent?: string | null
          variant?: string | null
          visitor_id: string
          website_id?: string | null
        }
        Update: {
          ab_test_id?: string | null
          conversion_value?: number | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          referrer?: string | null
          session_id?: string | null
          timestamp?: string
          url?: string
          user_agent?: string | null
          variant?: string | null
          visitor_id?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cua_conversion_events_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "cua_ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cua_conversion_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cua_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cua_conversion_events_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      cua_interactions: {
        Row: {
          action_data: Json | null
          action_type: string
          created_at: string
          element_selector: string | null
          error_message: string | null
          id: string
          screenshot_url: string | null
          session_id: string
          success: boolean
          timestamp: string
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          created_at?: string
          element_selector?: string | null
          error_message?: string | null
          id?: string
          screenshot_url?: string | null
          session_id: string
          success?: boolean
          timestamp?: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          created_at?: string
          element_selector?: string | null
          error_message?: string | null
          id?: string
          screenshot_url?: string | null
          session_id?: string
          success?: boolean
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "cua_interactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cua_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cua_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          results: Json | null
          session_type: string
          started_at: string
          status: string
          target_url: string
          updated_at: string
          user_id: string | null
          website_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          results?: Json | null
          session_type: string
          started_at?: string
          status?: string
          target_url: string
          updated_at?: string
          user_id?: string | null
          website_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          results?: Json | null
          session_type?: string
          started_at?: string
          status?: string
          target_url?: string
          updated_at?: string
          user_id?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cua_sessions_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          created_at: string
          demo_session_id: string | null
          description: string | null
          id: string
          industry: string | null
          product_type: string | null
          title: string | null
          updated_at: string
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          demo_session_id?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          product_type?: string | null
          title?: string | null
          updated_at?: string
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          demo_session_id?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          product_type?: string | null
          title?: string | null
          updated_at?: string
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_demo_session_limits: {
        Args: { session_id: string }
        Returns: boolean
      }
      cleanup_demo_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
