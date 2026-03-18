import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tese, TeseInsert, TeseUpdate } from '@/types/supabase'

interface TeseFilters {
  search?: string
  area?: string
  assunto?: string
  tipoTese?: string
  criadorId?: string
  dataInicio?: string
  dataFim?: string
  ordenacao?: 'recentes' | 'antigos' | 'titulo_asc' | 'titulo_desc'
  page?: number
  pageSize?: number
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
  const { search, area, assunto, tipoTese, criadorId, dataInicio, dataFim, ordenacao = 'recentes', page = 1, pageSize = 20 } = filters

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
        
        if (search) {
          params.push(`or=(titulo.ilike.*${search}*,descricao.ilike.*${search}*,texto_conteudo.ilike.*${search}*)`)
        }
        if (area) {
          params.push(`area=eq.${encodeURIComponent(area)}`)
        }
        if (assunto) {
          params.push(`assuntos=cs.{${encodeURIComponent(assunto)}}`)
        }
        if (tipoTese) {
          params.push(`tipo_tese=eq.${encodeURIComponent(tipoTese)}`)
        }
        if (criadorId) {
          params.push(`user_id=eq.${criadorId}`)
        }
        if (dataInicio) {
          params.push(`created_at=gte.${dataInicio}T00:00:00`)
        }
        if (dataFim) {
          params.push(`created_at=lte.${dataFim}T23:59:59`)
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
        
        const contentRange = response.headers.get('content-range')
        let count = data.length
        if (contentRange) {
          const totalMatch = contentRange.match(/\/(\d+)$/)
          if (totalMatch) {
            count = parseInt(totalMatch[1])
          }
        }
        
        console.log('✅ useTeses - Sucesso!', data.length, 'teses, total:', count)
        
        return {
          data: data as Tese[],
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
      
      return data[0] as Tese
    },
    enabled: !!id,
  })
}

export function useCreateTese() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tese: TeseInsert) => {
      console.log('📝 useCreateTese - Criando tese:', tese.titulo)
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url = `${supabaseUrl}/rest/v1/teses`
      
      const response = await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify(tese),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ useCreateTese - Erro:', response.status, errorText)
        throw new Error(`Erro ao criar tese: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ useCreateTese - Sucesso!')
      return data[0] as Tese
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
      console.log('📝 useUpdateTese - Atualizando tese:', id)
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url = `${supabaseUrl}/rest/v1/teses?id=eq.${id}`
      
      const response = await fetchWithAuth(url, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ useUpdateTese - Erro:', response.status, errorText)
        throw new Error(`Erro ao atualizar tese: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ useUpdateTese - Sucesso!')
      return data[0] as Tese
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
      console.log('📝 useUpsertTeses - Upserting', teses.length, 'teses')
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const url = `${supabaseUrl}/rest/v1/teses`
      
      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(teses),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ useUpsertTeses - Erro:', response.status, errorText)
        throw new Error(`Erro ao importar teses: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ useUpsertTeses - Sucesso!', data.length, 'teses')
      return data as Tese[]
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
