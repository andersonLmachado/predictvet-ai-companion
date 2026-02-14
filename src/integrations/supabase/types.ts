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
      clinical_observations: {
        Row: {
          created_at: string
          id: string
          observation: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          observation: string
          patient_id: string
        }
        Update: {
          created_at?: string
          id?: string
          observation?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_observations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_complete_record"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_observations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_summaries: {
        Row: {
          id: number
          last_ai_summary: string
          patient_id: string | null
        }
        Insert: {
          id?: number
          last_ai_summary: string
          patient_id?: string | null
        }
        Update: {
          id?: number
          last_ai_summary?: string
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_summaries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_complete_record"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolution_summaries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          completed_at: string | null
          created_at: string
          exam_type: string
          id: string
          notes: string | null
          patient_id: string
          requested_at: string
          results: string | null
          status: string
          updated_at: string
          veterinarian_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          exam_type: string
          id?: string
          notes?: string | null
          patient_id: string
          requested_at?: string
          results?: string | null
          status?: string
          updated_at?: string
          veterinarian_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          exam_type?: string
          id?: string
          notes?: string | null
          patient_id?: string
          requested_at?: string
          results?: string | null
          status?: string
          updated_at?: string
          veterinarian_id?: string
        }
        Relationships: []
      }
      exams_history: {
        Row: {
          analysis_data: Json
          clinical_summary: string | null
          created_at: string | null
          exam_type: string
          id: string
          patient_id: string
        }
        Insert: {
          analysis_data: Json
          clinical_summary?: string | null
          created_at?: string | null
          exam_type: string
          id?: string
          patient_id: string
        }
        Update: {
          analysis_data?: Json
          clinical_summary?: string | null
          created_at?: string | null
          exam_type?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_complete_record"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_consultations: {
        Row: {
          ai_suggestions: string | null
          content: string | null
          created_at: string | null
          id: string
          patient_id: string | null
          soap_block: string | null
        }
        Insert: {
          ai_suggestions?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string | null
          soap_block?: string | null
        }
        Update: {
          ai_suggestions?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string | null
          soap_block?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_complete_record"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: string | null
          breed: string | null
          created_at: string
          id: string
          name: string
          owner_email: string | null
          owner_name: string
          owner_phone: string | null
          sex: string | null
          species: string
          updated_at: string
          veterinarian_id: string
          weight: number | null
        }
        Insert: {
          age?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          name: string
          owner_email?: string | null
          owner_name: string
          owner_phone?: string | null
          sex?: string | null
          species: string
          updated_at?: string
          veterinarian_id: string
          weight?: number | null
        }
        Update: {
          age?: string | null
          breed?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_email?: string | null
          owner_name?: string
          owner_phone?: string | null
          sex?: string | null
          species?: string
          updated_at?: string
          veterinarian_id?: string
          weight?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      patient_complete_record: {
        Row: {
          age: string | null
          breed: string | null
          created_at: string | null
          id: string | null
          last_ai_summary: string | null
          name: string | null
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          sex: string | null
          soap_history: Json | null
          species: string | null
          updated_at: string | null
          veterinarian_id: string | null
          weight: number | null
        }
        Relationships: []
      }
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
