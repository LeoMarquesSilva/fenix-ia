import {
  ArrowUpDown,
  FileText,
  MessageSquare,
  Search,
  Star,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getAreaIcon } from '@/constants/area-icons'

const TIPO_OPCOES = [
  { value: 'all', label: 'Todos os tipos', icon: null },
  { value: 'Tese', label: 'Tese', icon: FileText },
  { value: 'Consultivo', label: 'Consultivo', icon: MessageSquare },
] as const

export function DashboardFilters({
  search,
  setSearch,
  area,
  setArea,
  assunto,
  setAssunto,
  tipo,
  setTipo,
  ordenacao,
  setOrdenacao,
  showFavoritesOnly,
  setShowFavoritesOnly,
  favoriteCount,
  areas,
  assuntos,
  setPage,
}: {
  search: string
  setSearch: (v: string) => void
  area: string
  setArea: (v: string) => void
  assunto: string
  setAssunto: (v: string) => void
  tipo: string
  setTipo: (v: string) => void
  ordenacao: 'recentes' | 'antigos' | 'titulo_asc' | 'titulo_desc'
  setOrdenacao: (v: 'recentes' | 'antigos' | 'titulo_asc' | 'titulo_desc') => void
  showFavoritesOnly: boolean
  setShowFavoritesOnly: (v: boolean) => void
  favoriteCount: number
  areas: string[]
  assuntos: string[]
  setPage: (n: number) => void
}) {
  const hasFilters =
    search ||
    area !== 'all' ||
    assunto !== 'all' ||
    tipo !== 'all' ||
    ordenacao !== 'recentes' ||
    showFavoritesOnly

  const clearFilters = () => {
    setSearch('')
    setArea('all')
    setAssunto('all')
    setTipo('all')
    setOrdenacao('recentes')
    setShowFavoritesOnly(false)
    setPage(1)
  }

  const triggerSearch = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  return (
    <Card id="dashboard-filters" className="border bg-card shadow-sm scroll-mt-24">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-[200px]">
            <Label htmlFor="dash-search" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Buscar
            </Label>
            <div className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-input bg-background px-3 transition-[box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 focus-within:ring-offset-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                id="dash-search"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Título, descrição…"
                value={search}
                onChange={(e) => triggerSearch(e.target.value)}
                className="min-h-0 min-w-0 flex-1 bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="min-w-0 space-y-1.5 sm:w-[140px]">
            <Label className="text-xs font-medium text-muted-foreground">
              Tipo
            </Label>
            <Select
              value={tipo}
              onValueChange={(value) => {
                setTipo(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue placeholder="Todos os tipos">
                  {(() => {
                    const opt = TIPO_OPCOES.find((o) => o.value === tipo)
                    const Icon = opt?.icon
                    return opt ? (
                      <span className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 shrink-0" />}
                        {opt.label}
                      </span>
                    ) : null
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIPO_OPCOES.map(({ value: v, label, icon: Icon }) => (
                  <SelectItem key={v} value={v}>
                    <span className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-1.5 sm:w-[160px]">
            <Label className="text-xs font-medium text-muted-foreground">Área</Label>
            <Select
              value={area}
              onValueChange={(value) => {
                setArea(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue placeholder="Todas as áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                {areas.map((a) => {
                  const AreaIcon = getAreaIcon(a)
                  return (
                    <SelectItem key={a} value={a || 'unknown'}>
                      <span className="flex items-center gap-2">
                        <AreaIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {a}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-1.5 sm:w-[160px]">
            <Label className="text-xs font-medium text-muted-foreground">Assunto</Label>
            <Select
              value={assunto}
              onValueChange={(value) => {
                setAssunto(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue placeholder="Todos os assuntos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os assuntos</SelectItem>
                {assuntos.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-1.5 sm:w-[min(100%,200px)] sm:min-w-[180px]">
            <Label className="text-xs font-medium text-muted-foreground">
              Ordenação
            </Label>
            <Select
              value={ordenacao}
              onValueChange={(
                value: 'recentes' | 'antigos' | 'titulo_asc' | 'titulo_desc'
              ) => {
                setOrdenacao(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais recentes</SelectItem>
                <SelectItem value="antigos">Mais antigos</SelectItem>
                <SelectItem value="titulo_asc">Título A–Z</SelectItem>
                <SelectItem value="titulo_desc">Título Z–A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-1.5 sm:min-w-[140px]">
            <Label className="text-xs font-medium text-muted-foreground">
              Exibir
            </Label>
            <Button
              type="button"
              variant={showFavoritesOnly ? 'default' : 'outline'}
              className={cn(
                'h-10 w-full min-w-0',
                showFavoritesOnly &&
                  'bg-amber-500 text-amber-950 hover:bg-amber-600 hover:text-amber-950'
              )}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star
                className={cn(
                  'mr-2 h-4 w-4 shrink-0',
                  showFavoritesOnly && 'fill-current'
                )}
              />
              Favoritos
              {favoriteCount > 0 && ` (${favoriteCount})`}
            </Button>
          </div>

          {hasFilters && (
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground invisible select-none" aria-hidden>
                Limpar
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 text-muted-foreground"
                onClick={clearFilters}
              >
                <X className="mr-1 h-4 w-4 shrink-0" />
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
