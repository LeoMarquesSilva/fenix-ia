import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile, ProfileInsert, ProfileUpdate } from '@/types/profiles'

// Função para obter o token de autenticação
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

// Função auxiliar para fazer fetch com autenticação
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const authToken = await getAuthToken()
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

  const headers: Record<string, string> = {
    'apikey': supabaseKey,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  } else {
    headers['Authorization'] = `Bearer ${supabaseKey}`
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

// Buscar perfil do usuário atual
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url = `${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${user.id}`

      const response = await fetchWithAuth(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao buscar perfil: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      if (!data || data.length === 0) {
        throw new Error('Perfil não encontrado')
      }
      
      return data[0] as Profile
    },
  })
}

// Buscar perfil por ID (apenas admins)
export function useProfileById(id: string) {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url = `${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${id}`

      const response = await fetchWithAuth(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao buscar perfil: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      if (!data || data.length === 0) {
        throw new Error('Perfil não encontrado')
      }
      
      return data[0] as Profile
    },
    enabled: !!id,
  })
}

// Buscar todos os perfis (apenas admins)
export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url = `${supabaseUrl}/rest/v1/profiles?select=*&order=created_at.desc`

      console.log('🔍 useProfiles - Buscando perfis...')
      
      const response = await fetchWithAuth(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ useProfiles - Erro:', response.status, errorText)
        throw new Error(`Erro ao buscar perfis: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ useProfiles - Perfis encontrados:', data.length)
      
      return data as Profile[]
    },
  })
}

// Criar perfil (apenas admins via criação de usuário)
export function useCreateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (profile: ProfileInsert) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url = `${supabaseUrl}/rest/v1/profiles`

      const response = await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify(profile),
        headers: {
          'Prefer': 'return=representation',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao criar perfil: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return data[0] as Profile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

// Atualizar perfil
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProfileUpdate }) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${id}`

      const response = await fetchWithAuth(url, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: {
          'Prefer': 'return=representation',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao atualizar perfil: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return data[0] as Profile
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['profile', variables.id] })
    },
  })
}

// Deletar perfil
export function useDeleteProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${id}`

      const response = await fetchWithAuth(url, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao deletar perfil: ${response.status} ${errorText}`)
      }

      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profile', id] })
    },
  })
}
