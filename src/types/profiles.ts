export type UserRole = 'admin' | 'advogado' | 'estagiario' | 'supervisor'

export type AreaDireito = 'Trabalhista' | 'Reestruturação' | 'Societário e Contratos' | 'Distressed Deals' | 'Cível' | null

export interface Profile {
  id: string
  created_at: string
  updated_at: string
  nome: string
  role: UserRole
  email: string
  ativo: boolean
  area: AreaDireito
}

export interface ProfileInsert {
  id?: string
  nome: string
  email: string
  role?: UserRole
  ativo?: boolean
  area?: AreaDireito
}

export interface ProfileUpdate {
  nome?: string
  email?: string
  role?: UserRole
  ativo?: boolean
  area?: AreaDireito
}

export const AREAS_DIREITO: AreaDireito[] = [
  'Trabalhista',
  'Reestruturação',
  'Societário e Contratos',
  'Distressed Deals',
  'Cível'
]
