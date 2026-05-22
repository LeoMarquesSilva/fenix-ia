import type { LucideIcon } from 'lucide-react'
import {
  Briefcase,
  Building2,
  FileSignature,
  TrendingDown,
  Scale,
  Gavel,
  LayoutGrid,
  Cpu,
} from 'lucide-react'
import type { AreaDireito } from '@/types/profiles'
import { AREAS_DIREITO } from '@/types/profiles'

/** Ícone para cada área do escritório */
export const AREA_ICONS: Record<NonNullable<AreaDireito>, LucideIcon> = {
  Trabalhista: Briefcase,
  Reestruturação: Building2,
  'Societário e Contratos': FileSignature,
  'Distressed Deals': TrendingDown,
  Cível: Scale,
  'Operações Legais': Gavel,
  Geral: LayoutGrid,
  'T.I': Cpu,
}

/** Retorna o ícone da área ou LayoutGrid como fallback */
export function getAreaIcon(area: string | null): LucideIcon {
  if (!area || !(area in AREA_ICONS)) return LayoutGrid
  return AREA_ICONS[area as NonNullable<AreaDireito>]
}

/** Lista de áreas com ícones (inclui Operações Legais) */
export const AREAS_COM_ICONES = AREAS_DIREITO.filter(Boolean) as NonNullable<
  AreaDireito
>[]
