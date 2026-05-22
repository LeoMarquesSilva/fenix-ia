import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileUp,
  Grid3x3,
  List,
  Star,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useSidebarLayout } from '@/contexts/SidebarLayoutContext'
import { cn } from '@/lib/utils'
import { TeseCard } from './TeseCard'
import { TeseListItem } from './TeseListItem'
import type { Tese } from '@/types/supabase'

type ViewMode = 'grid' | 'list'

function ThesisGridSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <Card className="border bg-card overflow-hidden">
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 p-4">
              <Skeleton className="h-5 w-5 shrink-0 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 max-w-md" />
                <Skeleton className="h-3 w-full max-w-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }
  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border bg-card overflow-hidden">
          <CardContent className="space-y-3 p-5">
            <div className="flex justify-between">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-12 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DashboardThesisList({
  isLoading,
  error,
  data,
  filteredTeses,
  viewMode,
  setViewMode,
  selectedTeses,
  toggleSelectTese,
  toggleSelectAll,
  showFavoritesOnly,
  setShowFavoritesOnly,
  favoriteIds,
  page,
  setPage,
  onEditSelected,
  onEditSingle,
  onDeleteClick,
  onToggleFavorite,
  onOpenWord,
  onOpenExcel,
  getCreatorName,
  getCreatorAvatar,
  isEstagiario,
  canDeleteTeses,
  canEditTeseContent,
  selectionCanEditContent,
  userId,
  isTogglingFavorite,
  onClearSelection,
}: {
  isLoading: boolean
  error: Error | null
  data: { count: number; totalPages: number; page: number; data: Tese[] } | undefined
  filteredTeses: Tese[]
  viewMode: ViewMode
  setViewMode: (m: ViewMode) => void
  selectedTeses: Set<string>
  toggleSelectTese: (id: string) => void
  toggleSelectAll: () => void
  showFavoritesOnly: boolean
  setShowFavoritesOnly: (v: boolean) => void
  favoriteIds: string[]
  page: number
  setPage: (n: number | ((p: number) => number)) => void
  onEditSelected: () => void
  onEditSingle: (id: string) => void
  onDeleteClick: (id: string, e?: React.MouseEvent) => void
  onToggleFavorite: (id: string, e: React.MouseEvent) => Promise<void>
  onOpenWord: () => void
  onOpenExcel: () => void
  getCreatorName: (userId: string | null) => string | null
  getCreatorAvatar: (userId: string | null) => string | null
  isEstagiario: boolean
  canDeleteTeses: boolean
  canEditTeseContent: (teseUserId: string | null) => boolean
  selectionCanEditContent: boolean
  userId: string | undefined
  isTogglingFavorite: boolean
  onClearSelection: () => void
}) {
  const { collapsed } = useSidebarLayout()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <ThesisGridSkeleton viewMode={viewMode} />
        <p className="text-center text-sm text-muted-foreground">
          Carregando teses…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border bg-card">
        <CardContent className="py-12 text-center">
          <p className="font-medium text-destructive">
            {error.message || 'Erro ao carregar teses'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tente recarregar a página.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
            variant="outline"
          >
            Recarregar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <Card className="border bg-card">
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-semibold text-foreground">
            Nenhuma tese encontrada
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajuste os filtros ou importe novas teses.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button onClick={onOpenWord} variant="default">
              <FileUp className="mr-2 h-4 w-4" />
              Upload Word
            </Button>
            <Button onClick={onOpenExcel} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importar Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const emptyFavorites =
    showFavoritesOnly && filteredTeses.length === 0 && data.data.length > 0

  return (
    <div
      className={cn(
        'space-y-4',
        selectedTeses.size > 0 && 'pb-24 sm:pb-28'
      )}
    >
      {selectedTeses.size > 0 && (
        <div
          className={cn(
            'fixed z-40 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm',
            'bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4',
            'lg:right-6',
            collapsed ? 'lg:left-24' : 'lg:left-[296px]'
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CheckSquare className="h-4 w-4 text-accent" />
            {selectedTeses.size} selecionada
            {selectedTeses.size > 1 ? 's' : ''}
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-8 w-8 p-0"
              onClick={onClearSelection}
              aria-label="Limpar seleção"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={onClearSelection}
            >
              Limpar seleção
            </Button>
            {selectedTeses.size === 1 ? (
              <Button
                size="sm"
                className="bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white"
                type="button"
                onClick={() => {
                  const id = Array.from(selectedTeses)[0]
                  if (id) onEditSingle(id)
                }}
              >
                {selectionCanEditContent ? 'Editar' : 'Visualizar'}
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white"
                type="button"
                onClick={onEditSelected}
              >
                {selectionCanEditContent ? 'Editar em lote' : 'Visualizar em lote'}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'grid' && !emptyFavorites && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={
                  selectedTeses.size === filteredTeses.length &&
                  filteredTeses.length > 0
                }
                onCheckedChange={toggleSelectAll}
              />
              Selecionar todas (página)
            </label>
          )}
          {showFavoritesOnly && (
            <span className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
              <Star className="h-4 w-4 fill-current" />
              Apenas favoritos
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            className="gap-0.5 rounded-lg border border-border bg-muted/50 p-1 dark:bg-muted/25"
          >
            <ToggleGroupItem
              value="grid"
              aria-label="Visualização em grade"
              className="min-h-9 min-w-9 rounded-md px-3 text-muted-foreground transition-colors hover:bg-background/90 hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground"
            >
              <Grid3x3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              aria-label="Visualização em lista"
              className="min-h-9 min-w-9 rounded-md px-3 text-muted-foreground transition-colors hover:bg-background/90 hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground"
            >
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <span className="text-sm tabular-nums text-muted-foreground">
            {data.count} tese{data.count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {emptyFavorites ? (
        <Card className="border bg-card">
          <CardContent className="py-12 text-center">
            <Star className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h3 className="mb-2 text-lg font-semibold">Nenhum favorito aqui</h3>
            <p className="text-muted-foreground text-sm">
              Nenhuma tese desta página está nos favoritos.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowFavoritesOnly(false)}
            >
              Ver todas
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredTeses.map((tese) => (
            <TeseCard
              key={tese.id}
              tese={tese}
              isSelected={selectedTeses.has(tese.id)}
              onSelect={() => toggleSelectTese(tese.id)}
              onEdit={() => onEditSingle(tese.id)}
              onDelete={(e) => onDeleteClick(tese.id, e)}
              canDelete={
                !isEstagiario &&
                (canDeleteTeses || tese.user_id === userId)
              }
              canEditContent={canEditTeseContent(tese.user_id)}
              creatorName={getCreatorName(tese.user_id)}
              creatorAvatar={getCreatorAvatar(tese.user_id)}
              isFavorite={favoriteIds.includes(tese.id)}
              onToggleFavorite={async (id, e) => {
                if (!isTogglingFavorite) await onToggleFavorite(id, e)
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="border bg-card overflow-hidden">
          <CardContent className="p-0">
            {filteredTeses.map((tese) => (
              <TeseListItem
                key={tese.id}
                tese={tese}
                isSelected={selectedTeses.has(tese.id)}
                onSelect={() => toggleSelectTese(tese.id)}
                onEdit={() => onEditSingle(tese.id)}
                onDelete={(e) => onDeleteClick(tese.id, e)}
                canDelete={
                  !isEstagiario &&
                  (canDeleteTeses || tese.user_id === userId)
                }
                canEditContent={canEditTeseContent(tese.user_id)}
                creatorName={getCreatorName(tese.user_id)}
                creatorAvatar={getCreatorAvatar(tese.user_id)}
                isFavorite={favoriteIds.includes(tese.id)}
                onToggleFavorite={async (id, e) => {
                  if (!isTogglingFavorite) await onToggleFavorite(id, e)
                }}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {data.totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Página {data.page} de {data.totalPages} · {data.count} no total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            >
              Próxima
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
