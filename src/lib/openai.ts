// Cliente OpenAI para geração de teses jurídicas
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
        model: 'gpt-4-turbo-preview',
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
    let texto_conteudo = content
    let assuntos: string[] = []

    // Tentar extrair informações estruturadas
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1])
        titulo = parsed.titulo || titulo
        descricao = parsed.descricao || descricao
        texto_conteudo = parsed.texto_conteudo || parsed.conteudo || content
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

    return {
      titulo,
      descricao,
      texto_conteudo: content,
      assuntos: assuntos.length > 0 ? assuntos : ['Jurídico'],
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
        model: 'gpt-4-turbo-preview',
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
      return {
        descricao: parsed.descricao || 'Tese jurídica sobre ' + titulo,
        assuntos: Array.isArray(parsed.assuntos)
          ? parsed.assuntos
          : parsed.assuntos
          ? parsed.assuntos.split(',').map((a: string) => a.trim())
          : [],
      }
    } catch {
      // Fallback se não conseguir parsear JSON
      return {
        descricao: textoSimples.substring(0, 200).trim() + '...',
        assuntos: [],
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
      assuntos: [],
    }
  }
}

// Função para processar arquivo de processo (PDF, Word, etc)
export async function processProcessoFile(file: File): Promise<string> {
  // Por enquanto, suporta apenas texto
  // Para PDF/Word, seria necessário usar bibliotecas específicas
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
