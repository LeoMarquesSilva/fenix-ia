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
import { ArrowLeft, UserPlus, Edit, Save, X, Trash2, Mail, User, Shield, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
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
import type { UserRole } from '@/types/profiles'

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
  const [editForm, setEditForm] = useState({ nome: '', email: '', role: 'advogado' as UserRole, ativo: true })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({ 
    nome: '', 
    email: '', 
    senha: '', 
    role: 'advogado' as UserRole 
  })

  // Redirecionar se não for admin
  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta página.</p>
            <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
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
      // Obter sessão atual do admin
      const { data: currentSessionData } = await supabase.auth.getSession()
      const currentSession = currentSessionData.session
      
      if (!currentSession) {
        throw new Error('Você precisa estar logado para criar usuários')
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

      // IMPORTANTE: Criar um cliente Supabase SEPARADO sem persistência de sessão
      // Assim o signUp não vai afetar a sessão do cliente principal
      const tempClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,  // NÃO persistir sessão
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })

      // Criar usuário usando o cliente temporário
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: createForm.email,
        password: createForm.senha,
        options: {
          data: {
            nome: createForm.nome,
            role: createForm.role,
          },
        },
      })

      if (authError) {
        throw authError
      }
      
      const newUserId = authData.user?.id
      
      if (newUserId) {
        // Aguardar para o trigger criar o perfil
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Atualizar o perfil com a role correta usando a sessão do admin
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

      setCreateForm({ nome: '', email: '', senha: '', role: 'advogado' })
      setShowCreateForm(false)
      
      // Atualizar lista
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
    
    // Não permitir deletar o próprio perfil
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

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-700 border-red-500/30'
      case 'supervisor':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30'
      case 'advogado':
        return 'bg-purple-500/20 text-purple-700 border-purple-500/30'
      case 'estagiario':
        return 'bg-green-500/20 text-green-700 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30'
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-fenix-navy to-fenix-purple-dark bg-clip-text text-transparent">
                  Gerenciamento de Usuários
                </h1>
                <p className="text-xs text-gray-500">Administre os usuários da plataforma</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Formulário de criação */}
        {showCreateForm && (
          <Card className="mb-6 border shadow-xl !bg-[#101f2e] !border-[#101f2e]">
            <CardHeader>
              <CardTitle className="text-white">Criar Novo Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Nome</label>
                  <Input
                    value={createForm.nome}
                    onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })}
                    placeholder="Nome completo"
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Email</label>
                  <Input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Senha</label>
                  <Input
                    type="password"
                    value={createForm.senha}
                    onChange={(e) => setCreateForm({ ...createForm, senha: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Role</label>
                  <Select
                    value={createForm.role}
                    onValueChange={(value: UserRole) => setCreateForm({ ...createForm, role: value })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="advogado">Advogado</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="estagiario">Estagiário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateUser} className="flex-1" disabled={isCreating}>
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
                    setCreateForm({ nome: '', email: '', senha: '', role: 'advogado' })
                  }}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de usuários */}
        {error && (
          <Card className="mb-4 border-red-500 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">Erro ao carregar usuários</p>
                <p className="text-xs text-red-600">{error.message}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}
        
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto"></div>
              <p className="text-sm text-gray-600">Carregando usuários...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {profiles?.map((profile) => (
              <Card key={profile.id} className="border shadow-lg">
                <CardContent className="p-4">
                  {editingId === profile.id ? (
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Nome</label>
                        <Input
                          value={editForm.nome}
                          onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Email</label>
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Role</label>
                        <Select
                          value={editForm.role}
                          onValueChange={(value: UserRole) => setEditForm({ ...editForm, role: value })}
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
                      </div>
                      <div className="flex items-end gap-2">
                        <Button onClick={handleSaveEdit} size="sm">
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="rounded-full bg-purple-500/20 p-3">
                          <User className="h-6 w-6 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{profile.nome}</h3>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(profile.role)}`}
                            >
                              {profile.role}
                            </span>
                            {profile.ativo ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-xs font-medium text-red-700">
                                Inativo
                              </span>
                            )}
                            {profile.id === currentProfile?.id && (
                              <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-xs font-medium text-blue-700">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {profile.email}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(profile)}
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
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
