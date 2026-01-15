/**
 * Funções para preservar HTML original com formatação
 */

/**
 * Extrai HTML do editor Tiptap preservando melhor os estilos inline
 * Tenta acessar o DOM renderizado diretamente para manter formatação original
 */
export function extractHTMLFromEditor(editor: any): string {
  if (!editor || !editor.view) {
    return ''
  }

  try {
    // Tentar acessar o DOM renderizado
    const editorElement = editor.view.dom as HTMLElement
    const proseMirror = editorElement.querySelector('.ProseMirror')
    
    if (proseMirror) {
      // Clonar o elemento para não modificar o original
      const clone = proseMirror.cloneNode(true) as HTMLElement
      
      // Remover classes do Tiptap mas manter estilos inline
      removeTiptapClasses(clone)
      
      return clone.innerHTML
    }
  } catch (error) {
    console.warn('Erro ao extrair HTML do DOM, usando getHTML():', error)
  }

  // Fallback: usar getHTML() do Tiptap
  return editor.getHTML()
}

/**
 * Remove classes do Tiptap mas preserva estilos inline e atributos importantes
 */
function removeTiptapClasses(element: HTMLElement): void {
  // Remover classes do Tiptap
  if (element.classList) {
    element.classList.remove('ProseMirror', 'ProseMirror-focused', 'ProseMirror-selectednode')
    
    // Remover outras classes do Tiptap
    Array.from(element.classList).forEach((cls) => {
      if (cls.startsWith('is-') || cls.includes('tiptap')) {
        element.classList.remove(cls)
      }
    })
  }

  // Processar filhos recursivamente
  Array.from(element.children).forEach((child) => {
    removeTiptapClasses(child as HTMLElement)
  })
}

/**
 * Preserva estilos inline ao converter HTML
 * Garante que estilos inline não sejam perdidos
 */
export function preserveInlineStyles(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const body = doc.body

  // Função recursiva para preservar estilos
  function processElement(element: HTMLElement): void {
    // Preservar estilos inline
    const style = element.getAttribute('style')
    if (style) {
      // Garantir que o estilo seja mantido
      element.setAttribute('style', style)
    }

    // Processar filhos
    Array.from(element.children).forEach((child) => {
      processElement(child as HTMLElement)
    })
  }

  // Processar todos os elementos
  Array.from(body.children).forEach((child) => {
    processElement(child as HTMLElement)
  })

  return body.innerHTML
}

/**
 * Compara HTML original com HTML do editor para detectar perda de formatação
 */
export function compareHTML(original: string, edited: string): {
  hasChanges: boolean
  lostStyles: string[]
  isOnlyNormalization: boolean
} {
  const parser = new DOMParser()
  
  const origDoc = parser.parseFromString(original, 'text/html')
  const editDoc = parser.parseFromString(edited, 'text/html')

  const lostStyles: string[] = []

  // Extrair todos os estilos inline do original
  const originalStyles = new Map<string, string>()
  origDoc.body.querySelectorAll('[style]').forEach((el) => {
    const style = el.getAttribute('style') || ''
    if (style.trim()) {
      originalStyles.set(style.trim().toLowerCase(), style)
    }
  })

  // Verificar se estilos foram perdidos
  editDoc.body.querySelectorAll('[style]').forEach((el) => {
    const style = el.getAttribute('style') || ''
    if (style.trim()) {
      const normalizedStyle = style.trim().toLowerCase()
      if (!originalStyles.has(normalizedStyle)) {
        // Verificar se algum estilo similar existe
        let found = false
        originalStyles.forEach((origStyle) => {
          const normalizedOrig = origStyle.trim().toLowerCase()
          // Comparar propriedades CSS individuais
          if (normalizedOrig.includes(normalizedStyle) || normalizedStyle.includes(normalizedOrig)) {
            found = true
          }
        })
        if (!found) {
          lostStyles.push(style)
        }
      }
    }
  })

  // Comparar texto puro (sem tags) para ver se houve mudanças reais
  const origText = (origDoc.body.textContent || '').trim().replace(/\s+/g, ' ')
  const editText = (editDoc.body.textContent || '').trim().replace(/\s+/g, ' ')
  const textChanged = origText !== editText

  // Contar elementos com estilos no original vs editado
  const origStyledElements = origDoc.body.querySelectorAll('[style]').length
  const editStyledElements = editDoc.body.querySelectorAll('[style]').length
  const stylesLost = origStyledElements > editStyledElements

  // Se o texto não mudou e não perdemos muitos estilos, provavelmente é apenas normalização
  // Permitir pequenas diferenças (até 10% de perda de estilos)
  const styleLossRatio = origStyledElements > 0 
    ? (origStyledElements - editStyledElements) / origStyledElements 
    : 0
  const isOnlyNormalization = !textChanged && styleLossRatio < 0.1 && lostStyles.length < 5

  console.log('Comparação HTML:', {
    textChanged,
    origStyledElements,
    editStyledElements,
    styleLossRatio,
    lostStylesCount: lostStyles.length,
    isOnlyNormalization,
  })

  return {
    hasChanges: original !== edited,
    lostStyles,
    isOnlyNormalization,
  }
}

/**
 * Decide se deve usar HTML original ou editado ao salvar
 * Retorna o HTML original se não houve mudanças reais (apenas normalização)
 */
export function decideHTMLToSave(original: string, edited: string): string {
  const comparison = compareHTML(original, edited)
  
  // Se é apenas normalização do Tiptap, manter HTML original
  if (comparison.isOnlyNormalization) {
    console.log('Apenas normalização detectada, mantendo HTML original')
    return original
  }
  
  // Se houve mudanças reais, usar HTML editado
  console.log('Mudanças reais detectadas, salvando HTML editado')
  return edited
}
