import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import Tesseract from 'tesseract.js'
import mammoth from 'mammoth'
import { AI_MODEL } from './ai-config'
import { formatTituloTese } from './teseFormat'
import {
  CONTESTACAO_CIVEL_ESQUELETO_MARKDOWN,
  isContestacaoCivelTipo,
} from '@/constants/contestacao-civel-esqueleto'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

export type PeticaoFlowMode =
  | 'inicial_execucao'
  | 'contestacao_recurso'
  | 'manifestacao'

export interface PeticaoDocumentoInput {
  file: File
  instrucaoUso: string
}

export interface ExecutadoExtraido {
  razaoSocial: string
  cnpj: string
  endereco: string
  nire: string
  municipioUf: string
}

export interface DocumentoProcessado {
  fileName: string
  mimeType: string
  instrucaoUso: string
  textExtracted: string
  ocrUsed: boolean
  imageDataUrl?: string
}

export interface DynamicQuestion {
  id: string
  pergunta: string
  tipo: 'texto' | 'valor' | 'data' | 'select'
  obrigatoria: boolean
  ajuda?: string
  opcoes?: string[]
}

export interface PeticaoWizardData {
  documentosProcessados: DocumentoProcessado[]
  executadoExtraido: ExecutadoExtraido
  perguntasDinamicas: DynamicQuestion[]
}

export interface PreparePeticaoWizardParams {
  nomeCliente: string
  fatos: string
  tipoPeticao: string
  parteContraria: string
  documentos: PeticaoDocumentoInput[]
  /** Usado no fluxo Manifestações. */
  tipoManifestacao?: string
}

export interface GeneratePeticaoFinalParams {
  nomeCliente: string
  fatos: string
  tipoPeticao: string
  parteContraria: string
  respostasDinamicas: Array<{ id: string; pergunta: string; resposta: string }>
  wizardData: PeticaoWizardData
  flowMode?: PeticaoFlowMode
  tipoManifestacao?: string
}

export interface TeseFonteUtilizada {
  id: string
  titulo: string
  tipo_tese: string | null
  score: number
}

interface TeseContextRow {
  id: string
  titulo: string
  descricao: string | null
  area: string | null
  assuntos: string[] | null
  texto_conteudo: string | null
  tipo_tese: string | null
}

const EXECUTADO_VAZIO: ExecutadoExtraido = {
  razaoSocial: '',
  cnpj: '',
  endereco: '',
  nire: '',
  municipioUf: '',
}

function truncateText(value: string, max = 6000): string {
  if (value.length <= max) return value
  return `${value.slice(0, max)}...`
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeMultiline(value: string): string {
  return value
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

function firstRegex(value: string, pattern: RegExp): string {
  return value.match(pattern)?.[0]?.trim() || ''
}

function cleanEntityField(value: string, max = 180): string {
  if (!value) return ''
  const compact = normalizeWhitespace(
    value
      .replace(/Ficha Cadastral/gi, '')
      .replace(/Página:\s*\d+\s*\/\s*\d+/gi, '')
      .replace(/Dados da Empresa/gi, '')
      .replace(/\bStatus:\s*[A-ZX]+\b/gi, '')
      .trim()
  )
  return compact.slice(0, max)
}

function extractLabelValue(text: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`${escaped}\\s*:\\s*([^\\n]+)`, 'i'),
    new RegExp(`${escaped}\\s+([^\\n]+)`, 'i'),
  ]
  for (const pattern of patterns) {
    const value = text.match(pattern)?.[1]
    if (value) return cleanEntityField(value)
  }
  return ''
}

function extractHeuristicExecutado(text: string): ExecutadoExtraido {
  const normalized = normalizeMultiline(text)
  const cnpj = firstRegex(normalized, /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/)
  const nire = firstRegex(normalized, /\bNIRE[:\s]*\d{8,12}\b/i).replace(/NIRE[:\s]*/i, '')

  const razaoFromLabel =
    extractLabelValue(normalized, 'Nome da Empresa') ||
    extractLabelValue(normalized, 'Razão Social')
  const enderecoFromLabel = extractLabelValue(normalized, 'Endereço')
  const municipioUfFromLabel = firstRegex(
    enderecoFromLabel,
    /\b[A-ZÀ-Ú][A-ZÀ-Úa-zà-ú\s]{2,40}\/[A-Z]{2}\b/
  ).replace('/', ' - ')

  const razaoLine =
    normalized
      .split('\n')
      .map((line) => line.trim())
      .find((line) =>
        /\b(LTDA|S\.A\.|SOCIEDADE|EMPRESA|EIRELI|MEI|ME)\b/i.test(line)
      ) || ''

  const enderecoLine =
    normalized
      .split('\n')
      .map((line) => line.trim())
      .find((line) =>
        /\b(RUA|AVENIDA|AV\.|ALAMEDA|PRAÇA|TRAVESSA|RODOVIA|Nº|NUMERO)\b/i.test(line)
      ) || ''

  const municipioUf = firstRegex(
    normalized,
    /\b[A-ZÀ-Ú][A-ZÀ-Úa-zà-ú\s]{2,40}\s*-\s*[A-Z]{2}\b/
  )

  return {
    razaoSocial: cleanEntityField(razaoFromLabel || razaoLine),
    cnpj: cleanEntityField(normalizeWhitespace(cnpj)),
    endereco: cleanEntityField(enderecoFromLabel || enderecoLine, 260),
    nire: cleanEntityField(normalizeWhitespace(nire)),
    municipioUf: cleanEntityField(municipioUfFromLabel || normalizeWhitespace(municipioUf)),
  }
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** MIME efetivo (fallback por extensão se o browser não preencher). */
export function resolvePeticaoFileMime(file: File): string {
  const t = (file.type || '').toLowerCase()
  if (t) return t
  const name = file.name.toLowerCase()
  if (name.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (name.endsWith('.pdf')) return 'application/pdf'
  if (name.endsWith('.png')) return 'image/png'
  return ''
}

export function isPeticaoAttachmentAccepted(file: File): boolean {
  const mime = resolvePeticaoFileMime(file)
  return (
    mime === 'application/pdf' ||
    mime === 'image/png' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
}

async function ocrImage(input: string | HTMLCanvasElement): Promise<string> {
  const result = await Tesseract.recognize(input, 'por')
  return normalizeWhitespace(result.data.text || '')
}

async function extractTextFromPdf(file: File): Promise<{ text: string; ocrUsed: boolean }> {
  const pdfData = await readFileAsArrayBuffer(file)
  const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise
  const pagesText: string[] = []
  let usedOcr = false

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum += 1) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageText = normalizeWhitespace(
      textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim()
    )

    if (pageText.length >= 80) {
      pagesText.push(pageText)
      continue
    }

    const viewport = page.getViewport({ scale: 1.8 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (!ctx) continue

    await page.render({ canvasContext: ctx, viewport, canvas }).promise
    const textFromOcr = await ocrImage(canvas)
    if (textFromOcr) {
      usedOcr = true
      pagesText.push(textFromOcr)
    }
  }

  return {
    text: truncateText(normalizeMultiline(pagesText.join('\n\n')), 20000),
    ocrUsed: usedOcr,
  }
}

async function extractTextFromDocx(file: File): Promise<string> {
  const buf = await readFileAsArrayBuffer(file)
  const result = await mammoth.extractRawText({ arrayBuffer: buf })
  return truncateText(normalizeMultiline(result.value || ''), 20000)
}

async function processAttachments(
  documentos: PeticaoDocumentoInput[]
): Promise<DocumentoProcessado[]> {
  const processed: DocumentoProcessado[] = []

  for (const doc of documentos) {
    const mimeType = resolvePeticaoFileMime(doc.file)

    if (mimeType === 'application/pdf') {
      const pdf = await extractTextFromPdf(doc.file)
      processed.push({
        fileName: doc.file.name,
        mimeType,
        instrucaoUso: doc.instrucaoUso,
        textExtracted: pdf.text,
        ocrUsed: pdf.ocrUsed,
      })
      continue
    }

    if (mimeType === 'image/png') {
      const imageDataUrl = await readFileAsDataUrl(doc.file)
      const text = await ocrImage(imageDataUrl)
      processed.push({
        fileName: doc.file.name,
        mimeType,
        instrucaoUso: doc.instrucaoUso,
        textExtracted: truncateText(text, 12000),
        ocrUsed: true,
        imageDataUrl,
      })
      continue
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const text = await extractTextFromDocx(doc.file)
      processed.push({
        fileName: doc.file.name,
        mimeType,
        instrucaoUso: doc.instrucaoUso,
        textExtracted: text,
        ocrUsed: false,
      })
      continue
    }
  }

  return processed
}

async function callOpenAi(messages: unknown[], maxTokens = 2200): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Erro ao chamar serviço de IA')
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function tokenize(value: string): string[] {
  return stripAccents(value.toLowerCase())
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)
}

function scoreTeseRelevance(
  tese: TeseContextRow,
  queryTokens: string[],
  querySet: Set<string>,
  flowMode: PeticaoFlowMode,
  tipoRotulo: string
): number {
  const joined = [
    tese.titulo,
    tese.descricao || '',
    tese.area || '',
    (tese.assuntos || []).join(' '),
    tese.tipo_tese || '',
    (tese.texto_conteudo || '').slice(0, 1200),
  ].join(' ')

  const tokens = tokenize(joined)
  if (tokens.length === 0) return 0
  let score = 0
  for (const token of tokens) {
    if (querySet.has(token)) score += 1
  }
  const overlap = score / Math.max(1, Math.sqrt(tokens.length))

  const tipoLower = (tese.tipo_tese || '').toLowerCase()
  const rotuloLower = tipoRotulo.toLowerCase()

  if (flowMode === 'inicial_execucao') {
    if (tipoLower.includes('petição inicial')) score += 2
    if (tipoLower.includes('execução')) score += 1.5
  } else if (flowMode === 'contestacao_recurso') {
    if (tipoLower.includes('contesta')) score += 2
    if (tipoLower.includes('apelação') || tipoLower.includes('apelacao')) score += 2
    if (tipoLower.includes('recurso')) score += 1.8
    if (tipoLower.includes('embarg')) score += 1.2
    if (rotuloLower.includes('apelação') || rotuloLower.includes('apelacao')) {
      if (tipoLower.includes('apelação') || tipoLower.includes('apelacao')) score += 1.5
    }
    if (rotuloLower.includes('contesta') && tipoLower.includes('contesta')) score += 1.5
  } else {
    if (tipoLower.includes('manifest')) score += 2
    if (tipoLower.includes('contrarraz')) score += 1.8
    if (tipoLower.includes('diligência') || tipoLower.includes('diligencia')) score += 1.2
  }

  const titleTokens = new Set(tokenize(tese.titulo))
  for (const token of queryTokens) {
    if (titleTokens.has(token)) score += 0.6
  }

  return overlap + score
}

async function fetchAllTesesForContext(): Promise<TeseContextRow[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []

  const pageSize = 1000
  let from = 0
  const rows: TeseContextRow[] = []

  while (true) {
    const to = from + pageSize - 1
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/teses?select=id,titulo,descricao,area,assuntos,texto_conteudo,tipo_tese&or=(tipo_tese.is.null,tipo_tese.not.in.("Petição Inicial Privada","Contrato Privado - Prestação de Serviços"))&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Range: `${from}-${to}`,
          Prefer: 'count=exact',
        },
      }
    )

    if (!response.ok) break
    const data = (await response.json()) as TeseContextRow[]
    rows.push(...data)

    if (data.length < pageSize) break
    from += pageSize
    if (from > 10000) break
  }

  return rows
}

async function extractExecutadoWithAI(
  rawDocumentText: string,
  parteContraria: string
): Promise<ExecutadoExtraido | null> {
  if (!rawDocumentText.trim()) return null

  const prompt = `Extraia os dados da parte executada (pessoa jurídica) a partir do texto abaixo.
Retorne APENAS JSON válido com as chaves:
{
  "razaoSocial": "",
  "cnpj": "",
  "endereco": "",
  "nire": "",
  "municipioUf": ""
}
Regras:
- priorize dados da empresa executada.
- não invente valores.
- se não encontrar, retornar string vazia.
- normalize CNPJ para formato 00.000.000/0000-00 quando possível.

Parte contrária informada no formulário: ${parteContraria || '(não informado)'}

Texto extraído dos documentos:
${truncateText(rawDocumentText, 12000)}`

  const content = await callOpenAi(
    [
      {
        role: 'system',
        content:
          'Você é um extrator de entidades jurídicas brasileiras especializado em documentos empresariais e JUCEMG.',
      },
      { role: 'user', content: prompt },
    ],
    600
  )

  try {
    const parsed = JSON.parse(content)
    return {
      razaoSocial: cleanEntityField(parsed.razaoSocial || ''),
      cnpj: cleanEntityField(parsed.cnpj || ''),
      endereco: cleanEntityField(parsed.endereco || '', 260),
      nire: cleanEntityField(parsed.nire || ''),
      municipioUf: cleanEntityField(parsed.municipioUf || ''),
    }
  } catch {
    return null
  }
}

function parseQuestionsJson(content: string): DynamicQuestion[] | null {
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      return parsed.questions.map((q: Record<string, unknown>, index: number) => ({
        id: (q.id as string) || `q${index + 1}`,
        pergunta: (q.pergunta as string) || 'Informe um dado complementar',
        tipo: ['texto', 'valor', 'data', 'select'].includes(q.tipo as string)
          ? (q.tipo as DynamicQuestion['tipo'])
          : 'texto',
        obrigatoria: q.obrigatoria !== false,
        ajuda: (q.ajuda as string) || undefined,
        opcoes: Array.isArray(q.opcoes) ? (q.opcoes as string[]) : undefined,
      }))
    }
  } catch {
    return null
  }
  return null
}

async function generateDynamicQuestionsExecucao(input: {
  nomeCliente: string
  fatos: string
  tipoPeticao: string
  parteContraria: string
  executadoExtraido: ExecutadoExtraido
  documentosProcessados: DocumentoProcessado[]
}): Promise<DynamicQuestion[]> {
  const docsCompact = input.documentosProcessados
    .map(
      (d) =>
        `Arquivo: ${d.fileName}\nInstrução de uso: ${d.instrucaoUso}\nTrecho: ${truncateText(
          d.textExtracted,
          600
        )}`
    )
    .join('\n\n')

  const prompt = `Gere perguntas objetivas para completar uma petição inicial de execução de título extrajudicial.
Retorne SOMENTE JSON no formato:
{
  "questions":[
    {"id":"q1","pergunta":"...","tipo":"texto|valor|data|select","obrigatoria":true,"ajuda":"...","opcoes":["..."]}
  ]
}
Regras:
- entre 4 e 8 perguntas
- focar lacunas críticas (título executivo, valor atualizado, mora, competência, pedidos, citação, honorários)
- use dados extraídos do executado quando houver
- não repetir perguntas já respondidas pelos campos base.

Dados base:
Nome cliente: ${input.nomeCliente}
Fatos: ${input.fatos}
Tipo: ${input.tipoPeticao}
Parte contrária: ${input.parteContraria}

Executado extraído:
${JSON.stringify(input.executadoExtraido)}

Documentos:
${docsCompact || 'Sem anexos processados.'}`

  const content = await callOpenAi(
    [
      {
        role: 'system',
        content:
          'Você é um assistente jurídico brasileiro especializado em peças de execução de título extrajudicial.',
      },
      { role: 'user', content: prompt },
    ],
    1200
  )

  const parsed = parseQuestionsJson(content)
  if (parsed) return parsed

  return [
    {
      id: 'q1',
      pergunta: 'Qual é o valor atualizado do débito que será executado?',
      tipo: 'valor',
      obrigatoria: true,
    },
    {
      id: 'q2',
      pergunta: 'Qual é o título executivo (ex.: contrato, nota promissória, duplicata)?',
      tipo: 'texto',
      obrigatoria: true,
    },
    {
      id: 'q3',
      pergunta: 'Qual a data de vencimento e constituição em mora?',
      tipo: 'data',
      obrigatoria: false,
    },
    {
      id: 'q4',
      pergunta: 'Há pedido de citação para pagamento em 3 dias e penhora em caso de inadimplemento?',
      tipo: 'texto',
      obrigatoria: true,
    },
  ]
}

async function generateDynamicQuestionsContestacao(input: {
  nomeCliente: string
  fatos: string
  tipoPeticao: string
  documentosProcessados: DocumentoProcessado[]
}): Promise<DynamicQuestion[]> {
  const docsCompact = input.documentosProcessados
    .map(
      (d) =>
        `Arquivo: ${d.fileName}\nInstrução: ${d.instrucaoUso}\nTrecho: ${truncateText(
          d.textExtracted,
          800
        )}`
    )
    .join('\n\n')

  const esqueletoCivelBlock = isContestacaoCivelTipo(input.tipoPeticao)
    ? `
Esqueleto de referência (contestação, área cível) — as perguntas devem ajudar a cobrir lacunas para esta estrutura:
${CONTESTACAO_CIVEL_ESQUELETO_MARKDOWN}
`
    : ''

  const prompt = `Com base no tipo de peça "${input.tipoPeticao}" e nos documentos, gere perguntas objetivas para redigir a peça processual.
Retorne SOMENTE JSON:
{
  "questions":[
    {"id":"q1","pergunta":"...","tipo":"texto|valor|data|select","obrigatoria":true,"ajuda":"...","opcoes":["..."]}
  ]
}
Regras:
- entre 4 e 8 perguntas
- adapte ao tipo: Contestação (defesa em primeiro grau), Recurso Ordinário ou Apelação
- focar em fatos faltantes, preclusões, tempestividade, contraminuta, preparo, razões recursais, prequestionamento quando couber
- use trechos dos documentos para não repetir o óbvio
${esqueletoCivelBlock}
Nome cliente: ${input.nomeCliente}
Fundamentação / narrativa do usuário: ${input.fatos}

Documentos (texto extraído):
${docsCompact}`

  const content = await callOpenAi(
    [
      {
        role: 'system',
        content:
          'Você é um assistente jurídico brasileiro especializado em contestação, recursos ordinários e apelações.',
      },
      { role: 'user', content: prompt },
    ],
    1200
  )

  const parsed = parseQuestionsJson(content)
  if (parsed) return parsed

  return [
    {
      id: 'q1',
      pergunta: 'Há questões de mérito ou apenas preliminares? Descreva.',
      tipo: 'texto',
      obrigatoria: true,
    },
    {
      id: 'q2',
      pergunta: 'Prazo e tempestividade: data da ciência e data protocolada (se souber).',
      tipo: 'texto',
      obrigatoria: false,
    },
    {
      id: 'q3',
      pergunta: 'Pedidos específicos que devem constar na peça (todos que lembrar).',
      tipo: 'texto',
      obrigatoria: true,
    },
  ]
}

async function generateDynamicQuestionsManifestacao(input: {
  nomeCliente: string
  fatos: string
  tipoManifestacao: string
  documentosProcessados: DocumentoProcessado[]
}): Promise<DynamicQuestion[]> {
  const docsCompact = input.documentosProcessados
    .map(
      (d) =>
        `Arquivo: ${d.fileName}\nInstrução: ${d.instrucaoUso}\nTrecho: ${truncateText(
          d.textExtracted,
          800
        )}`
    )
    .join('\n\n')

  const prompt = `O advogado precisa elaborar manifestação do tipo: "${input.tipoManifestacao}".
Gere perguntas objetivas para completar a peça.
Retorne SOMENTE JSON:
{
  "questions":[
    {"id":"q1","pergunta":"...","tipo":"texto|valor|data|select","obrigatoria":true,"ajuda":"...","opcoes":["..."]}
  ]
}
Regras:
- entre 4 e 8 perguntas
- leve em conta o despacho/intimação nos documentos
- focar em fatos, provas, prazos, pedidos e estratégia processual

Nome cliente: ${input.nomeCliente}
Observações do usuário: ${input.fatos || '(não informado)'}

Documentos:
${docsCompact}`

  const content = await callOpenAi(
    [
      {
        role: 'system',
        content:
          'Você é um assistente jurídico brasileiro especializado em manifestações processuais, contrarrazões e cumprimento de diligências.',
      },
      { role: 'user', content: prompt },
    ],
    1200
  )

  const parsed = parseQuestionsJson(content)
  if (parsed) return parsed

  return [
    {
      id: 'q1',
      pergunta: 'Qual o ponto central que o juízo determinou e como pretende atender?',
      tipo: 'texto',
      obrigatoria: true,
    },
    {
      id: 'q2',
      pergunta: 'Há prazo fatal? Qual data?',
      tipo: 'data',
      obrigatoria: false,
    },
  ]
}

export async function preparePeticaoWizardData(
  params: PreparePeticaoWizardParams,
  flowMode: PeticaoFlowMode = 'inicial_execucao'
): Promise<PeticaoWizardData> {
  const documentosProcessados = await processAttachments(params.documentos)

  if (flowMode === 'contestacao_recurso' || flowMode === 'manifestacao') {
    const tipoManifest = params.tipoManifestacao || ''
    const perguntasDinamicas =
      flowMode === 'manifestacao'
        ? await generateDynamicQuestionsManifestacao({
            nomeCliente: params.nomeCliente,
            fatos: params.fatos,
            tipoManifestacao: tipoManifest || 'Manifestação em geral',
            documentosProcessados,
          })
        : await generateDynamicQuestionsContestacao({
            nomeCliente: params.nomeCliente,
            fatos: params.fatos,
            tipoPeticao: params.tipoPeticao,
            documentosProcessados,
          })

    return {
      documentosProcessados,
      executadoExtraido: { ...EXECUTADO_VAZIO },
      perguntasDinamicas,
    }
  }

  const bigText = documentosProcessados.map((d) => d.textExtracted).join('\n\n')
  const extractedByAi = await extractExecutadoWithAI(bigText, params.parteContraria)
  const heuristic = extractHeuristicExecutado(bigText)
  const executadoExtraido: ExecutadoExtraido = {
    razaoSocial:
      cleanEntityField(extractedByAi?.razaoSocial || '') ||
      cleanEntityField(heuristic.razaoSocial || '') ||
      cleanEntityField(params.parteContraria || ''),
    cnpj:
      cleanEntityField(extractedByAi?.cnpj || '') ||
      cleanEntityField(heuristic.cnpj || ''),
    endereco:
      cleanEntityField(extractedByAi?.endereco || '', 260) ||
      cleanEntityField(heuristic.endereco || '', 260),
    nire:
      cleanEntityField(extractedByAi?.nire || '') ||
      cleanEntityField(heuristic.nire || ''),
    municipioUf:
      cleanEntityField(extractedByAi?.municipioUf || '') ||
      cleanEntityField(heuristic.municipioUf || ''),
  }
  const perguntasDinamicas = await generateDynamicQuestionsExecucao({
    nomeCliente: params.nomeCliente,
    fatos: params.fatos,
    tipoPeticao: params.tipoPeticao,
    parteContraria: params.parteContraria,
    executadoExtraido,
    documentosProcessados,
  })

  return {
    documentosProcessados,
    executadoExtraido,
    perguntasDinamicas,
  }
}

export async function generatePeticaoInicialFinalWithAI(
  params: GeneratePeticaoFinalParams
): Promise<{
  titulo: string
  descricao: string
  texto_conteudo: string
  fontesUtilizadas: TeseFonteUtilizada[]
}> {
  const flowMode: PeticaoFlowMode = params.flowMode ?? 'inicial_execucao'
  const docsText = params.wizardData.documentosProcessados
    .map(
      (d) =>
        `Arquivo: ${d.fileName} (${d.ocrUsed ? 'OCR aplicado' : 'texto extraído'})\nInstrução do usuário: ${
          d.instrucaoUso
        }\nConteúdo: ${truncateText(d.textExtracted, 1800)}`
    )
    .join('\n\n')

  const answers = params.respostasDinamicas
    .map((a) => `${a.pergunta}\nResposta: ${a.resposta}`)
    .join('\n\n')

  const allTeses = await fetchAllTesesForContext()
  const tipoRotulo =
    flowMode === 'manifestacao'
      ? params.tipoManifestacao || params.tipoPeticao
      : params.tipoPeticao

  const relevanceQuery = [
    tipoRotulo,
    params.fatos,
    params.parteContraria,
    answers,
    params.wizardData.executadoExtraido.razaoSocial,
    params.wizardData.executadoExtraido.cnpj,
    params.tipoManifestacao || '',
  ].join(' ')

  const queryTokens = tokenize(relevanceQuery)
  const querySet = new Set(queryTokens)
  const topRankedTeses = allTeses
    .map((tese) => ({
      tese,
      score: scoreTeseRelevance(tese, queryTokens, querySet, flowMode, tipoRotulo),
    }))
    .filter((entry) => entry.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)

  const topTeses = topRankedTeses.map(({ tese }) => tese)

  const tesesContext = topTeses
    .map(
      (tese, idx) =>
        `${idx + 1}. ${tese.titulo}\nTipo: ${tese.tipo_tese || 'N/A'}\nDescrição: ${
          tese.descricao || ''
        }\nAssuntos: ${(tese.assuntos || []).join(', ')}\nTrecho: ${truncateText(
          (tese.texto_conteudo || '').replace(/<[^>]+>/g, ' '),
          700
        )}`
    )
    .join('\n\n')

  let systemPrompt: string
  let userContent: string
  let tituloBase: string

  if (flowMode === 'inicial_execucao') {
    systemPrompt = `Você é um redator jurídico brasileiro especialista em petição inicial de execução de título extrajudicial.
Gere a peça em HTML, com linguagem técnica, sem inventar dados.
Estrutura obrigatória: endereçamento, qualificação, fatos, fundamentos, pedidos, valor da causa, requerimentos finais.
Quando existir CNPJ/razão social/endereço do executado, use esses dados na qualificação.
Quando houver teses do acervo interno aderentes, aproveite fundamentos e estrutura argumentativa sem copiar literalmente.`

    userContent = `Dados principais:
Cliente/exequente: ${params.nomeCliente}
Executado (campo base): ${params.parteContraria}
Tipo da petição: ${params.tipoPeticao}
Fatos:
${params.fatos}

Dados extraídos dos anexos (executado):
${JSON.stringify(params.wizardData.executadoExtraido)}

Respostas complementares:
${answers}

Contexto dos documentos:
${docsText}

Teses do banco Supabase potencialmente relevantes:
${tesesContext || 'Sem teses relevantes encontradas no acervo.'}`

    tituloBase = `Petição Inicial - Execução de Título Extrajudicial - ${params.nomeCliente}`
  } else if (flowMode === 'contestacao_recurso') {
    const esqueletoContestacaoCivel = isContestacaoCivelTipo(params.tipoPeticao)
      ? `

CONTESTAÇÃO (área cível): siga a estrutura abaixo, adaptando títulos e ordem ao caso concreto. Numere seções de forma clara (I, II, III… ou conforme o esqueleto).
${CONTESTACAO_CIVEL_ESQUELETO_MARKDOWN}
`
      : ''

    systemPrompt = `Você é um redator jurídico brasileiro especializado em ${params.tipoPeticao}.
Gere a peça em HTML (parágrafos, títulos com h2/h3 quando útil), linguagem técnica, sem inventar fatos.
Respeite o rito e a estrutura típica da peça (preliminares e mérito quando couber).
Use teses do acervo apenas como inspiração de fundamentação, sem copiar literalmente.${esqueletoContestacaoCivel}`

    userContent = `Tipo de peça: ${params.tipoPeticao}
Nome do cliente (polo ativo ou interessado conforme o caso): ${params.nomeCliente}
Fundamentação / narrativa fornecida pelo usuário:
${params.fatos}

Respostas complementares:
${answers}

Texto extraído e instruções dos documentos:
${docsText}

Teses do acervo potencialmente relevantes:
${tesesContext || 'Sem teses relevantes encontradas no acervo.'}`

    tituloBase = `${params.tipoPeticao} - ${params.nomeCliente}`
  } else {
    const tm = params.tipoManifestacao || params.tipoPeticao
    systemPrompt = `Você é um redator jurídico brasileiro especializado em manifestações processuais.
Gere a peça em HTML, com linguagem técnica, sem inventar dados.
A peça deve refletir o tipo de manifestação indicado e atender ao despacho/intimação descrito nos documentos.
Use teses do acervo apenas como inspiração, sem copiar literalmente.`

    userContent = `Tipo de manifestação: ${tm}
Nome do cliente: ${params.nomeCliente}
Observações adicionais do usuário:
${params.fatos || '(não informado)'}

Respostas complementares:
${answers}

Documentos (despacho, anexos, instruções):
${docsText}

Teses do acervo potencialmente relevantes:
${tesesContext || 'Sem teses relevantes encontradas no acervo.'}`

    tituloBase = `Manifestação (${tm}) - ${params.nomeCliente}`
  }

  const content = await callOpenAi(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
    5000
  )

  const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const descricao = truncateText(plain, 220)
  const titulo = formatTituloTese(tituloBase)

  return {
    titulo,
    descricao,
    texto_conteudo: content,
    fontesUtilizadas: topRankedTeses.map(({ tese, score }) => ({
      id: tese.id,
      titulo: tese.titulo,
      tipo_tese: tese.tipo_tese,
      score: Math.round(score * 100) / 100,
    })),
  }
}
