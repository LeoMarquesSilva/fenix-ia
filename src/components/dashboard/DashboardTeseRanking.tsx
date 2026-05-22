import { useNavigate } from 'react-router-dom'
import { Flame, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { TeseRankingRow } from '@/hooks/useTeseRanking'
import { cn } from '@/lib/utils'

export function DashboardTeseRanking({
  rows,
  isLoading,
  error,
}: {
  rows: TeseRankingRow[] | undefined
  isLoading: boolean
  error: unknown
}) {
  const navigate = useNavigate()
  const { isAdvogado } = useAuth()

  return (
    <Card className="overflow-hidden border">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">
            <Flame className="h-5 w-5" />
          </span>
          Teses mais usadas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ordenadas por quantidade de aberturas no editor (desde o início do
          registro).
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando ranking…
          </div>
        )}
        {error != null ? (
          <p className="p-6 text-sm text-destructive">
            Não foi possível carregar o ranking. Tente novamente mais tarde.
          </p>
        ) : null}
        {!isLoading && error == null && rows && rows.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">
            Ainda não há dados de uso. Abra teses no editor para começar a
            contabilizar.
          </p>
        )}
        {!isLoading && error == null && rows && rows.length > 0 && (
          <ol className="divide-y">
            {rows.map((row, i) => (
              <li
                key={row.tese_id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap"
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                    i === 0 && 'bg-orange-500/20 text-orange-800 dark:text-orange-300',
                    i === 1 && 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
                    i === 2 && 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
                    i > 2 && 'bg-muted text-muted-foreground'
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">
                    {row.titulo}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {row.identificador}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold tabular-nums text-foreground">
                    {row.acessos}{' '}
                    {row.acessos === 1 ? 'abertura' : 'aberturas'}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => navigate(`/teses/${row.tese_id}`)}
                  >
                    {isAdvogado ? 'Visualizar' : 'Abrir'}
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
