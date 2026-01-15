import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface Favorito {
  id: string
  user_id: string
  tese_id: string
  created_at: string
}

// Hook para buscar favoritos do usuário
export function useFavorites() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['favoritos', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('favoritos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar favoritos:', error)
        return []
      }

      return data as Favorito[]
    },
    enabled: !!user?.id,
  })
}

// Hook para verificar se uma tese é favorita
export function useIsFavorite(teseId: string) {
  const { data: favoritos } = useFavorites()
  return favoritos?.some(f => f.tese_id === teseId) || false
}

// Hook para adicionar favorito
export function useAddFavorite() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (teseId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('favoritos')
        .insert({
          user_id: user.id,
          tese_id: teseId,
        } as any)
        .select()
        .single()

      if (error) {
        // Se já existe, não é erro
        if (error.code === '23505') {
          return null
        }
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos'] })
    },
  })
}

// Hook para remover favorito
export function useRemoveFavorite() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (teseId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('user_id', user.id)
        .eq('tese_id', teseId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos'] })
    },
  })
}

// Hook para toggle favorito (adicionar ou remover)
export function useToggleFavorite() {
  const { data: favoritos } = useFavorites()
  const addMutation = useAddFavorite()
  const removeMutation = useRemoveFavorite()

  const toggleFavorite = async (teseId: string) => {
    const isFavorite = favoritos?.some(f => f.tese_id === teseId)
    
    if (isFavorite) {
      await removeMutation.mutateAsync(teseId)
      return false
    } else {
      await addMutation.mutateAsync(teseId)
      return true
    }
  }

  return {
    toggleFavorite,
    isLoading: addMutation.isPending || removeMutation.isPending,
  }
}

// Hook para buscar IDs das teses favoritas (útil para filtros)
export function useFavoriteIds() {
  const { data: favoritos } = useFavorites()
  return favoritos?.map(f => f.tese_id) || []
}
