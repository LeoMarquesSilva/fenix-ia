import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfiles, useUpdateProfile, useDeleteProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { 
  ArrowLeft, 
  UserPlus, 
  Edit, 
  Save, 
  X, 
  Trash2, 
  Mail, 
  User, 
  Shield, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Users,
  Crown,
  Briefcase,
  GraduationCap,
  Eye
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { UserRole, AreaDireito } from '@/types/profiles'
import { AREAS_DIREITO } from '@/types/profiles'

export default function UsersManagement() {
  const { isAdmin, profile: currentProfile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: profiles, isLoading, error, refetch } = useProfiles()
  const updateMutation = useUpdateProfile()
  const deleteMutation = useDeleteProfile()
  const [isCreating, setIsCreating] = useState(false)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', email: '', role: 'advogado' as UserRole, ativo: true, area: null as AreaDireito })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({ 
    nome: '', 
    email: '', 
    senha: '', 
    role: 'advogado' as UserRole,
    area: null as AreaDireito
  })

  // Estatísticas
  const stats = {
    total: profiles?.length || 0,
    admins: profiles?.filter(p => p.role === 'admin').length || 0,
    advogados: profiles?.filter(p => p.role === 'advogado').length || 0,
    supervisores: profiles?.filter(p => p.role === 'supervisor').length || 0,
    estagiarios: profiles?.filter(p => p.role === 'estagiario').length || 0,
    ativos: profiles?.filter(p => p.ativo).length || 0,
  }

  // Redirecionar se não for admin
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a2744] to-[#0f1d32]" />
        <Card className="relative bg-white/10 backdrop-blur-xl border-white/10">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Acesso Negado</h2>
            <p className="text-white/60 mb-6">Você não tem permissão para acessar esta página.</p>
            <Button onClick={() => navigate('/dashboard')} className="bg-white/10 hover:bg-white/20 text-white">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCreateUser = async () => {
    if (!createForm.nome || !createForm.email || !createForm.senha) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      })
      return
    }

    if (createForm.senha.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 6 caracteres',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      const { data: currentSessionData } = await supabase.auth.getSession()
      const currentSession = currentSessionData.session
      
      if (!currentSession) {
        throw new Error('Você precisa estar logado para criar usuários')
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

      const tempClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: createForm.email,
        password: createForm.senha,
        options: {
          data: {
            nome: createForm.nome,
            role: createForm.role,
            area: createForm.area,
          },
        },
      })

      if (authError) {
        throw authError
      }
      
      const newUserId = authData.user?.id
      
      if (newUserId) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${newUserId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            nome: createForm.nome,
            role: createForm.role,
            area: createForm.area,
          }),
        })

        if (!response.ok) {
          console.error('Erro ao atualizar perfil:', await response.text())
        }
      }

      toast({
        title: 'Sucesso',
        description: `Usuário "${createForm.nome}" criado com sucesso!`,
      })

      setCreateForm({ nome: '', email: '', senha: '', role: 'advogado', area: null })
      setShowCreateForm(false)
      
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      refetch()
    } catch (error: any) {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEdit = (profile: any) => {
    setEditingId(profile.id)
    setEditForm({
      nome: profile.nome,
      email: profile.email,
      role: profile.role,
      ativo: profile.ativo,
      area: profile.area || null,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return

    try {
      await updateMutation.mutateAsync({
        id: editingId,
        updates: {
          nome: editForm.nome,
          email: editForm.email,
          role: editForm.role,
          ativo: editForm.ativo,
          area: editForm.area,
        },
      })

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso!',
      })

      setEditingId(null)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar usuário',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    
    if (userToDelete === currentProfile?.id) {
      toast({
        title: 'Erro',
        description: 'Você não pode excluir seu próprio perfil.',
        variant: 'destructive',
      })
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      return
    }

    try {
      await deleteMutation.mutateAsync(userToDelete)

      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso!',
      })

      setDeleteDialogOpen(false)
      setUserToDelete(null)
      refetch()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir usuário',
        variant: 'destructive',
      })
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />
      case 'supervisor':
        return <Eye className="h-4 w-4" />
      case 'advogado':
        return <Briefcase className="h-4 w-4" />
      case 'estagiario':
        return <GraduationCap className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
      case 'supervisor':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
      case 'advogado':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      case 'estagiario':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a2744] to-[#0f1d32]" />
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/dashboard')}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-400" />
                    Gerenciamento de Usuários
                  </h1>
                  <p className="text-xs text-white/50">Administre os usuários da plataforma</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate('/roles')}
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Ver Permissões
                </Button>
                <Button
                  onClick={() => refetch()}
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo Usuário
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
                <div className="text-xs text-white/50 flex items-center justify-center gap-1">
                  <Users className="h-3 w-3" />
                  Total
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-red-400 mb-1">{stats.admins}</div>
                <div className="text-xs text-white/50 flex items-center justify-center gap-1">
                  <Crown className="h-3 w-3" />
                  Admins
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">{stats.advogados}</div>
                <div className="text-xs text-white/50 flex items-center justify-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Advogados
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">{stats.supervisores}</div>
                <div className="text-xs text-white/50 flex items-center justify-center gap-1">
                  <Eye className="h-3 w-3" />
                  Supervisores
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">{stats.estagiarios}</div>
                <div className="text-xs text-white/50 flex items-center justify-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  Estagiários
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-1">{stats.ativos}</div>
                <div className="text-xs text-white/50 flex items-center justify-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Ativos
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulário de criação */}
          {showCreateForm && (
            <Card className="mb-8 bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-purple-400" />
                  Criar Novo Usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-400" />
                      Nome Completo
                    </label>
                    <Input
                      value={createForm.nome}
                      onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })}
                      placeholder="Digite o nome completo"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-purple-400" />
                      Email
                    </label>
                    <Input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-400" />
                      Senha
                    </label>
                    <Input
                      type="password"
                      value={createForm.senha}
                      onChange={(e) => setCreateForm({ ...createForm, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <Crown className="h-4 w-4 text-purple-400" />
                      Função
                    </label>
                    <Select
                      value={createForm.role}
                      onValueChange={(value: UserRole) => setCreateForm({ ...createForm, role: value })}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">👑 Admin</SelectItem>
                        <SelectItem value="advogado">💼 Advogado</SelectItem>
                        <SelectItem value="supervisor">👁️ Supervisor</SelectItem>
                        <SelectItem value="estagiario">🎓 Estagiário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-purple-400" />
                      Área do Direito
                    </label>
                    <Select
                      value={createForm.area || '_none'}
                      onValueChange={(value) => setCreateForm({ ...createForm, area: value === '_none' ? null : value as AreaDireito })}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Selecione a área" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Nenhuma</SelectItem>
                        {AREAS_DIREITO.map((area) => (
                          <SelectItem key={area} value={area!}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <Button 
                    onClick={handleCreateUser} 
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Criar Usuário
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCreateForm(false)
                      setCreateForm({ nome: '', email: '', senha: '', role: 'advogado', area: null })
                    }}
                    disabled={isCreating}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de usuários */}
          {error && (
            <Card className="mb-6 bg-red-500/10 border-red-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-300">Erro ao carregar usuários</p>
                  <p className="text-xs text-red-400/70">{error.message}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => refetch()} className="border-red-500/50 text-red-300 hover:bg-red-500/20">
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          )}
          
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto"></div>
                <p className="text-sm text-white/50">Carregando usuários...</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles?.map((profile) => (
                <Card 
                  key={profile.id} 
                  className={`bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-[1.02] ${
                    profile.id === currentProfile?.id ? 'ring-2 ring-purple-500/50' : ''
                  }`}
                >
                  <CardContent className="p-5">
                    {editingId === profile.id ? (
                      <div className="space-y-4">
                        <Input
                          value={editForm.nome}
                          onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Nome"
                        />
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Email"
                        />
                        <Select
                          value={editForm.role}
                          onValueChange={(value: UserRole) => setEditForm({ ...editForm, role: value })}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="advogado">Advogado</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="estagiario">Estagiário</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={editForm.area || '_none'}
                          onValueChange={(value) => setEditForm({ ...editForm, area: value === '_none' ? null : value as AreaDireito })}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Área do Direito" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">Nenhuma</SelectItem>
                            {AREAS_DIREITO.map((area) => (
                              <SelectItem key={area} value={area!}>{area}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveEdit} size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                            <Save className="mr-2 h-4 w-4" />
                            Salvar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                            {profile.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex items-center gap-1">
                            {profile.id === currentProfile?.id && (
                              <span className="rounded-full bg-purple-500/30 border border-purple-500/50 px-2 py-0.5 text-xs font-medium text-purple-300">
                                Você
                              </span>
                            )}
                            {!profile.ativo && (
                              <span className="rounded-full bg-red-500/30 border border-red-500/50 px-2 py-0.5 text-xs font-medium text-red-300">
                                Inativo
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-white mb-1 truncate">{profile.nome}</h3>
                        
                        <div className="flex items-center gap-2 text-sm text-white/50 mb-2">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{profile.email}</span>
                        </div>
                        
                        {profile.area && (
                          <div className="flex items-center gap-2 text-sm text-white/50 mb-3">
                            <Briefcase className="h-3 w-3" />
                            <span>{profile.area}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                            {getRoleIcon(profile.role)}
                            {profile.role}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(profile)}
                              className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {profile.id !== currentProfile?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setUserToDelete(profile.id)
                                  setDeleteDialogOpen(true)
                                }}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1a2744] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
