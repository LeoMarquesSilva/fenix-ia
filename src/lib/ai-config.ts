/**
 * Configuração da IA para teses jurídicas - Fênix I.A
 *
 * Modelo atual: gpt-4o (OpenAI)
 * - Mais recente e capaz que gpt-4-turbo
 * - 128k tokens de contexto
 * - Melhor em raciocínio jurídico e geração de texto estruturado
 *
 * Para uma LLM forte focada em teses jurídicas, considere:
 * 1. Fine-tuning com corpus jurídico brasileiro (STF, STJ, doutrina)
 * 2. RAG com base de jurisprudência e legislação
 * 3. System prompt especializado (já implementado)
 * 4. Chain-of-thought para fundamentação complexa
 */

export const AI_MODEL = 'gpt-4o'

/** Prompts que geram conteúdo para aplicar no editor (mostrar botão Aplicar) */
export const PROMPTS_APPLICAVEIS = [
  'melhorar',
  'fundamentar',
  'reescrever',
  'expandir',
  'adicionar',
  'corrigir',
  'converter',
  'formalizar',
  'citação',
  'conclusão',
  'introdução',
  'desenvolvimento',
]

/** Prompts informativos - NÃO mostrar botão Aplicar (resumo, análise, sugestões) */
export const PROMPTS_NAO_APPLICAVEIS = [
  'resumir',
  'explicar',
  'analisar',
  'sugerir',
  'revisar',
  'criticar',
  'avaliar',
]

/** Verifica se a resposta deve mostrar botão "Aplicar no Editor" */
export function promptDeveAplicar(userPrompt: string): boolean {
  const lower = userPrompt.toLowerCase().trim()
  if (PROMPTS_NAO_APPLICAVEIS.some((p) => lower.includes(p))) return false
  if (PROMPTS_APPLICAVEIS.some((p) => lower.includes(p))) return true
  return false
}
