/** Modo do assistente de peças (alinhado a `PeticaoFlowMode` em peticao-ai). */
export const PETICAO_FLOW = {
  INICIAL_EXECUCAO: 'inicial_execucao',
  CONTESTACAO_RECURSO: 'contestacao_recurso',
  MANIFESTACAO: 'manifestacao',
} as const

export type PeticaoFlowKey = (typeof PETICAO_FLOW)[keyof typeof PETICAO_FLOW]

/** Tipos de peça em Contestação / Recurso. */
export const TIPOS_CONTESTACAO_RECURSO = [
  'Contestação',
  'Recurso Ordinário',
  'Apelação',
] as const

export type TipoContestacaoRecurso = (typeof TIPOS_CONTESTACAO_RECURSO)[number]

/** Tipos de manifestação (lista inicial — refinável). */
export const TIPOS_MANIFESTACAO = [
  'Manifestação em geral',
  'Contrarrazões',
  'Manifestação sobre provas',
  'Cumprimento de diligência / manifestação de cumprimento',
  'Manifestação em incidente ou impugnação',
] as const

export type TipoManifestacao = (typeof TIPOS_MANIFESTACAO)[number]

/** Extensões aceitas nos inputs de arquivo (sem .doc legado). */
export const PETICAO_FILE_ACCEPT = '.pdf,.png,.docx'
