import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  User,
  Mail,
  Shield,
  Key,
  Save,
  RefreshCw,
  CheckCircle,
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
import { cn } from '@/lib/utils'

function roleBadge(role: string) {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    advogado: 'Advogado',
    estagiario: 'Estagiário',
  }
  return (
    <Badge
      className={cn(
        'capitalize',
        role === 'admin' && 'bg-destructive/15 text-destructive hover:bg-destructive/20',
        role === 'supervisor' &&
          'bg-primary/15 text-primary hover:bg-primary/20',
        role === 'advogado' &&
          'bg-accent/15 text-accent hover:bg-accent/20',
        role === 'estagiario' &&
          'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
      )}
    >
      {labels[role] || role}
    </Badge>
  )
}

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const updateMutation = useUpdateProfile()

  const [nome, setNome] = useState(profile?.nome || '')
  const [area, setArea] = useState<AreaDireito>(
    (profile?.area as AreaDireito) || null
  )
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handleUpdateProfile = async () => {
    if (!profile?.id) return
    setIsUpdatingProfile(true)
    try {
      await updateMutation.mutateAsync({
        id: profile.id,
        updates: { nome, area },
      })
      await refreshProfile()
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas.',
      })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nova senha e confirmação.',
        variant: 'destructive',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Senhas diferentes',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      })
      return
    }
    if (newPassword.length < 6) {
      toast({
        title: 'Senha curta',
        description: 'Mínimo 6 caracteres.',
        variant: 'destructive',
      })
      return
    }
    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
      toast({
        title: 'Senha alterada',
        description: 'Use a nova senha no próximo acesso.',
      })
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao alterar'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (!user || !profile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title="Meu perfil"
        description="Dados da sua conta no banco de teses jurídicas Fênix I.A."
      />

      <Card className="mb-8 overflow-hidden border bg-card shadow-sm">
        <div className="h-2 bg-gradient-to-r from-primary via-accent to-fenix-purple-light" />
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nome}
                className="h-20 w-20 shrink-0 rounded-full border-2 border-primary/20 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10 text-2xl font-bold text-primary">
                {profile.nome.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                {profile.nome}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                {profile.email}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {roleBadge(profile.role)}
                {profile.ativo && (
                  <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="h-3 w-3" />
                    Ativo
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Informações pessoais
            </CardTitle>
            <CardDescription>
              Nome e área de atuação (áreas de direito).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={profile.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                O e-mail não pode ser alterado aqui.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Área de atuação</Label>
              <Select
                value={area || '_none'}
                onValueChange={(v) =>
                  setArea(v === '_none' ? null : (v as AreaDireito))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
              <Label>Função</Label>
              <div>{roleBadge(profile.role)}</div>
              <p className="text-xs text-muted-foreground">
                Apenas administradores alteram funções (em Usuários).
              </p>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white hover:opacity-95"
              onClick={handleUpdateProfile}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar alterações
            </Button>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5 text-primary" />
              Alterar senha
            </CardTitle>
            <CardDescription>Nova senha de acesso à plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="np">Nova senha</Label>
              <Input
                id="np"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp">Confirmar senha</Label>
              <Input
                id="cp"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Shield className="mb-1 inline h-3.5 w-3.5" /> Use senha forte
              (letras, números e símbolos quando possível).
            </div>
            <Button
              variant="outline"
              className="w-full border-primary/30"
              onClick={handleUpdatePassword}
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Key className="mr-2 h-4 w-4" />
              )}
              Atualizar senha
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
