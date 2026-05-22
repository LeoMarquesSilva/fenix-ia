import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ColaboradorPendente } from '@/types/profiles'

export function useColaboradoresPendentes() {
  return useQuery({
    queryKey: ['colaboradores-pendentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colaboradores_pendentes')
        .select('*')
        .order('nome')

      if (error) throw error
      return (data ?? []) as ColaboradorPendente[]
    },
  })
}

export function useDeleteColaboradorPendente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('colaboradores_pendentes')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores-pendentes'] })
    },
  })
}
