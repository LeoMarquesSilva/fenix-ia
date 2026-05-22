import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type TeseRankingRow = {
  tese_id: string
  titulo: string
  identificador: string
  acessos: number
}

export function useTeseRanking(limit = 15) {
  return useQuery({
    queryKey: ['tese-ranking', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('ranking_teses_por_acesso', {
        p_limit: limit,
      })
      if (error) throw error
      return (data || []) as TeseRankingRow[]
    },
  })
}
