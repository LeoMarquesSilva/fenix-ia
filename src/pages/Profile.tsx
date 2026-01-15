import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Shield, 
  Key,
  Save,
  RefreshCw,
  Briefcase,
  Crown,
  Eye,
  GraduationCap,
  CheckCircle
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AreaDireito } from '@/types/profiles'
import { AREAS_DIREITO } from '@/types/profiles'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const updateMutation = useUpdateProfile()
  
  const [nome, setNome] = useState(profile?.nome || '')
  const [area, setArea] = useState<AreaDireito>(profile?.area as AreaDireito || null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-5 w-5" />
      case 'supervisor':
        return <Eye className="h-5 w-5" />
      case 'advogado':
        return <Briefcase className="h-5 w-5" />
      case 'estagiario':
        return <GraduationCap className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
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

  const handleUpdateProfile = async () => {
    if (!profile?.id) return

    setIsUpdatingProfile(true)
    try {
      await updateMutation.mutateAsync({
        id: profile.id,
        updates: {
          nome,
          area,
        },
      })

      await refreshProfile()

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar perfil',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos de senha',
        variant: 'destructive',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      })
      return
    }

    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast({
        title: 'Senha atualizada!',
        description: 'Sua senha foi alterada com sucesso.',
      })

      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar senha',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
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
                    <User className="h-5 w-5 text-purple-400" />
                    Meu Perfil
                  </h1>
                  <p className="text-xs text-white/50">Gerencie suas informações pessoais</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Card de informações do usuário */}
          <Card className="mb-8 bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600" />
            <CardContent className="pt-0 pb-6 px-6 relative">
              <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-3xl border-4 border-[#1a2744] shadow-xl">
                  {profile.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 md:mb-2">
                  <h2 className="text-2xl font-bold text-white">{profile.nome}</h2>
                  <div className="flex items-center gap-2 text-white/60 mt-1">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                </div>
                <div className="flex items-center gap-2 md:mb-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ${getRoleBadgeColor(profile.role)}`}>
                    {getRoleIcon(profile.role)}
                    {profile.role}
                  </span>
                  {profile.ativo && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 border border-green-500/50 px-3 py-1.5 text-xs font-medium text-green-300">
                      <CheckCircle className="h-3 w-3" />
                      Ativo
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Editar Informações */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-400" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription className="text-white/50">
                  Atualize seu nome e área de atuação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Nome Completo</label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Email</label>
                  <Input
                    value={profile.email}
                    disabled
                    className="bg-white/5 border-white/10 text-white/50"
                  />
                  <p className="text-xs text-white/40">O email não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Área de Atuação</label>
                  <Select
                    value={area || '_none'}
                    onValueChange={(value) => setArea(value === '_none' ? null : value as AreaDireito)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Selecione sua área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Nenhuma</SelectItem>
                      {AREAS_DIREITO.map((a) => (
                        <SelectItem key={a} value={a!}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Função</label>
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ${getRoleBadgeColor(profile.role)}`}>
                    {getRoleIcon(profile.role)}
                    {profile.role}
                  </div>
                  <p className="text-xs text-white/40">Apenas administradores podem alterar funções</p>
                </div>

                <Button 
                  onClick={handleUpdateProfile} 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Alterar Senha */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="h-5 w-5 text-purple-400" />
                  Alterar Senha
                </CardTitle>
                <CardDescription className="text-white/50">
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Nova Senha</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Confirmar Nova Senha</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-white/60">
                    <Shield className="inline h-3 w-3 mr-1" />
                    Dicas para uma senha segura:
                  </p>
                  <ul className="text-xs text-white/40 mt-2 space-y-1 list-disc list-inside">
                    <li>Use pelo menos 6 caracteres</li>
                    <li>Combine letras maiúsculas e minúsculas</li>
                    <li>Inclua números e símbolos</li>
                    <li>Evite informações pessoais</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleUpdatePassword} 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Alterar Senha
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
