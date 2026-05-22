/** Segmentos da URL → valor de `tipo_tese` no cadastro (Upload Word / IA). */
export const SEGMENT_TO_TIPO: Record<string, string> = {
  tese: 'Tese',
  consultivo: 'Consultivo',
}

export function tipoTeseFromSegmento(
  segmento: string | null
): string | undefined {
  if (!segmento) return undefined
  return SEGMENT_TO_TIPO[segmento]
}
