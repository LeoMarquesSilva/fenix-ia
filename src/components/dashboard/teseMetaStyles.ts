import { cn } from '@/lib/utils'

/** Tipo de documento — destaque imediato (roxo Fênix vs verde consultivo). */
export function tipoTeseBadgeClass(tipo: string | null | undefined) {
  if (!tipo?.trim()) return ''
  const t = tipo.toLowerCase()
  if (t.includes('consult'))
    return cn(
      'border font-medium shadow-none',
      'border-emerald-600/35 bg-emerald-600/12 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-100'
    )
  return cn(
    'border font-medium shadow-none',
    'border-fenix-purple-dark/40 bg-fenix-purple-dark/12 text-fenix-navy dark:border-fenix-purple-light/45 dark:bg-fenix-purple-dark/25 dark:text-fenix-purple-light'
  )
}

export function areaBadgeClass() {
  return cn(
    'border font-medium shadow-none',
    'border-sky-600/35 bg-sky-500/12 text-sky-950 dark:border-sky-400/35 dark:bg-sky-500/15 dark:text-sky-100'
  )
}

export function assuntoBadgeClass() {
  return cn(
    'border font-medium shadow-none',
    'border-amber-600/40 bg-amber-500/14 text-amber-950 dark:border-amber-400/40 dark:bg-amber-500/12 dark:text-amber-100'
  )
}

export function moreCountBadgeClass() {
  return cn(
    'border border-border bg-muted/80 font-medium text-muted-foreground shadow-none'
  )
}

/** Ponto de status colorido por tipo (para uso no topo do card). */
export function tipoStatusDotClass(tipo: string | null | undefined) {
  if (!tipo?.trim()) return 'bg-muted-foreground/50'
  const t = tipo.toLowerCase()
  if (t.includes('consult'))
    return 'bg-emerald-500'
  return 'bg-fenix-purple-dark dark:bg-fenix-purple-light'
}
