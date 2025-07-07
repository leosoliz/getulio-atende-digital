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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      attendant_services: {
        Row: {
          attendant_id: string | null
          created_at: string | null
          id: string
          service_id: string | null
        }
        Insert: {
          attendant_id?: string | null
          created_at?: string | null
          id?: string
          service_id?: string | null
        }
        Update: {
          attendant_id?: string | null
          created_at?: string | null
          id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendant_services_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendant_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_vistorias: {
        Row: {
          created_at: string
          data_vistoria: string
          descricao_atividades: string
          detalhes_pendencias: string | null
          empresa_responsavel: string | null
          engenheiro_responsavel: string | null
          fiscal_assinatura: string | null
          fiscal_matricula: string | null
          fiscal_nome: string | null
          fiscal_prefeitura: string | null
          hora_vistoria: string
          id: string
          latitude: number | null
          localizacao: string
          longitude: number | null
          nome_obra: string
          numero_contrato: string | null
          objetivo_encerramento: boolean | null
          objetivo_inicio_obra: boolean | null
          objetivo_medicao: boolean | null
          objetivo_outros: string | null
          objetivo_vistoria_rotina: boolean | null
          objetivo_vistoria_tecnica: boolean | null
          recomendacoes: string | null
          representante_assinatura: string | null
          representante_cargo: string | null
          representante_nome: string | null
          situacao_conformidade: boolean | null
          situacao_finalizada: boolean | null
          situacao_irregularidades: boolean | null
          situacao_paralisada: boolean | null
          situacao_pendencias: boolean | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_vistoria: string
          descricao_atividades: string
          detalhes_pendencias?: string | null
          empresa_responsavel?: string | null
          engenheiro_responsavel?: string | null
          fiscal_assinatura?: string | null
          fiscal_matricula?: string | null
          fiscal_nome?: string | null
          fiscal_prefeitura?: string | null
          hora_vistoria: string
          id?: string
          latitude?: number | null
          localizacao: string
          longitude?: number | null
          nome_obra: string
          numero_contrato?: string | null
          objetivo_encerramento?: boolean | null
          objetivo_inicio_obra?: boolean | null
          objetivo_medicao?: boolean | null
          objetivo_outros?: string | null
          objetivo_vistoria_rotina?: boolean | null
          objetivo_vistoria_tecnica?: boolean | null
          recomendacoes?: string | null
          representante_assinatura?: string | null
          representante_cargo?: string | null
          representante_nome?: string | null
          situacao_conformidade?: boolean | null
          situacao_finalizada?: boolean | null
          situacao_irregularidades?: boolean | null
          situacao_paralisada?: boolean | null
          situacao_pendencias?: boolean | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_vistoria?: string
          descricao_atividades?: string
          detalhes_pendencias?: string | null
          empresa_responsavel?: string | null
          engenheiro_responsavel?: string | null
          fiscal_assinatura?: string | null
          fiscal_matricula?: string | null
          fiscal_nome?: string | null
          fiscal_prefeitura?: string | null
          hora_vistoria?: string
          id?: string
          latitude?: number | null
          localizacao?: string
          longitude?: number | null
          nome_obra?: string
          numero_contrato?: string | null
          objetivo_encerramento?: boolean | null
          objetivo_inicio_obra?: boolean | null
          objetivo_medicao?: boolean | null
          objetivo_outros?: string | null
          objetivo_vistoria_rotina?: boolean | null
          objetivo_vistoria_tecnica?: boolean | null
          recomendacoes?: string | null
          representante_assinatura?: string | null
          representante_cargo?: string | null
          representante_nome?: string | null
          situacao_conformidade?: boolean | null
          situacao_finalizada?: boolean | null
          situacao_irregularidades?: boolean | null
          situacao_paralisada?: boolean | null
          situacao_pendencias?: boolean | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          location_id: string | null
          user_type: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          location_id?: string | null
          user_type: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          location_id?: string | null
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "service_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_customers: {
        Row: {
          attendant_id: string | null
          called_at: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          is_priority: boolean | null
          location_id: string | null
          name: string
          phone: string
          queue_number: number
          service_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_priority?: boolean | null
          location_id?: string | null
          name: string
          phone: string
          queue_number: number
          service_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_priority?: boolean | null
          location_id?: string | null
          name?: string
          phone?: string
          queue_number?: number
          service_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_customers_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_customers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "service_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_customers_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_locations: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean | null
          created_at: string | null
          estimated_time: number
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          estimated_time?: number
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          estimated_time?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      vistoria_fotos: {
        Row: {
          arquivo_url: string
          created_at: string
          id: string
          legenda: string
          ordem: number | null
          tamanho_arquivo: number | null
          tipo_arquivo: string | null
          vistoria_id: string | null
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          id?: string
          legenda: string
          ordem?: number | null
          tamanho_arquivo?: number | null
          tipo_arquivo?: string | null
          vistoria_id?: string | null
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          id?: string
          legenda?: string
          ordem?: number | null
          tamanho_arquivo?: number | null
          tipo_arquivo?: string | null
          vistoria_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vistoria_fotos_vistoria_id_fkey"
            columns: ["vistoria_id"]
            isOneToOne: false
            referencedRelation: "obra_vistorias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_queue_number: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_next_queue_number_by_location: {
        Args: { location_uuid?: string }
        Returns: number
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_attendant_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_receptionist_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
