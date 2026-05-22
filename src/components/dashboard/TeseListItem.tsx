import { Calendar, Edit, Eye, Star, Trash2, User } from 'lucide-react'
import { getAreaIcon } from '@/constants/area-icons'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Tese } from '@/types/supabase'
import {
  assuntoBadgeClass,
  moreCountBadgeClass,
  tipoStatusDotClass,
} from '@/components/dashboard/teseMetaStyles'

export function TeseListItem({
  tese,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  canDelete,
  canEditContent,
  creatorName,
  creatorAvatar,
  isFavorite,
  onToggleFavorite,
}: {
  tese: Tese
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: (e: React.MouseEvent) => void
  canDelete: boolean
  canEditContent: boolean
  creatorName: string | null
  creatorAvatar: string | null
  isFavorite: boolean
  onToggleFavorite: (teseId: string, e: React.MouseEvent) => void
}) {
  const created = new Date(tese.created_at)
  const dataFormatada = created.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const dataCurta = created.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-border p-4 transition-colors sm:flex-row sm:items-center sm:gap-4',
        isSelected && 'bg-accent/5'
      )}
    >
      <div className="flex items-center gap-2 sm:shrink-0">
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className={cn(
            'h-9 w-9 p-0',
            isFavorite
              ? 'text-amber-500'
              : 'text-muted-foreground hover:text-amber-500'
          )}
          onClick={(e) => onToggleFavorite(tese.id, e)}
          aria-label={isFavorite ? 'Remover favorito' : 'Favoritar'}
        >
          <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} />
        </Button>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          {tese.tipo_tese && (
            <>
              <span
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full',
                  tipoStatusDotClass(tese.tipo_tese)
                )}
                aria-hidden
              />
              <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {tese.tipo_tese}
              </span>
            </>
          )}
          {tese.area && (
            <span className="inline-flex max-w-[140px] items-center gap-1 truncate text-[10px] text-muted-foreground sm:max-w-[180px] sm:text-xs" title={tese.area}>
              {(() => {
                const AreaIcon = getAreaIcon(tese.area)
                return <AreaIcon className="h-3 w-3 shrink-0 text-muted-foreground/70" aria-hidden />
              })()}
              {tese.area}
            </span>
          )}
        </div>
        <h3 className="mb-1 font-semibold text-foreground">{tese.titulo}</h3>
        {tese.descricao && (
          <p className="mb-2 line-clamp-1 text-sm text-muted-foreground">
            {tese.descricao}
          </p>
        )}
        <div className="flex flex-wrap gap-x-2 gap-y-2">
          {tese.assuntos?.slice(0, 3).map((a, i) => (
            <Badge
              key={i}
              variant="outline"
              title={a}
              className={cn(
                'max-w-[160px] truncate px-2.5 py-0.5 text-xs',
                assuntoBadgeClass()
              )}
            >
              {a}
            </Badge>
          ))}
          {tese.assuntos && tese.assuntos.length > 3 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Badge
                    variant="outline"
                    className={cn('shrink-0 cursor-help px-2.5 py-0.5 text-xs tabular-nums', moreCountBadgeClass())}
                  >
                    +{tese.assuntos.length - 3}
                  </Badge>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px]">
                <p className="mb-2 font-medium">Assuntos ocultos:</p>
                <ul className="list-inside list-disc space-y-1 text-xs">
                  {tese.assuntos.slice(3).map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        <div className="flex flex-col items-end gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-2" title={dataFormatada}>
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">
              <span className="sm:hidden">{dataCurta}</span>
              <span className="hidden sm:inline">{dataFormatada}</span>
            </span>
          </span>
          <div className="flex items-center gap-2">
            {creatorAvatar ? (
              <img
                src={creatorAvatar}
                alt={creatorName || ''}
                className="h-6 w-6 shrink-0 rounded-full border object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                {creatorName?.charAt(0).toUpperCase() || <User className="h-3 w-3" />}
              </div>
            )}
            {creatorName && (
              <span className="max-w-[80px] truncate sm:max-w-[120px]" title={creatorName}>{creatorName}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          <Button variant="outline" size="sm" type="button" onClick={onEdit}>
            {canEditContent ? (
              <>
                <Edit className="mr-1 h-4 w-4" />
                Editar
              </>
            ) : (
              <>
                <Eye className="mr-1 h-4 w-4" />
                Visualizar
              </>
            )}
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Excluir
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
