import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import Tesseract from 'tesseract.js'
import { AI_MODEL } from './ai-config'
import { formatTituloTese } from './teseFormat'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

export interface ContratoDocumentoInput {
  file: File
  instrucaoUso: string
}

export interface GenerateContratoPrestacaoParams {
  contratante: string
  documentoContratante: string
  enderecoContratante: string
  contratado: string
  documentoContratado: string
  enderecoContratado: string
  objeto: string
  prazoVigencia: string
  valorFormaPagamento: string
  multasPenalidades: string
  foro: string
  observacoes?: string
  documentos?: ContratoDocumentoInput[]
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function truncateText(value: string, max = 7000): string {
  if (value.length <= max) return value
  return `${value.slice(0, max)}...`
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

async function ocrImage(input: string | HTMLCanvasElement): Promise<string> {
  const result = await Tesseract.recognize(input, 'por')
  return normalizeWhitespace(result.data.text || '')
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfData = await readFileAsArrayBuffer(file)
  const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise
  const pagesText: string[] = []

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
    const ocrText = await ocrImage(canvas)
    if (ocrText) pagesText.push(ocrText)
  }

  return truncateText(normalizeWhitespace(pagesText.join('\n\n')), 22000)
}

async function buildDocumentContext(documentos: ContratoDocumentoInput[] = []) {
  const textBlocks: string[] = []
  const images: string[] = []

  for (const doc of documentos) {
    const mimeType = (doc.file.type || '').toLowerCase()
    if (mimeType === 'application/pdf') {
      const text = await extractTextFromPdf(doc.file)
      textBlocks.push(
        `Arquivo: ${doc.file.name}\nComo usar: ${doc.instrucaoUso}\nConteúdo: ${truncateText(text, 1800)}`
      )
      continue
    }
    if (mimeType === 'image/png') {
      const imageDataUrl = await readFileAsDataUrl(doc.file)
      const ocrText = await ocrImage(imageDataUrl)
      textBlocks.push(
        `Arquivo: ${doc.file.name}\nComo usar: ${doc.instrucaoUso}\nTexto OCR: ${truncateText(ocrText, 1400)}`
      )
      images.push(imageDataUrl)
    }
  }

  return { textBlocks, images }
}

export async function generateContratoPrestacaoWithAI(
  params: GenerateContratoPrestacaoParams
): Promise<{ titulo: string; descricao: string; texto_conteudo: string }> {
  const { textBlocks, images } = await buildDocumentContext(params.documentos || [])
  const userContent: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'high' | 'low' | 'auto' } }
  > = [
    {
      type: 'text',
      text: `Gere um contrato de prestação de serviços com as cláusulas completas, em HTML.
Dados:
Contratante: ${params.contratante}
Documento contratante: ${params.documentoContratante}
Endereço contratante: ${params.enderecoContratante}
Contratado: ${params.contratado}
Documento contratado: ${params.documentoContratado}
Endereço contratado: ${params.enderecoContratado}
Objeto: ${params.objeto}
Prazo de vigência: ${params.prazoVigencia}
Valor e forma de pagamento: ${params.valorFormaPagamento}
Multas/penalidades: ${params.multasPenalidades}
Foro: ${params.foro}
Observações: ${params.observacoes || 'Sem observações'}

Contexto de anexos:
${textBlocks.join('\n\n') || 'Sem anexos.'}`,
    },
  ]

  images.forEach((img, index) =>
    userContent.push({
      type: 'image_url',
      image_url: { url: img, detail: index === 0 ? 'high' : 'auto' },
    })
  )

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Você é advogado brasileiro especialista em contratos. Gere contrato de prestação de serviços em HTML, com cláusulas: objeto, obrigações, preço/pagamento, vigência, rescisão, multa, confidencialidade, LGPD quando cabível, foro e assinatura.',
        },
        { role: 'user', content: userContent },
      ],
      temperature: 0.35,
      max_tokens: 5000,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Erro ao gerar contrato')
  }

  const data = await response.json()
  const html = data.choices?.[0]?.message?.content || ''
  if (!html.trim()) throw new Error('A IA não retornou conteúdo para o contrato.')

  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return {
    titulo: formatTituloTese(`Contrato de Prestação de Serviços - ${params.contratante}`),
    descricao: truncateText(plain, 220),
    texto_conteudo: html,
  }
}

