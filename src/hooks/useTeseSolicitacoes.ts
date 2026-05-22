import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

export type TeseSolicitacaoRow =
  Database['public']['Tables']['tese_solicitacoes']['Row']

export function useTeseSolicitacoes() {
  return useQuery({
    queryKey: ['tese-solicitacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tese_solicitacoes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as TeseSolicitacaoRow[]
    },
  })
}

export function useCreateTeseSolicitacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      titulo_sugerido: string
      descricao?: string | null
      area?: string | null
      user_id: string
    }) => {
      const { data, error } = await supabase
        .from('tese_solicitacoes')
        .insert({
          titulo_sugerido: payload.titulo_sugerido.trim(),
          descricao: payload.descricao?.trim() || null,
          area: payload.area || null,
          user_id: payload.user_id,
        })
        .select('id')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tese-solicitacoes'] })
    },
  })
}

export function useUpdateTeseSolicitacaoStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { id: string; status: string }) => {
      const { error } = await supabase
        .from('tese_solicitacoes')
        .update({ status: payload.status })
        .eq('id', payload.id)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tese-solicitacoes'] })
    },
  })
}
