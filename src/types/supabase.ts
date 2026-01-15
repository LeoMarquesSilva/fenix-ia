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
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
