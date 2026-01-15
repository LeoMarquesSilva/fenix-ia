import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/profiles'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
  isAdvogado: boolean
  isSupervisor: boolean
  isEstagiario: boolean
  canEditAllTeses: boolean
  canDeleteTeses: boolean
  canManageUsers: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef(false)

  // Função auxiliar para ignorar erros de abort
  const isAbortError = (error: any): boolean => {
    if (!error) return false
    return (
      error.name === 'AbortError' ||
      error.message?.includes('AbortError') ||
      error.message?.includes('aborted') ||
      error.message?.includes('signal is aborted')
    )
  }

  // Criar perfil mínimo em memória
  const createFallbackProfile = (userId: string, email: string): Profile => {
    return {
      id: userId,
      nome: email.split('@')[0] || 'Usuário',
      email: email,
      role: 'advogado',
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  const fetchProfile = async (userId: string, userEmail?: string) => {
    // Evitar múltiplas chamadas simultâneas
    if (fetchingRef.current) {
      return
    }
    
    fetchingRef.current = true
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Ignorar completamente erros de abort
        if (isAbortError(error)) {
          fetchingRef.current = false
          return
        }

        // Se o perfil não existe, tentar criar
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          try {
            const emailToUse = userEmail || user?.email || ''
            if (!emailToUse) {
              // Se não temos email, criar perfil mínimo em memória
              const { data: userData } = await supabase.auth.getUser()
              if (userData?.user?.email) {
                const fallback = createFallbackProfile(userId, userData.user.email)
                setProfile(fallback)
                fetchingRef.current = false
                return
              }
            }

            // Tentar criar perfil no banco
            const { data: newProfile, error: createError } = await (supabase
              .from('profiles') as any)
              .insert({
                id: userId,
                nome: emailToUse.split('@')[0] || 'Usuário',
                email: emailToUse,
                role: 'advogado',
                ativo: true,
              })
              .select()
              .single()

            if (createError) {
              // Se falhar ao criar, usar fallback
              if (!isAbortError(createError)) {
                console.warn('Erro ao criar perfil no banco:', createError)
              }
              const { data: userData } = await supabase.auth.getUser()
              if (userData?.user?.email) {
                setProfile(createFallbackProfile(userId, userData.user.email))
              }
            } else if (newProfile) {
              setProfile(newProfile as Profile)
            }
          } catch (err: any) {
            // Se qualquer coisa falhar, usar fallback
            if (!isAbortError(err)) {
              console.warn('Erro ao processar perfil:', err)
            }
            const { data: userData } = await supabase.auth.getUser()
            if (userData?.user?.email) {
              setProfile(createFallbackProfile(userId, userData.user.email))
            }
          }
        } else {
          // Outro tipo de erro - usar fallback
          if (!isAbortError(error)) {
            console.error('Erro ao buscar perfil:', error)
          }
          const { data: userData } = await supabase.auth.getUser()
          if (userData?.user?.email) {
            setProfile(createFallbackProfile(userId, userData.user.email))
          }
        }
        fetchingRef.current = false
        return
      }

      // Sucesso - definir perfil
      if (data) {
        setProfile(data as Profile)
      }
    } catch (error: any) {
      // Qualquer erro - usar fallback
      if (!isAbortError(error)) {
        console.error('Erro ao buscar perfil:', error)
      }
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user?.email) {
        setProfile(createFallbackProfile(userId, userData.user.email))
      }
    } finally {
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    // Timeout de segurança - SEMPRE definir loading como false após 3 segundos
    timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 3000)

    // Verificar sessão atual
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (!mounted) return
        
        // Sempre definir loading como false, mesmo com erro
        if (mounted) {
          setLoading(false)
        }

        if (error) {
          if (!isAbortError(error)) {
            console.error('Error getting session:', error)
          }
          return
        }

        setUser(session?.user ?? null)
        if (session?.user) {
          // Buscar perfil sem bloquear
          fetchProfile(session.user.id, session.user.email).catch(() => {
            // Ignorar erros silenciosamente
          })
        }
      })
      .catch((err: any) => {
        if (mounted) {
          setLoading(false)
        }
        if (!isAbortError(err)) {
          console.error('Error in getSession:', err)
        }
      })

    // Ouvir mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      
      setUser(session?.user ?? null)
      
      if (mounted) {
        setLoading(false)
      }

      if (session?.user) {
        // Buscar perfil sem bloquear
        fetchProfile(session.user.id, session.user.email).catch(() => {
          // Ignorar erros silenciosamente
        })
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error && !isAbortError(error)) {
      throw error
    }
    
    // Se login bem-sucedido, buscar perfil
    if (data.user) {
      fetchProfile(data.user.id, data.user.email).catch(() => {
        // Ignorar erros silenciosamente
      })
    }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    })
    
    if (error && !isAbortError(error)) {
      throw error
    }
    
    // Se o usuário foi criado, buscar perfil
    if (data.user) {
      if (data.session) {
        setUser(data.user)
      }
      fetchProfile(data.user.id, data.user.email).catch(() => {
        // Ignorar erros silenciosamente
      })
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error && !isAbortError(error)) {
      throw error
    }
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email)
    }
  }

  // Verificações de role
  const isAdmin = profile?.role === 'admin'
  const isAdvogado = profile?.role === 'advogado'
  const isSupervisor = profile?.role === 'supervisor'
  const isEstagiario = profile?.role === 'estagiario'
  
  // Permissões baseadas em role
  const canEditAllTeses = isAdmin || isSupervisor
  const canDeleteTeses = isAdmin || isAdvogado || isSupervisor
  const canManageUsers = isAdmin

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile,
        loading, 
        signIn, 
        signUp, 
        signOut,
        isAdmin,
        isAdvogado,
        isSupervisor,
        isEstagiario,
        canEditAllTeses,
        canDeleteTeses,
        canManageUsers,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
