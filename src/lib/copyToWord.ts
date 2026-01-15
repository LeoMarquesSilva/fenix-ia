/**
 * Copia HTML para clipboard de forma que o Word reconheça e preserve formatação
 * Usa múltiplas estratégias para garantir compatibilidade máxima
 */

/**
 * Método principal: cria elemento DOM invisível e copia diretamente
 * Esta é a forma mais confiável de copiar HTML preservando formatação para Word
 */
export async function copyHTMLToWordClipboard(html: string): Promise<void> {
  try {
    // Método 1: Tentar criar elemento invisível e copiar (mais confiável)
    await copyViaDOMElement(html)
    return
  } catch (error) {
    console.warn('Método DOM falhou, tentando iframe:', error)
  }

  try {
    // Método 1b: Tentar com iframe (isolamento completo)
    await copyViaIframe(html)
    return
  } catch (error) {
    console.warn('Método iframe falhou, tentando HTML Format:', error)
  }

  try {
    // Método 2: Usar HTML Format com Clipboard API
    await copyViaHTMLFormat(html)
    return
  } catch (error) {
    console.warn('Método HTML Format falhou, tentando fallback:', error)
  }

  // Método 3: Fallback simples
  copyViaSimpleSelection(html)
}

/**
 * Método 1: Copiar via elemento DOM invisível (simula copiar do Word)
 * Este método cria um elemento invisível, renderiza o HTML, e copia a seleção
 * É o método mais confiável porque o navegador trata como se fosse uma cópia normal
 */
async function copyViaDOMElement(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Criar container invisível com estilos que preservam formatação
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '210mm' // Largura A4
    container.style.padding = '2.54cm' // Margem padrão Word
    container.style.backgroundColor = 'white'
    container.style.color = 'black'
    container.style.fontFamily = 'Calibri, Arial, sans-serif'
    container.style.fontSize = '11pt'
    container.style.lineHeight = '1.15'
    container.style.whiteSpace = 'pre-wrap' // Preservar espaços
    container.contentEditable = 'true'
    container.setAttribute('spellcheck', 'false')
    
    // Inserir HTML
    container.innerHTML = html

    // Adicionar ao DOM
    document.body.appendChild(container)

    // Aguardar múltiplos frames para garantir renderização completa
    // Isso é importante para imagens e estilos complexos
    let framesWaited = 0
    const maxFrames = 3
    
    const waitAndCopy = () => {
      requestAnimationFrame(() => {
        framesWaited++
        if (framesWaited < maxFrames) {
          waitAndCopy()
          return
        }

        try {
          // Focar no container primeiro
          container.focus()
          
          // Selecionar todo o conteúdo
          const range = document.createRange()
          range.selectNodeContents(container)
          const selection = window.getSelection()
          
          if (!selection) {
            throw new Error('Selection não disponível')
          }

          selection.removeAllRanges()
          selection.addRange(range)

          // Pequeno delay antes de copiar (garante que seleção está ativa)
          setTimeout(() => {
            try {
              // Copiar usando execCommand (preserva formatação melhor)
              const success = document.execCommand('copy')
              
              // Limpar seleção
              selection.removeAllRanges()
              document.body.removeChild(container)

              if (success) {
                resolve()
              } else {
                reject(new Error('execCommand copy retornou false'))
              }
            } catch (copyError) {
              // Limpar em caso de erro
              selection.removeAllRanges()
              document.body.removeChild(container)
              reject(copyError)
            }
          }, 10)
        } catch (error) {
          // Limpar em caso de erro
          try {
            const selection = window.getSelection()
            selection?.removeAllRanges()
            document.body.removeChild(container)
          } catch {}
          reject(error)
        }
      })
    }

    waitAndCopy()
  })
}

/**
 * Método 1b: Copiar via iframe (isolamento completo do conteúdo)
 * Pode funcionar melhor em alguns navegadores
 */
async function copyViaIframe(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-9999px'
    iframe.style.top = '0'
    iframe.style.width = '210mm'
    iframe.style.height = '297mm'
    iframe.style.border = 'none'
    
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      document.body.removeChild(iframe)
      reject(new Error('Não foi possível acessar iframe document'))
      return
    }

    // Escrever HTML no iframe
    iframeDoc.open()
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Calibri, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.15;
            padding: 2.54cm;
            margin: 0;
            background: white;
            color: black;
          }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `)
    iframeDoc.close()

    // Aguardar renderização
    iframe.onload = () => {
      setTimeout(() => {
        try {
          const iframeBody = iframeDoc.body
          const range = iframeDoc.createRange()
          range.selectNodeContents(iframeBody)
          
          const selection = iframe.contentWindow?.getSelection() || iframeDoc.getSelection()
          if (!selection) {
            throw new Error('Selection não disponível no iframe')
          }

          selection.removeAllRanges()
          selection.addRange(range)

          // Copiar
          const success = iframeDoc.execCommand('copy')
          
          // Limpar
          selection.removeAllRanges()
          document.body.removeChild(iframe)

          if (success) {
            resolve()
          } else {
            reject(new Error('execCommand copy retornou false no iframe'))
          }
        } catch (error) {
          document.body.removeChild(iframe)
          reject(error)
        }
      }, 100)
    }

    // Timeout de segurança
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
        reject(new Error('Timeout ao copiar via iframe'))
      }
    }, 5000)
  })
}

/**
 * Método 2: Usar formato HTML Format com Clipboard API
 * Cria o formato HTML Format que o Word reconhece
 */
async function copyViaHTMLFormat(html: string): Promise<void> {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Clipboard API não disponível')
  }

  // Criar HTML Format correto
  const htmlFormat = createHTMLFormat(html)
  const plainText = extractPlainText(html)

  // Criar blobs
  const htmlBlob = new Blob([htmlFormat], { type: 'text/html' })
  const textBlob = new Blob([plainText], { type: 'text/plain' })

  // Criar ClipboardItem
  const clipboardItem = new ClipboardItem({
    'text/html': htmlBlob,
    'text/plain': textBlob,
  })

  await navigator.clipboard.write([clipboardItem])
}

/**
 * Cria HTML Format no padrão Microsoft
 * Baseado na especificação: https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa767917(v=vs.85)
 */
function createHTMLFormat(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const bodyContent = doc.body.innerHTML || html

  // Criar HTML completo
  const fullHTML = `<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body>
<!--StartFragment-->${bodyContent}<!--EndFragment-->
</body>
</html>`

  // Calcular posições (em bytes, considerando \r\n)
  const version = 'Version:0.9\r\n'
  const startHTML = 'StartHTML:'
  const endHTML = 'EndHTML:'
  const startFragment = 'StartFragment:'
  const endFragment = 'EndFragment:'

  // Calcular tamanho do header
  let headerSize = version.length
  headerSize += startHTML.length + 10 + 2 // +10 para número, +2 para \r\n
  headerSize += endHTML.length + 10 + 2
  headerSize += startFragment.length + 10 + 2
  headerSize += endFragment.length + 10 + 2

  const startHTMLPos = headerSize
  const htmlStart = startHTMLPos
  const fragmentStart = htmlStart + fullHTML.indexOf('<!--StartFragment-->')
  const fragmentEnd = fragmentStart + bodyContent.length
  const htmlEnd = htmlStart + fullHTML.length

  // Criar HTML Format
  const htmlFormat = `${version}${startHTML}${String(startHTMLPos).padStart(10, '0')}\r\n${endHTML}${String(htmlEnd).padStart(10, '0')}\r\n${startFragment}${String(fragmentStart).padStart(10, '0')}\r\n${endFragment}${String(fragmentEnd).padStart(10, '0')}\r\n${fullHTML}`

  return htmlFormat
}

/**
 * Método 3: Fallback simples - copiar texto selecionado
 */
function copyViaSimpleSelection(html: string): void {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const bodyContent = doc.body.innerHTML || html

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = bodyContent
  tempDiv.style.position = 'fixed'
  tempDiv.style.left = '-9999px'
  tempDiv.style.top = '0'
  tempDiv.contentEditable = 'true'

  document.body.appendChild(tempDiv)
  tempDiv.focus()

  const range = document.createRange()
  range.selectNodeContents(tempDiv)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)

  document.execCommand('copy')

  selection?.removeAllRanges()
  document.body.removeChild(tempDiv)
}

/**
 * Extrai texto simples do HTML
 */
function extractPlainText(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return doc.body.textContent || doc.body.innerText || ''
}

/**
 * Método alternativo exportado para uso direto
 */
export function copyHTMLToWordAlternative(html: string): Promise<void> {
  return copyViaDOMElement(html)
}
