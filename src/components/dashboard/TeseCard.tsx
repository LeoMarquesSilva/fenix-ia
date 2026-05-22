import { Calendar, Edit, Eye, FileText, Star, Trash2, User } from 'lucide-react'
import { getAreaIcon } from '@/constants/area-icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

export function TeseCard({
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
  const assuntosCount = tese.assuntos?.length ?? 0
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
    <Card
      className={cn(
        'group min-w-0 max-w-full cursor-pointer overflow-hidden rounded-xl border-2 transition-all shadow-sm hover:shadow-md',
        isSelected
          ? 'border-accent bg-accent/5 shadow-md ring-2 ring-accent/20'
          : 'border-border bg-card hover:border-accent/40'
      )}
      onClick={onSelect}
    >
      <CardContent className="min-w-0 overflow-hidden p-4 sm:p-5">
        {/* Topo: linha 1 = checkbox/star + tipo | linha 2 = data + ações */}
        <div className="mb-3 flex flex-col gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className={cn(
                'h-8 w-8 shrink-0 p-0',
                isFavorite
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-muted-foreground hover:text-amber-500'
              )}
              onClick={(e) => onToggleFavorite(tese.id, e)}
              aria-label={
                isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
              }
            >
              <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} />
            </Button>
            {tese.tipo_tese && (
              <div className="flex min-w-0 shrink items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    tipoStatusDotClass(tese.tipo_tese)
                  )}
                  aria-hidden
                />
                <span className="truncate">{tese.tipo_tese}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
              <span className="whitespace-nowrap" title={dataFormatada}>
                <span className="sm:hidden">{dataCurta}</span>
                <span className="hidden sm:inline">{dataFormatada}</span>
              </span>
            </div>
            <div className="flex shrink-0 gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                aria-label={canEditContent ? 'Editar tese' : 'Visualizar tese'}
              >
                {canEditContent ? (
                  <Edit className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={onDelete}
                  aria-label="Excluir tese"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Título */}
        <h3
          className={cn(
            'mb-2 line-clamp-2 font-semibold leading-tight text-foreground',
            isSelected && 'text-accent'
          )}
        >
          {tese.titulo}
        </h3>

        {/* Descrição */}
        {tese.descricao && (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {tese.descricao}
          </p>
        )}

        {/* Área (texto sutil) + assuntos (badges) */}
        <div className="mb-4 space-y-2">
          {tese.area && (
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
              {(() => {
                const AreaIcon = getAreaIcon(tese.area)
                return (
                  <AreaIcon className="h-3 w-3 shrink-0 text-muted-foreground/70" aria-hidden />
                )
              })()}
              <span className="truncate" title={tese.area}>{tese.area}</span>
            </p>
          )}
          {(tese.assuntos?.length ?? 0) > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {tese.assuntos?.slice(0, 2).map((a, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  title={a}
                  className={cn(
                    'max-w-[120px] truncate px-2 py-0.5 text-[10px] sm:text-xs',
                    assuntoBadgeClass()
                  )}
                >
                  {a}
                </Badge>
              ))}
              {tese.assuntos && tese.assuntos.length > 2 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block" onClick={(e) => e.stopPropagation()}>
                      <Badge
                        variant="outline"
                        className={cn('shrink-0 cursor-help px-2 py-0.5 text-[10px] sm:text-xs tabular-nums', moreCountBadgeClass())}
                      >
                        +{tese.assuntos.length - 2}
                      </Badge>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px]">
                    <p className="mb-2 font-medium">Assuntos ocultos:</p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      {tese.assuntos.slice(2).map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        {/* Rodapé: avatar + nome | métrica + abrir */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            {creatorAvatar ? (
              <img
                src={creatorAvatar}
                alt={creatorName || ''}
                className="h-7 w-7 shrink-0 rounded-full border border-background object-cover shadow-sm sm:h-8 sm:w-8"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-background bg-muted text-[10px] font-medium text-muted-foreground shadow-sm sm:h-8 sm:w-8 sm:text-xs">
                {creatorName?.charAt(0).toUpperCase() || <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </div>
            )}
            {creatorName && (
              <span className="min-w-0 max-w-[140px] truncate text-[10px] text-muted-foreground sm:max-w-[180px] sm:text-xs" title={creatorName}>
                {creatorName}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex cursor-help items-center gap-1.5 text-[10px] text-muted-foreground sm:text-xs">
                  <FileText className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                  <span>{assuntosCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                Quantidade de assuntos cadastrados nesta tese
              </TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-8 shrink-0 text-[10px] text-accent hover:bg-accent/10 sm:text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              Abrir →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
