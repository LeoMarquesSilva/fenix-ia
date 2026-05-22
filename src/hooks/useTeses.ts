import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  normalizeTeseInsert,
  normalizeTeseRow,
  normalizeTeseUpdate,
} from '@/lib/teseFormat'
import type { Tese, TeseInsert, TeseUpdate } from '@/types/supabase'

interface TeseFilters {
  search?: string
  area?: string
  assunto?: string
  tipoTese?: string
  ordenacao?: 'recentes' | 'antigos' | 'titulo_asc' | 'titulo_desc'
  page?: number
  pageSize?: number
  includePrivatePeticoes?: boolean
  includePrivateContratos?: boolean
}

// Função auxiliar para obter token de autenticação
async function getAuthToken(): Promise<string> {
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      return session.access_token
    }
  } catch (error) {
    console.warn('Erro ao obter sessão, usando chave anônima:', error)
  }
  
  return supabaseKey
}

// Função auxiliar para fazer fetch com autenticação
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  const authToken = await getAuthToken()
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers,
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}

export function useTeses(filters: TeseFilters = {}) {
  const {
    search,
    area,
    assunto,
    tipoTese,
    ordenacao = 'recentes',
    page = 1,
    pageSize = 20,
    includePrivatePeticoes = false,
    includePrivateContratos = false,
  } = filters

  return useQuery({
    queryKey: ['teses', filters],
    queryFn: async () => {
      console.log('🚀 useTeses - Iniciando query com filters:', filters)
      
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Variáveis de ambiente do Supabase não configuradas')
        }
        
        // Construir URL da API REST do Supabase
        const baseUrl = `${supabaseUrl}/rest/v1/teses`
        
        // Construir query string
        const params: string[] = []
        params.push('select=*')
        
        // Ordenação
        switch (ordenacao) {
          case 'antigos':
            params.push('order=created_at.asc')
            break
          case 'titulo_asc':
            params.push('order=titulo.asc')
            break
          case 'titulo_desc':
            params.push('order=titulo.desc')
            break
          default: // recentes
            params.push('order=created_at.desc')
        }
        
        const safeSearch = search ? encodeURIComponent(search) : ''
        const searchExpr = search
          ? `or(titulo.ilike.*${safeSearch}*,descricao.ilike.*${safeSearch}*,texto_conteudo.ilike.*${safeSearch}*)`
          : ''
        let visibilityExpr = ''
        if (area) {
          params.push(`area=eq.${encodeURIComponent(area)}`)
        }
        if (assunto) {
          params.push(`assuntos=cs.{${encodeURIComponent(assunto)}}`)
        }
        if (tipoTese) {
          params.push(`tipo_tese=eq.${encodeURIComponent(tipoTese)}`)
        }
        if (!includePrivatePeticoes || !includePrivateContratos) {
          const privateTypes: string[] = []
          if (!includePrivatePeticoes) privateTypes.push('"Petição Inicial Privada"')
          if (!includePrivateContratos) {
            privateTypes.push('"Contrato Privado - Prestação de Serviços"')
          }
          if (privateTypes.length > 0) {
            visibilityExpr = `or(tipo_tese.is.null,tipo_tese.not.in.(${privateTypes.join(',')}))`
          }
        }
        if (searchExpr && visibilityExpr) {
          params.push(`and=(${searchExpr},${visibilityExpr})`)
        } else if (searchExpr) {
          params.push(searchExpr.replace('or(', 'or=(').replace(/\)$/, ')'))
        } else if (visibilityExpr) {
          params.push(visibilityExpr.replace('or(', 'or=(').replace(/\)$/, ')'))
        }
        
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        
        const url = `${baseUrl}?${params.join('&')}`
        
        console.log('🌐 useTeses - Fazendo fetch para:', url)
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'count=exact',
            'Range': `${from}-${to}`,
          },
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ useTeses - Erro:', response.status, errorText)
          throw new Error(`Erro ao buscar teses: ${response.status} ${errorText}`)
        }
        
        const data = await response.json()
        const normalized = (data as Tese[]).map(normalizeTeseRow)

        const contentRange = response.headers.get('content-range')
        let count = normalized.length
        if (contentRange) {
          const totalMatch = contentRange.match(/\/(\d+)$/)
          if (totalMatch) {
            count = parseInt(totalMatch[1])
          }
        }

        console.log('✅ useTeses - Sucesso!', normalized.length, 'teses, total:', count)

        return {
          data: normalized,
          count: count || data.length,
          page,
          pageSize,
          totalPages: Math.ceil((count || data.length) / pageSize),
        }
      } catch (error: any) {
        console.error('❌ useTeses - Erro:', error)
        throw error
      }
    },
  })
}

export function useMyPrivatePeticoes() {
  return useQuery({
    queryKey: ['my-private-peticoes'],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid) throw new Error('Usuário não autenticado')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url =
        `${supabaseUrl}/rest/v1/teses?` +
        `select=*&user_id=eq.${uid}&tipo_tese=eq.${encodeURIComponent('Petição Inicial Privada')}&order=created_at.desc`

      const response = await fetchWithAuth(url, {
        method: 'GET',
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao buscar petições privadas: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return (data as Tese[]).map(normalizeTeseRow)
    },
  })
}

export function useMyPrivateContratos() {
  return useQuery({
    queryKey: ['my-private-contratos'],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid) throw new Error('Usuário não autenticado')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url =
        `${supabaseUrl}/rest/v1/teses?` +
        `select=*&user_id=eq.${uid}&tipo_tese=eq.${encodeURIComponent('Contrato Privado - Prestação de Serviços')}&order=created_at.desc`

      const response = await fetchWithAuth(url, {
        method: 'GET',
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao buscar contratos privados: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return (data as Tese[]).map(normalizeTeseRow)
    },
  })
}

export function useTese(id: string) {
  return useQuery({
    queryKey: ['tese', id],
    queryFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      
      const url = `${supabaseUrl}/rest/v1/teses?id=eq.${id}&select=*`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Erro ao buscar tese')
      }
      
      const data = await response.json()
      if (data.length === 0) {
        throw new Error('Tese não encontrada')
      }
      
      return normalizeTeseRow(data[0] as Tese)
    },
    enabled: !!id,
  })
}

export function useCreateTese() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tese: TeseInsert) => {
      const payload = normalizeTeseInsert(tese)
      console.log('📝 useCreateTese - Criando tese:', payload.titulo)

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url = `${supabaseUrl}/rest/v1/teses`

      const response = await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ useCreateTese - Erro:', response.status, errorText)
        throw new Error(`Erro ao criar tese: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ useCreateTese - Sucesso!')
      return normalizeTeseRow(data[0] as Tese)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teses'] })
    },
  })
}

export function useUpdateTese() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TeseUpdate }) => {
      const payload = normalizeTeseUpdate(updates)
      console.log('📝 useUpdateTese - Atualizando tese:', id)

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url = `${supabaseUrl}/rest/v1/teses?id=eq.${id}`

      const response = await fetchWithAuth(url, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ useUpdateTese - Erro:', response.status, errorText)
        throw new Error(`Erro ao atualizar tese: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ useUpdateTese - Sucesso!')
      return normalizeTeseRow(data[0] as Tese)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teses'] })
      queryClient.invalidateQueries({ queryKey: ['tese', variables.id] })
    },
  })
}

export function useUpsertTeses() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (teses: TeseInsert[]) => {
      const payload = teses.map(normalizeTeseInsert)
      console.log('📝 useUpsertTeses - Upserting', payload.length, 'teses')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url = `${supabaseUrl}/rest/v1/teses`

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ useUpsertTeses - Erro:', response.status, errorText)
        throw new Error(`Erro ao importar teses: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ useUpsertTeses - Sucesso!', data.length, 'teses')
      return (data as Tese[]).map(normalizeTeseRow)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teses'] })
    },
  })
}

export function useDeleteTese() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ useDeleteTese - Excluindo tese:', id)
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url = `${supabaseUrl}/rest/v1/teses?id=eq.${id}`
      
      const response = await fetchWithAuth(url, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ useDeleteTese - Erro:', response.status, errorText)
        
        // Verificar se é erro de RLS/permissão
        if (response.status === 403 || errorText.includes('policy')) {
          throw new Error('Você não tem permissão para excluir esta tese. Execute o script fix_delete_policy.sql no Supabase.')
        }
        
        throw new Error(`Erro ao excluir tese: ${response.status} ${errorText}`)
      }
      
      console.log('✅ useDeleteTese - Sucesso!')
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['teses'] })
      queryClient.invalidateQueries({ queryKey: ['tese', id] })
    },
  })
}
