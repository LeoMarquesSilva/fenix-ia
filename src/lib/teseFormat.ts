import type { Tese, TeseInsert, TeseUpdate } from '../types/supabase'

const PT = 'pt-BR'

/** Artigos, preposições e conjunções curtas em minúsculas (exceto se forem a primeira palavra do assunto). */
const ASSUNTO_PALAVRAS_MINUSCULAS = new Set([
  'a',
  'ao',
  'aos',
  'à',
  'às',
  'as',
  'com',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'mas',
  'na',
  'nas',
  'no',
  'nos',
  'o',
  'os',
  'ou',
  'para',
  'por',
  'que',
  'sem',
  'um',
  'uma',
  'umas',
  'uns',
])

function capitalizeWordSegment(segment: string): string {
  if (!segment) return segment
  const lower = segment.toLocaleLowerCase(PT)
  const idx = [...lower].findIndex((c) => /[a-zà-ÿ]/i.test(c))
  if (idx === -1) return segment
  return (
    lower.slice(0, idx) +
    lower.slice(idx, idx + 1).toLocaleUpperCase(PT) +
    lower.slice(idx + 1)
  )
}

function segmentoSoMinusculas(segment: string): string {
  return segment.toLocaleLowerCase(PT)
}

/** Uma única letra (conjunção/artigo) entre palavras — fica minúscula; não usado dentro de palavras com hífen. */
function ehUmaLetraConectora(segment: string): boolean {
  const s = segment.toLocaleLowerCase(PT)
  if (s.length !== 1) return false
  return /\p{L}/u.test(s)
}

/**
 * Normaliza um assunto: estilo título em pt-BR (palavras cheias com inicial maiúscula;
 * de, da, e, etc., e letras isoladas entre termos em minúsculas).
 */
export function formatAssuntoPalavras(raw: string): string {
  const words = raw.trim().split(/\s+/).filter(Boolean)
  return words
    .map((word, wordIndex) => {
      const hasHyphen = word.includes('-')
      if (!hasHyphen) {
        const lower = word.toLocaleLowerCase(PT)
        const isFirstWord = wordIndex === 0
        if (
          !isFirstWord &&
          (ASSUNTO_PALAVRAS_MINUSCULAS.has(lower) || ehUmaLetraConectora(word))
        ) {
          return segmentoSoMinusculas(word)
        }
        return capitalizeWordSegment(word)
      }
      const segments = word.split('-')
      return segments
        .map((seg, segIndex) => {
          const isFirstSegmentOfAssunto = wordIndex === 0 && segIndex === 0
          const lower = seg.toLocaleLowerCase(PT)
          if (
            !isFirstSegmentOfAssunto &&
            ASSUNTO_PALAVRAS_MINUSCULAS.has(lower)
          ) {
            return segmentoSoMinusculas(seg)
          }
          if (!isFirstSegmentOfAssunto && ehUmaLetraConectora(seg)) {
            return segmentoSoMinusculas(seg)
          }
          return capitalizeWordSegment(seg)
        })
        .join('-')
    })
    .join(' ')
}

/** Lista de assuntos sem duplicatas semânticas (após normalizar). */
export function formatAssuntosLista(assuntos: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of assuntos) {
    const n = formatAssuntoPalavras(raw)
    if (!n) continue
    const key = n.toLocaleLowerCase(PT)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(n)
  }
  return out
}

/** Títulos de teses sempre em maiúsculas (pt-BR). */
export function formatTituloTese(titulo: string): string {
  return titulo.trim().toLocaleUpperCase(PT)
}

export function normalizeTeseRow(tese: Tese): Tese {
  const rawList = (tese.assuntos ?? []).filter((a): a is string => Boolean(a?.trim()))
  const assuntosNorm = rawList.length ? formatAssuntosLista(rawList) : null
  return {
    ...tese,
    titulo: formatTituloTese(tese.titulo),
    assuntos: assuntosNorm && assuntosNorm.length > 0 ? assuntosNorm : null,
  }
}

export function normalizeTeseInsert(tese: TeseInsert): TeseInsert {
  const out: TeseInsert = { ...tese }
  if (typeof out.titulo === 'string') {
    out.titulo = formatTituloTese(out.titulo)
  }
  if (out.assuntos != null && Array.isArray(out.assuntos)) {
    const list = out.assuntos.filter((a): a is string => Boolean(a?.trim()))
    out.assuntos = list.length ? formatAssuntosLista(list) : null
  }
  return out
}

export function normalizeTeseUpdate(updates: TeseUpdate): TeseUpdate {
  const out: TeseUpdate = { ...updates }
  if (out.titulo !== undefined && typeof out.titulo === 'string') {
    out.titulo = formatTituloTese(out.titulo)
  }
  if (out.assuntos !== undefined && out.assuntos != null && Array.isArray(out.assuntos)) {
    const list = out.assuntos.filter((a): a is string => Boolean(a?.trim()))
    out.assuntos = list.length ? formatAssuntosLista(list) : null
  }
  return out
}
