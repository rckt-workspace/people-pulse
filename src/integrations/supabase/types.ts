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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string | null
          employee_id: string
          id: string
          recommendation: string | null
          resolved: boolean
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description?: string | null
          employee_id: string
          id?: string
          recommendation?: string | null
          resolved?: boolean
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string | null
          employee_id?: string
          id?: string
          recommendation?: string | null
          resolved?: boolean
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      app_users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
        }
        Relationships: []
      }
      blockers: {
        Row: {
          category: string
          created_at: string
          description: string | null
          employee_id: string | null
          id: string
          session_id: string | null
          severity: string | null
          status: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          session_id?: string | null
          severity?: string | null
          status?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          session_id?: string | null
          severity?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "blockers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      commitment_updates: {
        Row: {
          commitment_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string
        }
        Insert: {
          commitment_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
        }
        Update: {
          commitment_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "commitment_updates_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "commitments"
            referencedColumns: ["id"]
          },
        ]
      }
      commitments: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string
          due_date: string | null
          effort_level: string | null
          employee_id: string
          id: string
          origin: string | null
          priority: string | null
          responsible: string | null
          session_id: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          effort_level?: string | null
          employee_id: string
          id?: string
          origin?: string | null
          priority?: string | null
          responsible?: string | null
          session_id?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          effort_level?: string | null
          employee_id?: string
          id?: string
          origin?: string | null
          priority?: string | null
          responsible?: string | null
          session_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commitments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      competencies: {
        Row: {
          category: string | null
          created_at: string
          current_level: number | null
          employee_id: string
          id: string
          name: string
          notes: string | null
          target_level: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_level?: number | null
          employee_id: string
          id?: string
          name: string
          notes?: string | null
          target_level?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          current_level?: number | null
          employee_id?: string
          id?: string
          name?: string
          notes?: string | null
          target_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competencies_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress_history: {
        Row: {
          course_id: string
          employee_id: string
          id: string
          progress: number
          recorded_at: string
          session_id: string | null
          status: string | null
        }
        Insert: {
          course_id: string
          employee_id: string
          id?: string
          progress?: number
          recorded_at?: string
          session_id?: string | null
          status?: string | null
        }
        Update: {
          course_id?: string
          employee_id?: string
          id?: string
          progress?: number
          recorded_at?: string
          session_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          completion_date: string | null
          course_name: string
          course_type: string
          created_at: string
          employee_id: string
          id: string
          platform: string | null
          progress: number
          related_competency: string | null
          start_date: string | null
          status: string
        }
        Insert: {
          completion_date?: string | null
          course_name: string
          course_type?: string
          created_at?: string
          employee_id: string
          id?: string
          platform?: string | null
          progress?: number
          related_competency?: string | null
          start_date?: string | null
          status?: string
        }
        Update: {
          completion_date?: string | null
          course_name?: string
          course_type?: string
          created_at?: string
          employee_id?: string
          id?: string
          platform?: string | null
          progress?: number
          related_competency?: string | null
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      development_goals: {
        Row: {
          actions: string | null
          category: string | null
          created_at: string
          current_state: string | null
          description: string | null
          employee_id: string
          id: string
          progress: number
          related_courses: string | null
          related_indicators: string | null
          responsible: string | null
          status: string
          target_date: string | null
          target_state: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actions?: string | null
          category?: string | null
          created_at?: string
          current_state?: string | null
          description?: string | null
          employee_id: string
          id?: string
          progress?: number
          related_courses?: string | null
          related_indicators?: string | null
          responsible?: string | null
          status?: string
          target_date?: string | null
          target_state?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actions?: string | null
          category?: string | null
          created_at?: string
          current_state?: string | null
          description?: string | null
          employee_id?: string
          id?: string
          progress?: number
          related_courses?: string | null
          related_indicators?: string | null
          responsible?: string | null
          status?: string
          target_date?: string | null
          target_state?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      development_index_history: {
        Row: {
          commitments_score: number | null
          competencies_score: number | null
          created_at: string
          employee_id: string
          goals_score: number | null
          id: string
          performance_score: number | null
          period_month: string
          total_score: number
          training_score: number | null
        }
        Insert: {
          commitments_score?: number | null
          competencies_score?: number | null
          created_at?: string
          employee_id: string
          goals_score?: number | null
          id?: string
          performance_score?: number | null
          period_month: string
          total_score: number
          training_score?: number | null
        }
        Update: {
          commitments_score?: number | null
          competencies_score?: number | null
          created_at?: string
          employee_id?: string
          goals_score?: number | null
          id?: string
          performance_score?: number | null
          period_month?: string
          total_score?: number
          training_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "development_index_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      development_suggestions: {
        Row: {
          category: string | null
          created_at: string
          current_state: string | null
          employee_id: string
          evidence: string | null
          id: string
          rationale: string | null
          status: string
          suggested_actions: string | null
          target_state: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_state?: string | null
          employee_id: string
          evidence?: string | null
          id?: string
          rationale?: string | null
          status?: string
          suggested_actions?: string | null
          target_state?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_state?: string | null
          employee_id?: string
          evidence?: string | null
          id?: string
          rationale?: string | null
          status?: string
          suggested_actions?: string | null
          target_state?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_suggestions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          area: string
          compliance_percentage: number | null
          created_at: string
          development_index: number | null
          evaluation_period: string
          full_name: string
          general_responsibilities: string | null
          id: string
          job_title: string
          last_session_date: string | null
          leader_name: string
          next_followup_date: string | null
          status: string
          updated_at: string
          wellbeing_score: number | null
        }
        Insert: {
          area: string
          compliance_percentage?: number | null
          created_at?: string
          development_index?: number | null
          evaluation_period: string
          full_name: string
          general_responsibilities?: string | null
          id?: string
          job_title: string
          last_session_date?: string | null
          leader_name: string
          next_followup_date?: string | null
          status?: string
          updated_at?: string
          wellbeing_score?: number | null
        }
        Update: {
          area?: string
          compliance_percentage?: number | null
          created_at?: string
          development_index?: number | null
          evaluation_period?: string
          full_name?: string
          general_responsibilities?: string | null
          id?: string
          job_title?: string
          last_session_date?: string | null
          leader_name?: string
          next_followup_date?: string | null
          status?: string
          updated_at?: string
          wellbeing_score?: number | null
        }
        Relationships: []
      }
      indicator_results: {
        Row: {
          compliance_percentage: number | null
          created_at: string
          employee_id: string
          id: string
          indicator_id: string
          notes: string | null
          period_label: string | null
          result_value: number | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          compliance_percentage?: number | null
          created_at?: string
          employee_id: string
          id?: string
          indicator_id: string
          notes?: string | null
          period_label?: string | null
          result_value?: number | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          compliance_percentage?: number | null
          created_at?: string
          employee_id?: string
          id?: string
          indicator_id?: string
          notes?: string | null
          period_label?: string | null
          result_value?: number | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicator_results_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_results_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      indicators: {
        Row: {
          created_at: string
          current_value: number | null
          description: string | null
          direction: string
          employee_id: string
          id: string
          name: string
          target_value: number | null
          unit: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          direction?: string
          employee_id: string
          id?: string
          name: string
          target_value?: number | null
          unit?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          direction?: string
          employee_id?: string
          id?: string
          name?: string
          target_value?: number | null
          unit?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "indicators_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      responsibility_reviews: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          responsibility_text: string
          session_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          responsibility_text: string
          session_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          responsibility_text?: string
          session_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "responsibility_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responsibility_reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      role_question_templates: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          id: string
          question_text: string
          role_category: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          id?: string
          question_text: string
          role_category: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          id?: string
          question_text?: string
          role_category?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      session_questions: {
        Row: {
          answer: string | null
          category: string | null
          created_at: string
          employee_id: string
          id: string
          question_text: string
          session_id: string
          sort_order: number
          source: string
        }
        Insert: {
          answer?: string | null
          category?: string | null
          created_at?: string
          employee_id: string
          id?: string
          question_text: string
          session_id: string
          sort_order?: number
          source?: string
        }
        Update: {
          answer?: string | null
          category?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          question_text?: string
          session_id?: string
          sort_order?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_questions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_topics: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          session_id: string
          topic: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          session_id: string
          topic: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          session_id?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_topics_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_topics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          ai_summary: string | null
          approved: boolean
          compliance_percentage: number | null
          created_at: string
          current_step: number
          employee_id: string
          facilitator: string | null
          general_notes: string | null
          id: string
          session_date: string
          session_type: string
          status: string
          updated_at: string
          wellbeing_score: number | null
        }
        Insert: {
          ai_summary?: string | null
          approved?: boolean
          compliance_percentage?: number | null
          created_at?: string
          current_step?: number
          employee_id: string
          facilitator?: string | null
          general_notes?: string | null
          id?: string
          session_date: string
          session_type?: string
          status?: string
          updated_at?: string
          wellbeing_score?: number | null
        }
        Update: {
          ai_summary?: string | null
          approved?: boolean
          compliance_percentage?: number | null
          created_at?: string
          current_step?: number
          employee_id?: string
          facilitator?: string | null
          general_notes?: string | null
          id?: string
          session_date?: string
          session_type?: string
          status?: string
          updated_at?: string
          wellbeing_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      wellbeing_responses: {
        Row: {
          created_at: string
          dimension: string
          employee_id: string
          id: string
          notes: string | null
          score: number
          session_id: string | null
        }
        Insert: {
          created_at?: string
          dimension: string
          employee_id: string
          id?: string
          notes?: string | null
          score: number
          session_id?: string | null
        }
        Update: {
          created_at?: string
          dimension?: string
          employee_id?: string
          id?: string
          notes?: string | null
          score?: number
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wellbeing_responses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellbeing_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
