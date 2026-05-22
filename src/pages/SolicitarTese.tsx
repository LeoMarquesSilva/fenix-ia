import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'
import {
  useCreateTeseSolicitacao,
  useTeseSolicitacoes,
  useUpdateTeseSolicitacaoStatus,
  type TeseSolicitacaoRow,
} from '@/hooks/useTeseSolicitacoes'
import { useProfile, useProfiles } from '@/hooks/useProfile'
import type { Profile } from '@/types/profiles'
import { AREAS_DIREITO } from '@/types/profiles'
import { formatTituloTese } from '@/lib/teseFormat'
import { getAreaIcon } from '@/constants/area-icons'
import { areaBadgeClass } from '@/components/dashboard/teseMetaStyles'
import { cn } from '@/lib/utils'
import { Calendar, Clock, Lightbulb, Loader2, User } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  atendida: 'Atendida',
  descartada: 'Descartada',
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'atendida':
      return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400'
    case 'em_analise':
      return 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
    case 'descartada':
      return 'bg-muted text-muted-foreground'
    default:
      return 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
  }
}

function solicitanteFromProfiles(
  userId: string,
  isAdmin: boolean,
  profiles: Profile[] | undefined,
  myProfile: Profile | undefined
): { nome: string; avatar: string | null } {
  const p = profiles?.find((x) => x.id === userId)
  if (p) return { nome: p.nome, avatar: p.avatar_url || null }
  if (!isAdmin && myProfile?.id === userId) {
    return { nome: myProfile.nome, avatar: myProfile.avatar_url || null }
  }
  return { nome: userId.slice(0, 8) + '…', avatar: null }
}

function SolicitacaoCard({
  s,
  isAdmin,
  solicitanteNome,
  solicitanteAvatar,
  updateStatus,
}: {
  s: TeseSolicitacaoRow
  isAdmin: boolean
  solicitanteNome: string
  solicitanteAvatar: string | null
  updateStatus: Pick<
    ReturnType<typeof useUpdateTeseSolicitacaoStatus>,
    'mutate' | 'isPending'
  >
}) {
  const created = new Date(s.created_at)
  const dataFormatada = created.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const hora = created.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const dataCurta = created.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const AreaIcon = s.area ? getAreaIcon(s.area) : null
  const initial = solicitanteNome.trim().charAt(0).toUpperCase()

  return (
    <li
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow',
        'hover:border-border/80 hover:shadow-md'
      )}
    >
      <div className="flex gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="shrink-0 pt-0.5">
          {solicitanteAvatar ? (
            <img
              src={solicitanteAvatar}
              alt={solicitanteNome}
              className="h-10 w-10 rounded-full border-2 border-background object-cover shadow-sm ring-1 ring-border sm:h-11 sm:w-11"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-sm font-semibold text-muted-foreground shadow-sm ring-1 ring-border sm:h-11 sm:w-11"
              aria-hidden
            >
              {initial ? (
                initial
              ) : (
                <User className="h-5 w-5 opacity-70" />
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-snug text-foreground">
              {s.titulo_sugerido}
            </h3>
            <div className="shrink-0">
              {isAdmin ? (
                <Select
                  value={s.status}
                  onValueChange={(v) =>
                    updateStatus.mutate({ id: s.id, status: v })
                  }
                  disabled={updateStatus.isPending}
                >
                  <SelectTrigger className="h-8 w-[160px] text-xs sm:h-9 sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABEL).map(([k, lab]) => (
                      <SelectItem key={k} value={k}>
                        {lab}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="secondary"
                  className={cn('font-medium', statusBadgeClass(s.status))}
                >
                  {STATUS_LABEL[s.status] || s.status}
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <span
              className="inline-flex items-center gap-1.5"
              title={`${dataFormatada} · ${hora}`}
            >
              <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" aria-hidden />
              <span className="sm:hidden">{dataCurta}</span>
              <span className="hidden sm:inline">{dataFormatada}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" aria-hidden />
              <span className="tabular-nums">{hora}</span>
            </span>
            {s.area && AreaIcon && (
              <Badge
                variant="outline"
                className={cn(
                  'gap-1 border px-2 py-0.5 text-[11px] font-medium',
                  areaBadgeClass()
                )}
              >
                <AreaIcon className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
                <span className="max-w-[200px] truncate">{s.area}</span>
              </Badge>
            )}
            {isAdmin && (
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-muted-foreground">
                <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" aria-hidden />
                <span className="truncate font-medium text-foreground/90" title={solicitanteNome}>
                  {solicitanteNome}
                </span>
              </span>
            )}
          </div>

          {s.descricao && (
            <p className="mt-3 whitespace-pre-wrap border-t border-border/60 pt-3 text-sm leading-relaxed text-muted-foreground">
              {s.descricao}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

export default function SolicitarTese() {
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [area, setArea] = useState<string>('')

  const createMut = useCreateTeseSolicitacao()
  const updateStatus = useUpdateTeseSolicitacaoStatus()
  const { data: lista, isLoading: loadingLista } = useTeseSolicitacoes()
  const { data: profiles } = useProfiles({ enabled: !!isAdmin })
  const { data: myProfile } = useProfile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) {
      toast({
        title: 'Sessão',
        description: 'Faça login novamente.',
        variant: 'destructive',
      })
      return
    }
    const t = titulo.trim()
    if (t.length < 5) {
      toast({
        title: 'Título curto',
        description: 'Descreva o tema da tese com pelo menos 5 caracteres.',
        variant: 'destructive',
      })
      return
    }
    try {
      await createMut.mutateAsync({
        titulo_sugerido: formatTituloTese(t),
        descricao: descricao.trim() || null,
        area: area || null,
        user_id: user.id,
      })
      toast({
        title: 'Solicitação enviada',
        description:
          'Sua sugestão foi registrada. A equipe poderá incluir a tese no acervo.',
      })
      setTitulo('')
      setDescricao('')
      setArea('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar.'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-full bg-muted/30 dark:bg-transparent">
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <PageHeader
          title="Solicitar nova tese"
          description="Indique temas ou peças que ainda não constam na biblioteca. Sua sugestão ajuda a priorizar o que criar no sistema."
        />

        <Card className="mb-8 border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Nova solicitação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo-sug">Título ou tema da tese *</Label>
                <Input
                  id="titulo-sug"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex.: Recurso ordinário em MS contra decisão de gratuidade"
                  maxLength={500}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area-sug">Área do direito (opcional)</Label>
                <Select
                  value={area || '__none__'}
                  onValueChange={(v) => setArea(v === '__none__' ? '' : v)}
                >
                  <SelectTrigger id="area-sug">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Não informar</SelectItem>
                    {AREAS_DIREITO.filter(Boolean).map((a) => (
                      <SelectItem key={a} value={a!}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc-sug">Detalhes (opcional)</Label>
                <Textarea
                  id="desc-sug"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Contexto, fundamentos desejados, links ou referências…"
                  rows={4}
                  maxLength={4000}
                />
              </div>
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Enviar solicitação
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader>
            <CardTitle className="text-lg">
              {isAdmin ? 'Todas as solicitações' : 'Minhas solicitações'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? 'Gerencie o status de cada pedido.'
                : 'Acompanhe o andamento dos seus pedidos.'}
            </p>
          </CardHeader>
          <CardContent>
            {loadingLista && (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando…
              </div>
            )}
            {!loadingLista && (!lista || lista.length === 0) && (
              <p className="py-6 text-sm text-muted-foreground">
                Nenhuma solicitação registrada ainda.
              </p>
            )}
            {!loadingLista && lista && lista.length > 0 && (
              <ul className="space-y-3">
                {lista.map((s) => {
                  const { nome, avatar } = solicitanteFromProfiles(
                    s.user_id,
                    !!isAdmin,
                    profiles,
                    myProfile
                  )
                  return (
                    <SolicitacaoCard
                      key={s.id}
                      s={s}
                      isAdmin={!!isAdmin}
                      solicitanteNome={nome}
                      solicitanteAvatar={avatar}
                      updateStatus={updateStatus}
                    />
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
