import {
  BarChart3,
  FileText,
  MessageSquare,
  PieChart,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getAreaIcon } from '@/constants/area-icons'

type MetricRow = { name: string; count: number }
type CreatorRow = {
  userId: string
  name: string
  count: number
  avatarUrl: string | null
}

export function DashboardMetricsPanel({
  totalTeses,
  byArea,
  byMonth,
  byCreator,
  byTipo,
}: {
  totalTeses: number
  byArea: MetricRow[]
  byMonth: MetricRow[]
  byCreator: CreatorRow[]
  byTipo: MetricRow[]
}) {
  const maxArea = byArea[0]?.count || 1
  const maxMonth = Math.max(...byMonth.map((m) => m.count), 1)
  const maxTipo = byTipo[0]?.count || 1

  const teseCount = byTipo.find((t) => t.name === 'Tese')?.count ?? 0
  const consultivoCount =
    byTipo.find((t) => t.name === 'Consultivo')?.count ?? 0

  return (
    <div className="space-y-6">
      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="overflow-hidden border bg-gradient-to-br from-fenix-navy/5 to-transparent dark:from-fenix-navy/10">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fenix-navy/15 text-fenix-navy dark:bg-fenix-navy/25">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className="text-2xl font-bold tabular-nums text-fenix-navy dark:text-fenix-purple-light">
                {totalTeses}
              </p>
              <p className="text-[10px] text-muted-foreground">
                teses no filtro
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fenix-purple-dark/15 text-fenix-purple-dark dark:bg-fenix-purple-light/20 dark:text-fenix-purple-light">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Teses
              </p>
              <p className="text-2xl font-bold tabular-nums">{teseCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Consultivos
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {consultivoCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Criadores
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {byCreator.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico: Por tipo */}
      <Card className="border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="h-4 w-4 text-fenix-purple-dark dark:text-fenix-purple-light" />
            Por tipo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribuição entre Tese e Consultivo
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {byTipo.map((item) => {
              const isTese = item.name === 'Tese'
              const isConsultivo = item.name === 'Consultivo'
              return (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-2.5 min-w-[20px] rounded-full transition-all',
                      isTese &&
                        'bg-fenix-purple-dark/80 dark:bg-fenix-purple-light/80',
                      isConsultivo && 'bg-emerald-500/80',
                      !isTese && !isConsultivo && 'bg-muted'
                    )}
                    style={{
                      width: `${Math.max(12, (item.count / maxTipo) * 100)}%`,
                      maxWidth: '100%',
                    }}
                  />
                  <span className="truncate text-xs text-muted-foreground">
                    {item.name}
                  </span>
                  <span className="ml-auto text-xs font-semibold tabular-nums">
                    {item.count}
                  </span>
                </div>
              )
            })}
            {byTipo.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum dado</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico: Por área */}
      <Card className="border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-fenix-purple-dark dark:text-fenix-purple-light" />
            Por área
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Quantidade por área do escritório
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {byArea.map((item, i) => {
              const AreaIcon = getAreaIcon(item.name)
              return (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
                    <AreaIcon className="h-4 w-4" aria-hidden />
                  </div>
                  <div
                    className="h-2.5 min-w-[20px] rounded-full bg-gradient-to-r from-fenix-navy/70 to-fenix-purple-dark/70 transition-all dark:from-fenix-navy/80 dark:to-fenix-purple-light/80"
                    style={{
                      width: `${Math.max(12, (item.count / maxArea) * 100)}%`,
                      maxWidth: '100%',
                      opacity: 0.7 + (i % 3) * 0.1,
                    }}
                  />
                  <span className="truncate text-xs text-muted-foreground">
                    {item.name}
                  </span>
                  <span className="ml-auto text-xs font-semibold tabular-nums">
                    {item.count}
                  </span>
                </div>
              )
            })}
            {byArea.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum dado</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico: Por mês */}
      <Card className="border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-fenix-purple-dark dark:text-fenix-purple-light" />
            Por mês
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Evolução dos últimos 6 meses
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-end gap-1 border-b border-border pb-1">
            {byMonth.map((item) => (
              <div
                key={item.name}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className="w-full max-w-[2rem] rounded-t-md bg-gradient-to-t from-fenix-purple-dark/80 to-fenix-purple-light/60 transition-all dark:from-fenix-purple-dark dark:to-fenix-purple-light/70"
                  style={{
                    height: `${Math.max(6, (item.count / maxMonth) * 100)}%`,
                    minHeight: item.count > 0 ? '12px' : '4px',
                  }}
                />
                <span className="text-center text-[10px] leading-tight text-muted-foreground">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico: Top criadores */}
      <Card className="border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-fenix-purple-dark dark:text-fenix-purple-light" />
            Top criadores
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Colaboradores com mais teses no período
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {byCreator.map((item, i) => (
              <div
                key={item.userId}
                className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-muted/50"
              >
                <div className="relative shrink-0">
                  {item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt={item.name}
                      className="h-8 w-8 rounded-full border object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted text-xs font-bold text-muted-foreground">
                      {item.name?.charAt(0)?.toUpperCase() || (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                  )}
                  <span
                    className={cn(
                      'absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold',
                      i === 0 && 'bg-amber-500 text-amber-950',
                      i === 1 && 'bg-slate-400 text-white',
                      i === 2 && 'bg-amber-700 text-amber-100',
                      i > 2 && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {i + 1}
                  </span>
                </div>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {item.name}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-fenix-purple-dark dark:text-fenix-purple-light">
                  {item.count}
                </span>
              </div>
            ))}
            {byCreator.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum dado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
