import { BarChart3, FileText, TrendingUp, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function DashboardKPIs({
  totalTeses,
  areasCount,
  assuntosCount,
  selectedCount,
}: {
  totalTeses: number
  areasCount: number
  assuntosCount: number
  selectedCount: number
}) {
  const items = [
    {
      label: 'Total de teses',
      value: totalTeses,
      icon: FileText,
      iconClass: 'bg-primary/10 text-primary',
    },
    {
      label: 'Áreas',
      value: areasCount,
      icon: BarChart3,
      iconClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    },
    {
      label: 'Assuntos',
      value: assuntosCount,
      icon: TrendingUp,
      iconClass: 'bg-accent/10 text-accent',
    },
    {
      label: 'Selecionadas',
      value: selectedCount > 0 ? selectedCount : '—',
      sub: selectedCount > 0 ? 'para edição em lote' : undefined,
      icon: Zap,
      iconClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, sub, icon: Icon, iconClass }) => (
        <Card
          key={label}
          className="border bg-card shadow-sm transition-shadow hover:shadow-md"
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                {label}
              </p>
              <p className="text-xl font-bold tabular-nums leading-tight sm:text-2xl">
                {value}
              </p>
              {sub && (
                <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                  {sub}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
