export type UserRole = 'admin' | 'advogado' | 'estagiario' | 'supervisor'

export interface Profile {
  id: string
  created_at: string
  updated_at: string
  nome: string
  role: UserRole
  email: string
  ativo: boolean
}

export interface ProfileInsert {
  id?: string
  nome: string
  email: string
  role?: UserRole
  ativo?: boolean
}

export interface ProfileUpdate {
  nome?: string
  email?: string
  role?: UserRole
  ativo?: boolean
}
