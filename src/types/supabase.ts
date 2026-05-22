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
          created_at: string
          updated_at: string
          nome: string
          email: string
          role: string
          ativo: boolean
          area: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          nome: string
          email: string
          role?: string
          ativo?: boolean
          area?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          nome?: string
          email?: string
          role?: string
          ativo?: boolean
          area?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      favoritos: {
        Row: {
          id: string
          user_id: string
          tese_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tese_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tese_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'favoritos_tese_id_fkey'
            columns: ['tese_id']
            isOneToOne: false
            referencedRelation: 'teses'
            referencedColumns: ['id']
          },
        ]
      }
      colaboradores_pendentes: {
        Row: {
          id: string
          nome: string
          email: string
          departamento: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          departamento?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          departamento?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      tese_solicitacoes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          titulo_sugerido: string
          descricao: string | null
          area: string | null
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          titulo_sugerido: string
          descricao?: string | null
          area?: string | null
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          titulo_sugerido?: string
          descricao?: string | null
          area?: string | null
          status?: string
        }
        Relationships: []
      }
      tese_visualizacoes: {
        Row: {
          id: string
          created_at: string
          tese_id: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          tese_id: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          tese_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tese_visualizacoes_tese_id_fkey'
            columns: ['tese_id']
            isOneToOne: false
            referencedRelation: 'teses'
            referencedColumns: ['id']
          },
        ]
      }
      teses: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          identificador: string
          titulo: string
          descricao: string | null
          area: string | null
          assuntos: string[] | null
          texto_conteudo: string | null
          link_externo: string | null
          user_id: string | null
          tipo_tese: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          identificador: string
          titulo: string
          descricao?: string | null
          area?: string | null
          assuntos?: string[] | null
          texto_conteudo?: string | null
          link_externo?: string | null
          user_id?: string | null
          tipo_tese?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          identificador?: string
          titulo?: string
          descricao?: string | null
          area?: string | null
          assuntos?: string[] | null
          texto_conteudo?: string | null
          link_externo?: string | null
          user_id?: string | null
          tipo_tese?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ranking_teses_por_acesso: {
        Args: { p_limit: number }
        Returns: {
          tese_id: string
          titulo: string
          identificador: string
          acessos: number
        }[]
      }
      search_teses: {
        Args: {
          search_term: string
        }
        Returns: {
          id: string
          created_at: string
          updated_at: string
          identificador: string
          titulo: string
          descricao: string | null
          area: string | null
          assuntos: string[] | null
          texto_conteudo: string | null
          link_externo: string | null
          user_id: string | null
          tipo_tese: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tese = Database['public']['Tables']['teses']['Row']
export type TeseInsert = Database['public']['Tables']['teses']['Insert']
export type TeseUpdate = Database['public']['Tables']['teses']['Update']
