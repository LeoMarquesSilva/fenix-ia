import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfiles, useUpdateProfile, useDeleteProfile } from '@/hooks/useProfile'
import { useColaboradoresPendentes, useDeleteColaboradorPendente } from '@/hooks/useColaboradoresPendentes'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { 
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
  Eye,
  UserCheck
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { UserRole, AreaDireito, ColaboradorPendente } from '@/types/profiles'
import { AREAS_DIREITO } from '@/types/profiles'

export default function UsersManagement() {
  const { isAdmin, profile: currentProfile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: profiles, isLoading, error, refetch } = useProfiles()
  const { data: pendentes, refetch: refetchPendentes } = useColaboradoresPendentes()
  const updateMutation = useUpdateProfile()
  const deleteMutation = useDeleteProfile()
  const deletePendenteMutation = useDeleteColaboradorPendente()
  const [isCreating, setIsCreating] = useState(false)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', email: '', role: 'advogado' as UserRole, ativo: true, area: null as AreaDireito })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [ativarModalOpen, setAtivarModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ 
    nome: '', 
    email: '', 
    senha: '', 
    role: 'advogado' as UserRole,
    area: null as AreaDireito,
    pendenteId: null as string | null,
    avatarUrl: null as string | null
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
      <div className="container mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-4 py-12">
        <Card className="w-full border bg-card shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <Shield className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Acesso restrito
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Apenas administradores gerenciam usuários.
            </p>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Ir ao dashboard
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
            ...(createForm.avatarUrl && { avatar_url: createForm.avatarUrl }),
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

      if (createForm.pendenteId) {
        await deletePendenteMutation.mutateAsync(createForm.pendenteId)
        refetchPendentes()
        closeAtivarModal()
      } else {
        setCreateForm({ nome: '', email: '', senha: '', role: 'advogado', area: null, pendenteId: null, avatarUrl: null })
        setShowCreateForm(false)
      }
      
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

  const handleAtivarPendente = (p: ColaboradorPendente) => {
    const area = (p.departamento && AREAS_DIREITO.includes(p.departamento as AreaDireito))
      ? (p.departamento as AreaDireito)
      : null
    setCreateForm({
      nome: p.nome,
      email: p.email,
      senha: '',
      role: 'advogado',
      area,
      pendenteId: p.id,
      avatarUrl: p.avatar_url || null,
    })
    setAtivarModalOpen(true)
  }

  const closeAtivarModal = () => {
    setAtivarModalOpen(false)
    setCreateForm({ nome: '', email: '', senha: '', role: 'advogado', area: null, pendenteId: null, avatarUrl: null })
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
        return 'border border-destructive/30 bg-destructive/10 text-destructive'
      case 'supervisor':
        return 'border border-primary/30 bg-primary/10 text-primary'
      case 'advogado':
        return 'border border-fenix-purple-dark/30 bg-fenix-purple-dark/10 text-fenix-purple-dark dark:text-fenix-purple-light'
      case 'estagiario':
        return 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
      default:
        return 'border border-border bg-muted text-muted-foreground'
    }
  }

  return (
    <>
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Fênix I.A · Administração
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <Users className="h-7 w-7 text-primary" />
            Usuários
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastro, funções e áreas de atuação.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/roles')}>
            <Shield className="mr-2 h-4 w-4" />
            Funções e permissões
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Novo usuário
          </Button>
        </div>
      </div>

      <main className="space-y-8">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {[
              { n: stats.total, l: 'Total', i: Users, c: 'text-foreground' },
              { n: stats.admins, l: 'Admins', i: Crown, c: 'text-destructive' },
              { n: stats.advogados, l: 'Advogados', i: Briefcase, c: 'text-accent' },
              { n: stats.supervisores, l: 'Supervisores', i: Eye, c: 'text-primary' },
              { n: stats.estagiarios, l: 'Estagiários', i: GraduationCap, c: 'text-emerald-600 dark:text-emerald-400' },
              { n: stats.ativos, l: 'Ativos', i: CheckCircle, c: 'text-emerald-600 dark:text-emerald-400' },
            ].map(({ n, l, i: Icon, c }) => (
              <Card key={l} className="border bg-card shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold tabular-nums ${c}`}>{n}</div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    {l}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Formulário de criação */}
          {showCreateForm && (
            <Card className="border bg-card shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Novo usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Nome completo
                    </label>
                    <Input
                      value={createForm.nome}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, nome: e.target.value })
                      }
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      E-mail
                    </label>
                    <Input
                      type="email"
                      value={createForm.email}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, email: e.target.value })
                      }
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Senha
                    </label>
                    <Input
                      type="password"
                      value={createForm.senha}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, senha: e.target.value })
                      }
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Crown className="h-4 w-4 text-muted-foreground" />
                      Função
                    </label>
                    <Select
                      value={createForm.role}
                      onValueChange={(value: UserRole) =>
                        setCreateForm({ ...createForm, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="advogado">Advogado</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="estagiario">Estagiário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Área do direito
                    </label>
                    <Select
                      value={createForm.area || '_none'}
                      onValueChange={(value) =>
                        setCreateForm({
                          ...createForm,
                          area: value === '_none' ? null : (value as AreaDireito),
                        })
                      }
                    >
                      <SelectTrigger>
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
                <div className="flex gap-3 border-t pt-4">
                  <Button
                    onClick={handleCreateUser}
                    className="flex-1 bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white"
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
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setCreateForm({ nome: '', email: '', senha: '', role: 'advogado', area: null, pendenteId: null, avatarUrl: null })
                    }}
                    disabled={isCreating}
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
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="flex items-center gap-3 p-4">
                <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-destructive">
                    Erro ao carregar usuários
                  </p>
                  <p className="text-xs text-muted-foreground">{error.message}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : profiles?.length === 0 ? (
            <Card className="border bg-card shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="font-medium text-foreground">Nenhum usuário encontrado</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Crie o primeiro usuário com o botão &quot;Novo usuário&quot;.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles?.map((profile) => (
                <Card
                  key={profile.id}
                  className={`border bg-card shadow-sm transition-shadow hover:shadow-md ${
                    profile.id === currentProfile?.id
                      ? 'ring-2 ring-primary/30'
                      : ''
                  }`}
                >
                  <CardContent className="p-5">
                    {editingId === profile.id ? (
                      <div className="space-y-4">
                        <Input
                          value={editForm.nome}
                          onChange={(e) =>
                            setEditForm({ ...editForm, nome: e.target.value })
                          }
                          placeholder="Nome"
                        />
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                          placeholder="E-mail"
                        />
                        <Select
                          value={editForm.role}
                          onValueChange={(value: UserRole) =>
                            setEditForm({ ...editForm, role: value })
                          }
                        >
                          <SelectTrigger>
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
                          <SelectTrigger>
                            <SelectValue placeholder="Área do direito" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">Nenhuma</SelectItem>
                            {AREAS_DIREITO.map((area) => (
                              <SelectItem key={area} value={area!}>{area}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveEdit}
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Salvar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(null)}
                            aria-label="Cancelar edição"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 flex items-start justify-between">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={profile.nome}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
                              {profile.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-1">
                            {profile.id === currentProfile?.id && (
                              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                Você
                              </span>
                            )}
                            {!profile.ativo && (
                              <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                                Inativo
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="mb-1 truncate font-semibold text-foreground">
                          {profile.nome}
                        </h3>

                        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{profile.email}</span>
                        </div>

                        {profile.area && (
                          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <Briefcase className="h-3 w-3 shrink-0" />
                            <span>{profile.area}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getRoleBadgeColor(profile.role)}`}
                          >
                            {getRoleIcon(profile.role)}
                            {profile.role}
                          </span>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(profile)}
                              className="h-8 w-8 p-0"
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
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
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

          {/* Colaboradores pendentes */}
          {pendentes && pendentes.length > 0 && (
            <Card className="border bg-card shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                  Colaboradores pendentes
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ative e defina a função para cada colaborador.
                </p>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {pendentes.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-lg border p-4"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt={p.nome}
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                            {p.nome.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{p.nome}</p>
                          <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                          {p.departamento && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{p.departamento}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAtivarPendente(p)}
                        className="shrink-0 bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white"
                      >
                        <UserCheck className="mr-1 h-4 w-4" />
                        Ativar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O acesso deste usuário ao sistema será
              removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Ativar colaborador pendente */}
      <Dialog open={ativarModalOpen} onOpenChange={(open) => !open && closeAtivarModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Ativar colaborador
            </DialogTitle>
            <DialogDescription>
              Defina a senha e a função. Nome e e-mail já estão preenchidos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={createForm.nome} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input type="email" value={createForm.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                value={createForm.senha}
                onChange={(e) => setCreateForm({ ...createForm, senha: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Função</label>
              <Select
                value={createForm.role}
                onValueChange={(value: UserRole) =>
                  setCreateForm({ ...createForm, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="advogado">Advogado</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="estagiario">Estagiário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Área do direito</label>
              <Select
                value={createForm.area || '_none'}
                onValueChange={(value) =>
                  setCreateForm({
                    ...createForm,
                    area: value === '_none' ? null : (value as AreaDireito),
                  })
                }
              >
                <SelectTrigger>
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
          <DialogFooter>
            <Button variant="outline" onClick={closeAtivarModal} disabled={isCreating}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              className="bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Ativar e criar usuário
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
