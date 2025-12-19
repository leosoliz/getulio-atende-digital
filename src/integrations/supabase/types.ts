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
      boletins: {
        Row: {
          created_at: string
          event_type: string
          id: string
          mensagem: string
          payload: Json | null
          stop_reason: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          mensagem: string
          payload?: Json | null
          stop_reason: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          mensagem?: string
          payload?: Json | null
          stop_reason?: string
        }
        Relationships: []
      }
      cancelled_surveys: {
        Row: {
          attendant_id: string
          cancelled_at: string
          created_at: string
          id: string
          identity_appointment_id: string | null
          queue_customer_id: string | null
          whatsapp_service_id: string | null
        }
        Insert: {
          attendant_id: string
          cancelled_at?: string
          created_at?: string
          id?: string
          identity_appointment_id?: string | null
          queue_customer_id?: string | null
          whatsapp_service_id?: string | null
        }
        Update: {
          attendant_id?: string
          cancelled_at?: string
          created_at?: string
          id?: string
          identity_appointment_id?: string | null
          queue_customer_id?: string | null
          whatsapp_service_id?: string | null
        }
        Relationships: []
      }
      emergency_alerts: {
        Row: {
          affected_zones: string[] | null
          alert_type: string
          coordinates: Json | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          radius_km: number | null
          severity: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_zones?: string[] | null
          alert_type?: string
          coordinates?: Json | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          radius_km?: number | null
          severity?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_zones?: string[] | null
          alert_type?: string
          coordinates?: Json | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          radius_km?: number | null
          severity?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      fleet_vehicles: {
        Row: {
          brand: string
          capacity: number | null
          created_at: string | null
          department: string | null
          fuel_type: string
          id: string
          license_plate: string
          model: string
          observations: string | null
          status: string
          updated_at: string | null
          vehicle_type: string
          year: number
        }
        Insert: {
          brand: string
          capacity?: number | null
          created_at?: string | null
          department?: string | null
          fuel_type: string
          id?: string
          license_plate: string
          model: string
          observations?: string | null
          status?: string
          updated_at?: string | null
          vehicle_type: string
          year: number
        }
        Update: {
          brand?: string
          capacity?: number | null
          created_at?: string | null
          department?: string | null
          fuel_type?: string
          id?: string
          license_plate?: string
          model?: string
          observations?: string | null
          status?: string
          updated_at?: string | null
          vehicle_type?: string
          year?: number
        }
        Relationships: []
      }
      identity_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          attendant_id: string | null
          called_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          name: string
          phone: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          phone: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_appointments_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_appointments_public_backup_20251219_000000: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          attendant_id: string | null
          called_at: string | null
          completed_at: string | null
          created_at: string | null
          id: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          employee_id: string | null
          full_name: string
          id: string
          location: string | null
          location_id: string | null
          qr_code: string | null
          user_type: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          full_name: string
          id: string
          location?: string | null
          location_id?: string | null
          qr_code?: string | null
          user_type: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          full_name?: string
          id?: string
          location?: string | null
          location_id?: string | null
          qr_code?: string | null
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
      project_observations: {
        Row: {
          created_at: string
          id: string
          observation: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          observation: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          observation?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          custo: number | null
          custo_realizado_percentual: number | null
          deadline: string | null
          description: string | null
          fiscal_obra: string | null
          id: string
          name: string
          priority: string
          progress: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custo?: number | null
          custo_realizado_percentual?: number | null
          deadline?: string | null
          description?: string | null
          fiscal_obra?: string | null
          id?: string
          name: string
          priority?: string
          progress?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custo?: number | null
          custo_realizado_percentual?: number | null
          deadline?: string | null
          description?: string | null
          fiscal_obra?: string | null
          id?: string
          name?: string
          priority?: string
          progress?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      queue_customers_backup_over_4h_20251219_000000: {
        Row: {
          attendant_id: string | null
          called_at: string | null
          completed_at: string | null
          created_at: string | null
          id: string | null
          is_priority: boolean | null
          location_id: string | null
          name: string | null
          phone: string | null
          queue_number: number | null
          service_id: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string | null
          is_priority?: boolean | null
          location_id?: string | null
          name?: string | null
          phone?: string | null
          queue_number?: number | null
          service_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string | null
          is_priority?: boolean | null
          location_id?: string | null
          name?: string | null
          phone?: string | null
          queue_number?: number | null
          service_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      risk_zones: {
        Row: {
          coordinates: Json
          created_at: string
          description: string | null
          elevation_max: number | null
          elevation_min: number | null
          id: string
          is_active: boolean | null
          last_incident_date: string | null
          name: string
          population_estimate: number | null
          risk_level: string
          updated_at: string
          zone_type: string
        }
        Insert: {
          coordinates: Json
          created_at?: string
          description?: string | null
          elevation_max?: number | null
          elevation_min?: number | null
          id?: string
          is_active?: boolean | null
          last_incident_date?: string | null
          name: string
          population_estimate?: number | null
          risk_level?: string
          updated_at?: string
          zone_type?: string
        }
        Update: {
          coordinates?: Json
          created_at?: string
          description?: string | null
          elevation_max?: number | null
          elevation_min?: number | null
          id?: string
          is_active?: boolean | null
          last_incident_date?: string | null
          name?: string
          population_estimate?: number | null
          risk_level?: string
          updated_at?: string
          zone_type?: string
        }
        Relationships: []
      }
      satisfaction_surveys: {
        Row: {
          attendant_id: string
          created_at: string
          id: string
          identity_appointment_id: string | null
          improvement_aspect: string
          overall_rating: string
          problem_resolved: string
          queue_customer_id: string | null
          updated_at: string
          whatsapp_service_id: string | null
        }
        Insert: {
          attendant_id: string
          created_at?: string
          id?: string
          identity_appointment_id?: string | null
          improvement_aspect: string
          overall_rating: string
          problem_resolved: string
          queue_customer_id?: string | null
          updated_at?: string
          whatsapp_service_id?: string | null
        }
        Update: {
          attendant_id?: string
          created_at?: string
          id?: string
          identity_appointment_id?: string | null
          improvement_aspect?: string
          overall_rating?: string
          problem_resolved?: string
          queue_customer_id?: string | null
          updated_at?: string
          whatsapp_service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_surveys_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_identity_appointment_id_fkey"
            columns: ["identity_appointment_id"]
            isOneToOne: false
            referencedRelation: "identity_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_identity_appointment_id_fkey"
            columns: ["identity_appointment_id"]
            isOneToOne: false
            referencedRelation: "identity_appointments_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_queue_customer_id_fkey"
            columns: ["queue_customer_id"]
            isOneToOne: false
            referencedRelation: "queue_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_queue_customer_id_fkey"
            columns: ["queue_customer_id"]
            isOneToOne: false
            referencedRelation: "queue_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_whatsapp_service_id_fkey"
            columns: ["whatsapp_service_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_whatsapp_service_id_fkey"
            columns: ["whatsapp_service_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_services_public"
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
      shelters: {
        Row: {
          address: string
          amenities: string[] | null
          capacity: number | null
          contact_person: string | null
          created_at: string
          description: string | null
          elevation: number | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          max_water_level: number | null
          name: string
          operational_hours: string | null
          phone: string | null
          risk_level: string | null
          shelter_type: string
          updated_at: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          capacity?: number | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          elevation?: number | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          max_water_level?: number | null
          name: string
          operational_hours?: string | null
          phone?: string | null
          risk_level?: string | null
          shelter_type?: string
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          capacity?: number | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          elevation?: number | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          max_water_level?: number | null
          name?: string
          operational_hours?: string | null
          phone?: string | null
          risk_level?: string | null
          shelter_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      stations_history: {
        Row: {
          atm_pressure: number | null
          created_at: string
          feels_like: number | null
          humidity: number | null
          id: number
          rainfall_12h: number | null
          rainfall_168h: number | null
          rainfall_1h: number | null
          rainfall_24h: number | null
          rainfall_3h: number | null
          rainfall_48h: number | null
          rainfall_6h: number | null
          rainfall_72h: number | null
          rainfall_96h: number | null
          river_level: number | null
          solar_radiation: number | null
          sta_code: string | null
          sta_name: string | null
          sta_timestamp: string | null
          temperature: number | null
          wind_direction: number | null
          wind_guts: number | null
          wind_speed: number | null
        }
        Insert: {
          atm_pressure?: number | null
          created_at?: string
          feels_like?: number | null
          humidity?: number | null
          id?: number
          rainfall_12h?: number | null
          rainfall_168h?: number | null
          rainfall_1h?: number | null
          rainfall_24h?: number | null
          rainfall_3h?: number | null
          rainfall_48h?: number | null
          rainfall_6h?: number | null
          rainfall_72h?: number | null
          rainfall_96h?: number | null
          river_level?: number | null
          solar_radiation?: number | null
          sta_code?: string | null
          sta_name?: string | null
          sta_timestamp?: string | null
          temperature?: number | null
          wind_direction?: number | null
          wind_guts?: number | null
          wind_speed?: number | null
        }
        Update: {
          atm_pressure?: number | null
          created_at?: string
          feels_like?: number | null
          humidity?: number | null
          id?: number
          rainfall_12h?: number | null
          rainfall_168h?: number | null
          rainfall_1h?: number | null
          rainfall_24h?: number | null
          rainfall_3h?: number | null
          rainfall_48h?: number | null
          rainfall_6h?: number | null
          rainfall_72h?: number | null
          rainfall_96h?: number | null
          river_level?: number | null
          solar_radiation?: number | null
          sta_code?: string | null
          sta_name?: string | null
          sta_timestamp?: string | null
          temperature?: number | null
          wind_direction?: number | null
          wind_guts?: number | null
          wind_speed?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          project_id: string
          project_phase: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id: string
          project_phase?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string
          project_phase?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          name: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      time_records: {
        Row: {
          created_at: string | null
          id: string
          location: Json | null
          notes: string | null
          record_type: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: Json | null
          notes?: string | null
          record_type: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: Json | null
          notes?: string | null
          record_type?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          id: string
          language: string | null
          notifications_enabled: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          employee_id: string
          full_name: string
          id: string
          is_active: boolean | null
          position: string | null
          qr_code: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          employee_id: string
          full_name: string
          id?: string
          is_active?: boolean | null
          position?: string | null
          qr_code: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          employee_id?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          position?: string | null
          qr_code?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicle_bookings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          booking_date: string
          created_at: string | null
          destination: string
          end_time: string
          id: string
          observations: string | null
          passenger_count: number | null
          purpose: string
          server_department: string
          server_email: string | null
          server_name: string
          server_phone: string
          start_time: string
          status: string
          updated_at: string | null
          user_id: string | null
          vehicle_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          booking_date: string
          created_at?: string | null
          destination: string
          end_time: string
          id?: string
          observations?: string | null
          passenger_count?: number | null
          purpose: string
          server_department: string
          server_email?: string | null
          server_name: string
          server_phone: string
          start_time: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          booking_date?: string
          created_at?: string | null
          destination?: string
          end_time?: string
          id?: string
          observations?: string | null
          passenger_count?: number | null
          purpose?: string
          server_department?: string
          server_email?: string | null
          server_name?: string
          server_phone?: string
          start_time?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "fleet_vehicles"
            referencedColumns: ["id"]
          },
        ]
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
      waypoint_sessions: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          prefix: string
          started_at: string
          total_waypoints: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          prefix: string
          started_at?: string
          total_waypoints?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          prefix?: string
          started_at?: string
          total_waypoints?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      waypoints: {
        Row: {
          accuracy: number | null
          captured_at: string
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          sequence_number: number
          session_id: string
        }
        Insert: {
          accuracy?: number | null
          captured_at?: string
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          sequence_number: number
          session_id: string
        }
        Update: {
          accuracy?: number | null
          captured_at?: string
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          sequence_number?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waypoints_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "waypoint_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_services: {
        Row: {
          attendant_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string
          service_id: string
        }
        Insert: {
          attendant_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          service_id: string
        }
        Update: {
          attendant_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_services_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      identity_appointments_public: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          attendant_id: string | null
          called_at: string | null
          completed_at: string | null
          created_at: string | null
          id: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_appointments_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_public: {
        Row: {
          attendant_id: string | null
          called_at: string | null
          completed_at: string | null
          created_at: string | null
          id: string | null
          is_priority: boolean | null
          location_id: string | null
          queue_number: number | null
          service_id: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string | null
          is_priority?: boolean | null
          location_id?: string | null
          queue_number?: number | null
          service_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          attendant_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string | null
          is_priority?: boolean | null
          location_id?: string | null
          queue_number?: number | null
          service_id?: string | null
          started_at?: string | null
          status?: string | null
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
      whatsapp_services_public: {
        Row: {
          attendant_id: string | null
          created_at: string | null
          id: string | null
          service_id: string | null
        }
        Insert: {
          attendant_id?: string | null
          created_at?: string | null
          id?: string | null
          service_id?: string | null
        }
        Update: {
          attendant_id?: string | null
          created_at?: string | null
          id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_services_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_update_user_type: {
        Args: { new_user_type: string; target_user_id: string }
        Returns: boolean
      }
      check_survey_rate_limit: { Args: never; Returns: boolean }
      generate_unique_qr_code: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_next_queue_number: { Args: never; Returns: number }
      get_next_queue_number_by_location: {
        Args: { location_uuid?: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_attendant_or_admin: { Args: never; Returns: boolean }
      is_receptionist_or_admin: { Args: never; Returns: boolean }
      lookup_profile_by_qr_code: {
        Args: { qr_code_input: string }
        Returns: {
          full_name: string
          id: string
          user_type: string
        }[]
      }
      register_time_record: {
        Args: { p_location?: Json; p_notes?: string; p_user_id: string }
        Returns: Json
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
