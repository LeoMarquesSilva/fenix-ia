// Cliente OpenAI para geração de teses jurídicas
import { AI_MODEL } from './ai-config'
import { formatAssuntosLista, formatTituloTese } from './teseFormat'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export interface GenerateTeseParams {
  prompt: string
  processoContent?: string
  tesesExistentes?: Array<{
    titulo: string
    descricao: string | null
    texto_conteudo: string | null
  }>
  area?: string
}

export interface GeneratePeticaoInicialParams {
  nomeCliente: string
  fatos: string
  tipoPeticao: string
  parteContraria: string
  documentos?: Array<{
    file: File
    instrucaoUso: string
  }>
}

type AttachmentContext = {
  pdfContext: Array<{ fileName: string; instrucaoUso: string; text: string }>
  images: Array<{ fileName: string; instrucaoUso: string; imageUrl: string }>
}

function htmlToPlainText(html: string): string {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  return (tempDiv.textContent || tempDiv.innerText || '').trim()
}

function truncateText(value: string, max = 6000): string {
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

function extractTextFromPdfBytes(bytes: Uint8Array): string {
  const raw = new TextDecoder('latin1').decode(bytes)

  const parenthesisChunks = raw.match(/\((?:\\.|[^\\()]){8,}\)/g) || []
  const parenthesisText = parenthesisChunks
    .map((chunk) =>
      chunk
        .slice(1, -1)
        .replace(/\\n/g, ' ')
        .replace(/\\r/g, ' ')
        .replace(/\\t/g, ' ')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\')
    )
    .join(' ')

  if (parenthesisText.trim().length > 80) {
    return truncateText(parenthesisText.replace(/\s+/g, ' ').trim(), 12000)
  }

  const printableChunks = raw.match(/[A-Za-zÀ-ÿ0-9,.;:/\\\-()_'" ]{20,}/g) || []
  const printableText = printableChunks.join(' ').replace(/\s+/g, ' ').trim()
  return truncateText(printableText, 12000)
}

async function buildAttachmentContext(
  documentos: Array<{ file: File; instrucaoUso: string }> = []
): Promise<AttachmentContext> {
  const pdfContext: Array<{ fileName: string; instrucaoUso: string; text: string }> = []
  const images: Array<{ fileName: string; instrucaoUso: string; imageUrl: string }> = []

  for (const documento of documentos) {
    const { file, instrucaoUso } = documento
    const mimeType = (file.type || '').toLowerCase()
    if (mimeType === 'application/pdf') {
      const bytes = new Uint8Array(await readFileAsArrayBuffer(file))
      const text = extractTextFromPdfBytes(bytes)
      if (text) {
        pdfContext.push({
          fileName: file.name,
          instrucaoUso: instrucaoUso || 'Sem instrução adicional',
          text,
        })
      }
      continue
    }

    if (mimeType === 'image/png') {
      const imageDataUrl = await readFileAsDataUrl(file)
      images.push({
        fileName: file.name,
        instrucaoUso: instrucaoUso || 'Sem instrução adicional',
        imageUrl: imageDataUrl,
      })
    }
  }

  return { pdfContext, images }
}

export async function generateTeseWithAI(params: GenerateTeseParams): Promise<{
  titulo: string
  descricao: string
  texto_conteudo: string
  assuntos: string[]
}> {
  const { prompt, processoContent, tesesExistentes, area } = params

  // Construir contexto das teses existentes
  let tesesContext = ''
  if (tesesExistentes && tesesExistentes.length > 0) {
    tesesContext = '\n\nTeses Existentes para Referência:\n'
    tesesExistentes.forEach((tese, index) => {
      tesesContext += `\n${index + 1}. ${tese.titulo}\n`
      if (tese.descricao) {
        tesesContext += `   Descrição: ${tese.descricao}\n`
      }
      if (tese.texto_conteudo) {
        // Extrair texto simples do HTML
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = tese.texto_conteudo
        const textoSimples = tempDiv.textContent || tempDiv.innerText || ''
        tesesContext += `   Conteúdo: ${textoSimples.substring(0, 500)}...\n`
      }
    })
  }

  // Construir prompt completo
  const systemPrompt = `Você é um assistente jurídico especializado em direito brasileiro. 
Sua função é criar teses jurídicas profissionais, bem fundamentadas e estruturadas.

Instruções:
1. Crie uma tese jurídica completa e profissional
2. Use linguagem jurídica adequada
3. Estruture com introdução, desenvolvimento e conclusão
4. Cite fundamentos legais quando relevante
5. Seja objetivo e claro
6. Formate o texto em HTML com tags apropriadas (p, h2, h3, strong, em, ul, ol, li)

${area ? `Área jurídica: ${area}` : ''}
${tesesContext}
${processoContent ? `\nConteúdo do processo fornecido:\n${processoContent.substring(0, 3000)}` : ''}

Agora, crie uma tese jurídica baseada no seguinte prompt do usuário:`

  const userPrompt = prompt

  try {
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
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Erro ao gerar tese com IA')
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    // Extrair título, descrição e conteúdo
    // A IA retornará um JSON ou texto formatado
    // Vamos tentar parsear como JSON primeiro, senão usar o texto completo
    let titulo = 'Tese Gerada por IA'
    let descricao = 'Tese jurídica gerada automaticamente com base no prompt fornecido.'
    let assuntos: string[] = []

    // Tentar extrair informações estruturadas
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1])
        titulo = parsed.titulo || titulo
        descricao = parsed.descricao || descricao
        assuntos = parsed.assuntos || []
      } else {
        // Tentar extrair título do início do texto
        const tituloMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i) || content.match(/^#\s*(.+)$/m)
        if (tituloMatch) {
          titulo = tituloMatch[1].trim()
        }

        // Extrair primeira parte como descrição
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = content
        const textoSimples = tempDiv.textContent || ''
        descricao = textoSimples.substring(0, 200).trim() + '...'
      }
    } catch {
      // Se não conseguir parsear, usar valores padrão
    }

    // Extrair assuntos do prompt se não foram fornecidos
    if (assuntos.length === 0) {
      // Tentar identificar assuntos comuns no texto
      const assuntosComuns = [
        'Contrato',
        'Responsabilidade',
        'Danos',
        'Obrigação',
        'Direito',
        'Processo',
        'Recurso',
        'Apelação',
      ]
      assuntos = assuntosComuns.filter((a) =>
        content.toLowerCase().includes(a.toLowerCase())
      )
    }

    const assuntosFinal = assuntos.length > 0 ? assuntos : ['Jurídico']
    return {
      titulo: formatTituloTese(titulo),
      descricao,
      texto_conteudo: content,
      assuntos: formatAssuntosLista(assuntosFinal),
    }
  } catch (error: any) {
    console.error('Erro ao chamar OpenAI:', error)
    throw new Error(error.message || 'Erro ao gerar tese com IA')
  }
}

// Função para gerar assuntos e descrição com IA baseado no conteúdo
export async function generateAssuntosEDescricao(params: {
  titulo: string
  area: string
  conteudoHTML: string
}): Promise<{
  descricao: string
  assuntos: string[]
}> {
  const { titulo, area, conteudoHTML } = params

  // Extrair texto simples do HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = conteudoHTML
  const textoSimples = tempDiv.textContent || tempDiv.innerText || ''
  const conteudoTexto = textoSimples.substring(0, 4000) // Limitar para não exceder tokens

  const systemPrompt = `Você é um assistente jurídico especializado em direito brasileiro.
Sua função é analisar o conteúdo de uma tese jurídica e gerar:
1. Uma descrição resumida e profissional (máximo 200 caracteres)
2. Uma lista de assuntos jurídicos relevantes (3-5 assuntos, separados por vírgula)

Seja preciso, objetivo e use terminologia jurídica adequada.`

  const userPrompt = `Analise a seguinte tese jurídica e gere uma descrição resumida e assuntos relevantes:

Título: ${titulo}
Área: ${area || 'Não especificada'}

Conteúdo:
${conteudoTexto}

Retorne APENAS um JSON válido no seguinte formato:
{
  "descricao": "descrição resumida da tese (máximo 200 caracteres)",
  "assuntos": ["assunto1", "assunto2", "assunto3"]
}`

  try {
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
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.3, // Menor temperatura para mais precisão
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Erro ao gerar com IA')
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '{}'

    try {
      const parsed = JSON.parse(content)
      const rawAssuntos = Array.isArray(parsed.assuntos)
        ? parsed.assuntos
        : parsed.assuntos
          ? parsed.assuntos.split(',').map((a: string) => a.trim())
          : []
      return {
        descricao: parsed.descricao || 'Tese jurídica sobre ' + titulo,
        assuntos: formatAssuntosLista(rawAssuntos),
      }
    } catch {
      // Fallback se não conseguir parsear JSON
      return {
        descricao: textoSimples.substring(0, 200).trim() + '...',
        assuntos: formatAssuntosLista([]),
      }
    }
  } catch (error: any) {
    console.error('Erro ao chamar OpenAI:', error)
    // Fallback: extrair texto simples
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = conteudoHTML
    const textoSimples = tempDiv.textContent || tempDiv.innerText || ''
    return {
      descricao: textoSimples.substring(0, 200).trim() + '...',
      assuntos: formatAssuntosLista([]),
    }
  }
}

export async function generatePeticaoInicialWithAI(
  params: GeneratePeticaoInicialParams
): Promise<{
  titulo: string
  descricao: string
  texto_conteudo: string
}> {
  const { nomeCliente, fatos, tipoPeticao, parteContraria, documentos = [] } = params
  const attachmentContext = await buildAttachmentContext(documentos)

  const systemPrompt = `Você é um assistente jurídico brasileiro especialista em elaboração de peças processuais cíveis.
Sua tarefa é redigir uma Petição Inicial completa, técnica e estratégica, no estilo de plataformas jurídicas modernas.

Regras obrigatórias:
1. Produza linguagem jurídica formal, clara e objetiva.
2. Estruture em HTML com tags semânticas: h2, h3, p, ul, li, strong.
3. Inclua, na ordem:
   - Endereçamento
   - Qualificação das partes (com placeholders quando faltar dado)
   - Síntese fática
   - Fundamentos jurídicos
   - Pedidos
   - Valor da causa (quando cabível, com observação de cálculo)
   - Requerimentos finais e fechamento
4. Foque especificamente em "Execução de Título Extrajudicial".
5. Não invente jurisprudência ou artigos inexistentes.
6. Quando faltar informação, indique ponto de atenção com redação técnica e não invente dados.
7. Saída final em HTML puro (sem markdown).`

  const contextParts: string[] = [
    `Nome do cliente/exequente: ${nomeCliente}`,
    `Parte contrária/executada: ${parteContraria}`,
    `Tipo de petição: ${tipoPeticao}`,
    `Fatos do caso:\n${fatos}`,
  ]

  if (attachmentContext.pdfContext.length > 0) {
    contextParts.push(
      `Trechos extraídos dos PDFs anexados (usar para fortalecer fundamentação e narrativa):\n${attachmentContext.pdfContext
        .map(
          (pdf) =>
            `Arquivo: ${pdf.fileName}\nComo usar: ${pdf.instrucaoUso}\nConteúdo extraído:\n${pdf.text}`
        )
        .join('\n\n')}`
    )
  }

  if (attachmentContext.images.length > 0) {
    contextParts.push(
      `Instruções de uso das imagens anexadas:\n${attachmentContext.images
        .map(
          (img, idx) =>
            `${idx + 1}. Arquivo: ${img.fileName} | Como usar: ${img.instrucaoUso}`
        )
        .join('\n')}`
    )
  }

  const userContent: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'high' | 'low' | 'auto' } }
  > = [{ type: 'text', text: contextParts.join('\n\n') }]

  attachmentContext.images.forEach((img, index) => {
    userContent.push({
      type: 'image_url',
      image_url: { url: img.imageUrl, detail: index === 0 ? 'high' : 'auto' },
    })
  })

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.4,
      max_tokens: 5000,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Erro ao gerar petição inicial com IA')
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  if (!content.trim()) {
    throw new Error('A IA não retornou conteúdo para a petição inicial.')
  }

  const textoLimpo = htmlToPlainText(content)
  const descricao = truncateText(textoLimpo, 220)
  const titulo = formatTituloTese(
    `Petição Inicial - Execução de Título Extrajudicial - ${nomeCliente}`
  )

  return {
    titulo,
    descricao,
    texto_conteudo: content,
  }
}

// Função para processar arquivo de processo (PDF, Word, etc)
export async function processProcessoFile(file: File): Promise<string> {
  const mimeType = (file.type || '').toLowerCase()

  if (mimeType === 'application/pdf') {
    const bytes = new Uint8Array(await readFileAsArrayBuffer(file))
    return extractTextFromPdfBytes(bytes)
  }

  if (mimeType === 'image/png') {
    return '[Imagem PNG recebida. Use o fluxo multimodal para análise visual.]'
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      resolve(text)
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
