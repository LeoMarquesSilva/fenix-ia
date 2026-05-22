export type UserRole = 'admin' | 'advogado' | 'estagiario' | 'supervisor'

export type AreaDireito = 'Trabalhista' | 'Reestruturação' | 'Societário e Contratos' | 'Distressed Deals' | 'Cível' | 'Operações Legais' | 'Geral' | 'T.I' | null

export interface Profile {
  id: string
  created_at: string
  updated_at: string
  nome: string
  role: UserRole
  email: string
  ativo: boolean
  area: AreaDireito
  avatar_url?: string | null
}

export interface ProfileInsert {
  id?: string
  nome: string
  email: string
  role?: UserRole
  ativo?: boolean
  area?: AreaDireito
  avatar_url?: string | null
}

export interface ProfileUpdate {
  nome?: string
  email?: string
  role?: UserRole
  ativo?: boolean
  area?: AreaDireito
  avatar_url?: string | null
}

export const AREAS_DIREITO: AreaDireito[] = [
  'Trabalhista',
  'Reestruturação',
  'Societário e Contratos',
  'Distressed Deals',
  'Cível',
  'Operações Legais',
  'Geral',
  'T.I',
]

export interface ColaboradorPendente {
  id: string
  nome: string
  email: string
  departamento: string | null
  avatar_url: string | null
  created_at: string
}
