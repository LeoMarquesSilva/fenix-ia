import { Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

interface TextRunData {
  text: string
  bold?: boolean
  italics?: boolean
  underline?: boolean
  color?: string
  highlight?: string
  size?: number // Tamanho da fonte em half-points (ex: 24 = 12pt)
}

interface ParagraphData {
  alignment?: 'left' | 'center' | 'right' | 'justify'
  spacingBefore?: number // Em twips (1/20th of a point)
  spacingAfter?: number
  spacingLine?: number // Line height (240 = single, 480 = double)
  indentLeft?: number
  indentRight?: number
  indentFirstLine?: number // Recuo da primeira linha (text-indent)
}

/**
 * Converte HTML para elementos do docx preservando formatação
 */
export function htmlToDocxElements(html: string): Paragraph[] {
  // Log para debug
  console.log('Convertendo HTML para DOCX. HTML recebido:', html.substring(0, 500) + '...')
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const body = doc.body

  const elements: Paragraph[] = []
  
  // Log da estrutura HTML parseada
  console.log('Estrutura HTML parseada:', body.innerHTML.substring(0, 500) + '...')

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent
      // Não processar texto solto diretamente - ele será capturado pelos elementos pais
      // Mas se houver texto significativo, criar um parágrafo
      if (text && text.trim().length > 0) {
        // Texto solto no body - criar parágrafo
        elements.push(
          new Paragraph({
            children: [new TextRun({ text: text.trim() })],
            spacing: { after: 120 },
          })
        )
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const element = node as HTMLElement
    const tagName = element.tagName.toLowerCase()

    switch (tagName) {
      case 'h1': {
        const h1Data = extractTextRunData(element)
        const h1Props = extractParagraphProps(element)
        const boldChildren = h1Data.length > 0
          ? h1Data.map((data) =>
              new TextRun({
                text: data.text,
                bold: true,
                size: data.size || 32,
                italics: data.italics,
                underline: data.underline ? {} : undefined,
                color: data.color,
                highlight: data.highlight,
              })
            )
          : [new TextRun({ text: element.textContent || '', bold: true, size: 32 })]
        elements.push(
          new Paragraph({
            children: boldChildren,
            heading: HeadingLevel.HEADING_1,
            alignment: h1Props.alignment ? getAlignmentType(h1Props.alignment) : undefined,
            spacing: {
              before: h1Props.spacingBefore,
              after: h1Props.spacingAfter || 200,
              line: h1Props.spacingLine,
            },
            indent: {
              left: h1Props.indentLeft,
              right: h1Props.indentRight,
              firstLine: h1Props.indentFirstLine,
            },
          })
        )
        break
      }

      case 'h2': {
        const h2Data = extractTextRunData(element)
        const h2Props = extractParagraphProps(element)
        const boldChildren = h2Data.length > 0
          ? h2Data.map((data) =>
              new TextRun({
                text: data.text,
                bold: true,
                size: data.size || 28,
                italics: data.italics,
                underline: data.underline ? {} : undefined,
                color: data.color,
                highlight: data.highlight,
              })
            )
          : [new TextRun({ text: element.textContent || '', bold: true, size: 28 })]
        elements.push(
          new Paragraph({
            children: boldChildren,
            heading: HeadingLevel.HEADING_2,
            alignment: h2Props.alignment ? getAlignmentType(h2Props.alignment) : undefined,
            spacing: {
              before: h2Props.spacingBefore,
              after: h2Props.spacingAfter || 180,
              line: h2Props.spacingLine,
            },
            indent: {
              left: h2Props.indentLeft,
              right: h2Props.indentRight,
              firstLine: h2Props.indentFirstLine,
            },
          })
        )
        break
      }

      case 'h3': {
        const h3Data = extractTextRunData(element)
        const h3Props = extractParagraphProps(element)
        const boldChildren = h3Data.length > 0
          ? h3Data.map((data) =>
              new TextRun({
                text: data.text,
                bold: true,
                size: data.size || 24,
                italics: data.italics,
                underline: data.underline ? {} : undefined,
                color: data.color,
                highlight: data.highlight,
              })
            )
          : [new TextRun({ text: element.textContent || '', bold: true, size: 24 })]
        elements.push(
          new Paragraph({
            children: boldChildren,
            heading: HeadingLevel.HEADING_3,
            alignment: h3Props.alignment ? getAlignmentType(h3Props.alignment) : undefined,
            spacing: {
              before: h3Props.spacingBefore,
              after: h3Props.spacingAfter || 160,
              line: h3Props.spacingLine,
            },
            indent: {
              left: h3Props.indentLeft,
              right: h3Props.indentRight,
              firstLine: h3Props.indentFirstLine,
            },
          })
        )
        break
      }

      case 'h4': {
        const h4Data = extractTextRunData(element)
        const h4Props = extractParagraphProps(element)
        const boldChildren = h4Data.length > 0
          ? h4Data.map((data) =>
              new TextRun({
                text: data.text,
                bold: true,
                size: data.size || 22,
                italics: data.italics,
                underline: data.underline ? {} : undefined,
                color: data.color,
                highlight: data.highlight,
              })
            )
          : [new TextRun({ text: element.textContent || '', bold: true, size: 22 })]
        elements.push(
          new Paragraph({
            children: boldChildren,
            heading: HeadingLevel.HEADING_4,
            alignment: h4Props.alignment ? getAlignmentType(h4Props.alignment) : undefined,
            spacing: {
              before: h4Props.spacingBefore,
              after: h4Props.spacingAfter || 140,
              line: h4Props.spacingLine,
            },
            indent: {
              left: h4Props.indentLeft,
              right: h4Props.indentRight,
              firstLine: h4Props.indentFirstLine,
            },
          })
        )
        break
      }

      case 'p': {
        const pData = extractTextRunData(element)
        const pProps = extractParagraphProps(element)
        
        if (pData.length > 0) {
          const pChildren = pData.map((data) =>
            new TextRun({
              text: data.text,
              bold: data.bold,
              italics: data.italics,
              underline: data.underline ? {} : undefined,
              color: data.color,
              highlight: data.highlight,
              size: data.size,
            })
          )
          elements.push(
            new Paragraph({
              children: pChildren,
              alignment: pProps.alignment ? getAlignmentType(pProps.alignment) : undefined,
              spacing: {
                before: pProps.spacingBefore,
                after: pProps.spacingAfter || 120,
                line: pProps.spacingLine,
              },
              indent: {
                left: pProps.indentLeft,
                right: pProps.indentRight,
              },
            })
          )
        } else {
          // Parágrafo vazio
          elements.push(
            new Paragraph({
              children: [new TextRun({ text: '' })],
              alignment: pProps.alignment ? getAlignmentType(pProps.alignment) : undefined,
              spacing: {
                before: pProps.spacingBefore,
                after: pProps.spacingAfter || 120,
                line: pProps.spacingLine,
              },
              indent: {
                left: pProps.indentLeft,
                right: pProps.indentRight,
                firstLine: pProps.indentFirstLine,
                hanging: pProps.indentFirstLine && pProps.indentFirstLine < 0 ? Math.abs(pProps.indentFirstLine) : undefined,
              },
            })
          )
        }
        break
      }

      case 'ul':
      case 'ol': {
        const listItems = Array.from(element.querySelectorAll('li'))
        listItems.forEach((li, index) => {
          const liData = extractTextRunData(li)
          const bullet = tagName === 'ul' ? '•' : `${index + 1}.`
          if (liData.length > 0) {
            const liChildren = liData.map((data) =>
              new TextRun({
                text: data.text,
                bold: data.bold,
                italics: data.italics,
                underline: data.underline ? {} : undefined,
                color: data.color,
                highlight: data.highlight,
              })
            )
            elements.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${bullet} `, bold: true }),
                  ...liChildren,
                ],
                spacing: { after: 100 },
                indent: { left: 400 },
              })
            )
          } else {
            // Item de lista vazio
            elements.push(
              new Paragraph({
                children: [new TextRun({ text: `${bullet} `, bold: true })],
                spacing: { after: 100 },
                indent: { left: 400 },
              })
            )
          }
        })
        break
      }

      case 'li':
        // Já processado no ul/ol
        break

      case 'br':
        elements.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
          })
        )
        break

      case 'blockquote': {
        // Blockquote como parágrafo com indentação
        const blockquoteData = extractTextRunData(element)
        const blockquoteProps = extractParagraphProps(element)
        if (blockquoteData.length > 0) {
          const blockquoteChildren = blockquoteData.map((data) =>
            new TextRun({
              text: data.text,
              bold: data.bold,
              italics: data.italics,
              underline: data.underline ? {} : undefined,
              color: data.color,
              highlight: data.highlight,
              size: data.size,
            })
          )
          elements.push(
            new Paragraph({
              children: blockquoteChildren,
              alignment: blockquoteProps.alignment ? getAlignmentType(blockquoteProps.alignment) : undefined,
              spacing: {
                before: blockquoteProps.spacingBefore,
                after: blockquoteProps.spacingAfter || 120,
                line: blockquoteProps.spacingLine,
              },
              indent: {
                left: blockquoteProps.indentLeft || 720, // Indentação padrão para blockquote
                right: blockquoteProps.indentRight,
                firstLine: blockquoteProps.indentFirstLine,
                hanging: blockquoteProps.indentFirstLine && blockquoteProps.indentFirstLine < 0 ? Math.abs(blockquoteProps.indentFirstLine) : undefined,
              },
            })
          )
        } else {
          Array.from(element.childNodes).forEach(processNode)
        }
        break
      }

      case 'div': {
        // Div pode conter parágrafos ou ser um parágrafo disfarçado
        const divProps = extractParagraphProps(element)
        const divChildren = extractTextRunData(element)
        
        // Se tem formatação de parágrafo ou filhos são elementos de bloco, processar filhos
        if (divProps.alignment || divProps.spacingBefore || divProps.spacingAfter || 
            Array.from(element.children).some(child => ['P', 'H1', 'H2', 'H3', 'H4', 'UL', 'OL', 'DIV'].includes(child.tagName))) {
          Array.from(element.childNodes).forEach(processNode)
        } else if (divChildren.length > 0) {
          // Tratar como parágrafo
          const pChildren = divChildren.map((data) =>
            new TextRun({
              text: data.text,
              bold: data.bold,
              italics: data.italics,
              underline: data.underline ? {} : undefined,
              color: data.color,
              highlight: data.highlight,
              size: data.size,
            })
          )
          elements.push(
            new Paragraph({
              children: pChildren,
              alignment: divProps.alignment ? getAlignmentType(divProps.alignment) : undefined,
              spacing: {
                before: divProps.spacingBefore,
                after: divProps.spacingAfter || 120,
                line: divProps.spacingLine,
              },
              indent: {
                left: divProps.indentLeft,
                right: divProps.indentRight,
                firstLine: divProps.indentFirstLine,
                hanging: divProps.indentFirstLine && divProps.indentFirstLine < 0 ? Math.abs(divProps.indentFirstLine) : undefined,
              },
            })
          )
        } else {
          // Processar filhos normalmente
          Array.from(element.childNodes).forEach(processNode)
        }
        break
      }

      case 'span': {
        // Span é inline, não cria parágrafo, mas precisa processar filhos
        // Isso será tratado no extractTextRunData
        Array.from(element.childNodes).forEach(processNode)
        break
      }

      default:
        // Para outros elementos, processar filhos
        if (element.childNodes.length > 0) {
          Array.from(element.childNodes).forEach(processNode)
        } else {
          // Elemento vazio, adicionar como parágrafo
          const text = element.textContent?.trim()
          if (text) {
            const defaultProps = extractParagraphProps(element)
            elements.push(
              new Paragraph({
                children: [new TextRun({ text })],
                alignment: defaultProps.alignment ? getAlignmentType(defaultProps.alignment) : undefined,
                spacing: {
                  before: defaultProps.spacingBefore,
                  after: defaultProps.spacingAfter || 120,
                  line: defaultProps.spacingLine,
                },
                indent: {
                  left: defaultProps.indentLeft,
                  right: defaultProps.indentRight,
                  firstLine: defaultProps.indentFirstLine,
                  hanging: defaultProps.indentFirstLine && defaultProps.indentFirstLine < 0 ? Math.abs(defaultProps.indentFirstLine) : undefined,
                },
              })
            )
          }
        }
        break
    }
  }

  // Processar todos os nós do body
  Array.from(body.childNodes).forEach(processNode)

  // Se não gerou nenhum elemento, criar um parágrafo com o texto
  if (elements.length === 0) {
    const textContent = body.textContent?.trim()
    if (textContent) {
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: textContent })],
        })
      )
    }
  }

  return elements
}

/**
 * Extrai dados de TextRuns de um elemento HTML preservando formatação inline
 */
function extractTextRunData(element: HTMLElement): TextRunData[] {
  const runs: TextRunData[] = []

  function processNode(node: Node, inheritedStyles: {
    bold?: boolean
    italics?: boolean
    underline?: boolean
    color?: string
    highlight?: string
    size?: number
  } = {}): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent
      if (text) {
        runs.push({
          text: text,
          bold: inheritedStyles.bold,
          italics: inheritedStyles.italics,
          underline: inheritedStyles.underline,
          color: inheritedStyles.color,
          highlight: inheritedStyles.highlight,
          size: inheritedStyles.size,
        })
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    const styles = { ...inheritedStyles }

    // Aplicar estilos do elemento atual
    if (tag === 'strong' || tag === 'b') {
      styles.bold = true
    } else if (tag === 'em' || tag === 'i') {
      styles.italics = true
    } else if (tag === 'u') {
      styles.underline = true
    } else if (tag === 'a') {
      styles.color = '0563C1'
      styles.underline = true
    } else if (tag === 'mark' || tag === 'highlight') {
      styles.highlight = 'FFFF00' // Amarelo padrão para highlight
    }

    // Verificar estilos inline (CRÍTICO: Tiptap usa muito style inline)
    const inlineStyle = el.getAttribute('style')
    if (inlineStyle) {
      const styleObj = parseInlineStyle(inlineStyle)
      
      // Negrito
      if (styleObj.fontWeight) {
        const weight = styleObj.fontWeight.toLowerCase()
        if (weight === 'bold' || weight === '700' || weight === 'bolder' || 
            parseInt(weight) >= 600 || weight === '700') {
          styles.bold = true
        } else if (weight === 'normal' || weight === '400' || parseInt(weight) < 600) {
          styles.bold = false
        }
      }
      
      // Itálico
      if (styleObj.fontStyle) {
        if (styleObj.fontStyle.toLowerCase() === 'italic' || styleObj.fontStyle.toLowerCase() === 'oblique') {
          styles.italics = true
        } else {
          styles.italics = false
        }
      }
      
      // Sublinhado
      if (styleObj.textDecoration) {
        const decoration = styleObj.textDecoration.toLowerCase()
        if (decoration.includes('underline')) {
          styles.underline = true
        }
        if (decoration.includes('none') && !decoration.includes('underline')) {
          styles.underline = false
        }
      }
      
      // Cor do texto
      if (styleObj.color) {
        const color = convertColorToHex(styleObj.color)
        if (color) {
          styles.color = color
        }
      }
      
      // Cor de fundo (highlight)
      if (styleObj.backgroundColor || styleObj['background-color']) {
        const bgColor = convertColorToHex(styleObj.backgroundColor || styleObj['background-color'])
        if (bgColor) {
          styles.highlight = bgColor
        }
      }
      
      // Tamanho da fonte
      if (styleObj.fontSize || styleObj['font-size']) {
        const fontSize = styleObj.fontSize || styleObj['font-size']
        const size = parseFontSize(fontSize)
        if (size) {
          styles.size = size
        }
      }
    }
    
    // Verificar atributos de data do Tiptap (ex: data-color, data-background)
    const dataColor = el.getAttribute('data-color')
    if (dataColor) {
      const color = convertColorToHex(dataColor)
      if (color) {
        styles.color = color
      }
    }
    
    const dataBackground = el.getAttribute('data-background')
    if (dataBackground) {
      const bgColor = convertColorToHex(dataBackground)
      if (bgColor) {
        styles.highlight = bgColor
      }
    }
    
    // Verificar classes CSS que podem indicar formatação (mammoth pode usar classes)
    const className = el.getAttribute('class')
    if (className && className.trim()) {
      // Se tiver classe que indica negrito
      if (className.includes('bold') || className.includes('strong') || className.includes('b')) {
        styles.bold = true
      }
      // Se tiver classe que indica itálico
      if (className.includes('italic') || className.includes('em') || className.includes('i')) {
        styles.italics = true
      }
      // Se tiver classe que indica sublinhado
      if (className.includes('underline') || className.includes('u')) {
        styles.underline = true
      }
    }

    // Processar filhos recursivamente
    Array.from(el.childNodes).forEach((child) => processNode(child, styles))
  }

  // Processar todos os nós do elemento
  Array.from(element.childNodes).forEach((node) => processNode(node))

  return runs
}

/**
 * Extrai propriedades de parágrafo do elemento HTML
 */
function extractParagraphProps(element: HTMLElement): ParagraphData {
  const props: ParagraphData = {}
  const style = element.getAttribute('style')
  
  // Log para debug de formatação
  if (style && (style.includes('font') || style.includes('margin') || style.includes('padding'))) {
    console.log('Elemento com formatação detectada:', element.tagName, style)
  }
  
  if (style) {
    const styleObj = parseInlineStyle(style)
    
    // Alinhamento (verificar textAlign e text-align)
    const textAlign = styleObj.textAlign || styleObj['text-align']
    if (textAlign) {
      const align = textAlign.toLowerCase().trim()
      if (align === 'justify' || align === 'justified') {
        props.alignment = 'justify'
      } else if (align === 'center' || align === 'centre') {
        props.alignment = 'center'
      } else if (align === 'right') {
        props.alignment = 'right'
      } else {
        props.alignment = 'left'
      }
    }
    
    // Espaçamento antes (margin-top ou padding-top)
    if (styleObj.marginTop) {
      props.spacingBefore = parseSizeToTwips(styleObj.marginTop)
    } else if (styleObj.paddingTop) {
      props.spacingBefore = parseSizeToTwips(styleObj.paddingTop)
    }
    
    // Espaçamento depois (margin-bottom ou padding-bottom)
    if (styleObj.marginBottom) {
      props.spacingAfter = parseSizeToTwips(styleObj.marginBottom)
    } else if (styleObj.paddingBottom) {
      props.spacingAfter = parseSizeToTwips(styleObj.paddingBottom)
    }
    
    // Altura da linha (line-height)
    if (styleObj.lineHeight) {
      props.spacingLine = parseLineHeight(styleObj.lineHeight)
    }
    
    // Indentação esquerda (margin-left ou padding-left)
    if (styleObj.marginLeft || styleObj['margin-left']) {
      props.indentLeft = parseSizeToTwips(styleObj.marginLeft || styleObj['margin-left'] || '0')
    } else if (styleObj.paddingLeft || styleObj['padding-left']) {
      props.indentLeft = parseSizeToTwips(styleObj.paddingLeft || styleObj['padding-left'] || '0')
    }
    
    // Indentação direita (margin-right ou padding-right)
    if (styleObj.marginRight || styleObj['margin-right']) {
      props.indentRight = parseSizeToTwips(styleObj.marginRight || styleObj['margin-right'] || '0')
    } else if (styleObj.paddingRight || styleObj['padding-right']) {
      props.indentRight = parseSizeToTwips(styleObj.paddingRight || styleObj['padding-right'] || '0')
    }
    
    // Recuo da primeira linha (text-indent) - CRÍTICO para preservar recuos
    if (styleObj.textIndent || styleObj['text-indent']) {
      const textIndent = styleObj.textIndent || styleObj['text-indent']
      props.indentFirstLine = parseSizeToTwips(textIndent)
      // Se text-indent for positivo, adicionar ao indentLeft
      if (props.indentFirstLine > 0 && !props.indentLeft) {
        props.indentLeft = props.indentFirstLine
      }
    }
  }
  
  // Verificar também atributos de classe ou estilo computado (apenas se elemento estiver no DOM)
  try {
    if (typeof window !== 'undefined' && window.getComputedStyle && element.ownerDocument?.defaultView) {
      const computedStyle = window.getComputedStyle(element)
      if (computedStyle) {
        if (!props.alignment && computedStyle.textAlign && computedStyle.textAlign !== 'start') {
          const align = computedStyle.textAlign.toLowerCase().trim()
          if (align === 'justify' || align === 'justified') {
            props.alignment = 'justify'
          } else if (align === 'center' || align === 'centre') {
            props.alignment = 'center'
          } else if (align === 'right') {
            props.alignment = 'right'
          } else {
            props.alignment = 'left'
          }
        }
        if (!props.spacingBefore && computedStyle.marginTop && computedStyle.marginTop !== '0px') {
          props.spacingBefore = parseSizeToTwips(computedStyle.marginTop)
        }
        if (!props.spacingAfter && computedStyle.marginBottom && computedStyle.marginBottom !== '0px') {
          props.spacingAfter = parseSizeToTwips(computedStyle.marginBottom)
        }
        if (!props.spacingLine && computedStyle.lineHeight && computedStyle.lineHeight !== 'normal') {
          props.spacingLine = parseLineHeight(computedStyle.lineHeight)
        }
      }
    }
  } catch (e) {
    // Ignorar erros de computed style (elemento pode não estar no DOM)
    console.warn('Erro ao obter computed style:', e)
  }
  
  return props
}

/**
 * Converte string de alinhamento para AlignmentType do docx
 */
function getAlignmentType(align: string): (typeof AlignmentType)[keyof typeof AlignmentType] {
  const alignLower = align.toLowerCase().trim()
  switch (alignLower) {
    case 'center':
    case 'centre':
      return AlignmentType.CENTER
    case 'right':
      return AlignmentType.RIGHT
    case 'justify':
    case 'justified':
      return AlignmentType.JUSTIFIED
    case 'left':
    default:
      return AlignmentType.LEFT
  }
}

/**
 * Converte tamanho CSS (px, pt, em, rem) para twips (1/20th of a point)
 * 1pt = 20 twips, 1px ≈ 0.75pt ≈ 15 twips
 */
function parseSizeToTwips(size: string): number {
  if (!size) return 0
  
  const num = parseFloat(size)
  if (isNaN(num)) return 0
  
  // Converter para pontos primeiro
  let points = num
  
  if (size.includes('px')) {
    points = num * 0.75 // 1px ≈ 0.75pt
  } else if (size.includes('em') || size.includes('rem')) {
    points = num * 12 // Assumindo 12pt como base
  } else if (size.includes('pt')) {
    points = num
  } else {
    // Assumir pixels se não especificado
    points = num * 0.75
  }
  
  // Converter pontos para twips (1pt = 20 twips)
  return Math.round(points * 20)
}

/**
 * Converte tamanho de fonte CSS para half-points do docx
 */
function parseFontSize(fontSize: string): number {
  if (!fontSize) return undefined as any
  
  const num = parseFloat(fontSize)
  if (isNaN(num)) return undefined as any
  
  let points = num
  
  if (fontSize.includes('px')) {
    points = num * 0.75 // 1px ≈ 0.75pt
  } else if (fontSize.includes('em') || fontSize.includes('rem')) {
    points = num * 12 // Assumindo 12pt como base
  } else if (fontSize.includes('pt')) {
    points = num
  } else {
    // Assumir pixels se não especificado
    points = num * 0.75
  }
  
  // Converter pontos para half-points (1pt = 2 half-points)
  return Math.round(points * 2)
}

/**
 * Converte line-height para formato docx (240 = single, 480 = double)
 */
function parseLineHeight(lineHeight: string): number {
  if (!lineHeight) return undefined as any
  
  // Se for um número simples (ex: 1.5, 2)
  const num = parseFloat(lineHeight)
  if (!isNaN(num)) {
    return Math.round(num * 240) // 240 = single line
  }
  
  // Se for em pixels ou pontos, converter
  if (lineHeight.includes('px') || lineHeight.includes('pt')) {
    const size = parseSizeToTwips(lineHeight)
    // Converter twips para formato de line-height (aproximação)
    return Math.round(size / 12) * 240
  }
  
  return undefined as any
}

/**
 * Converte cor CSS (hex, rgb, rgba, nome) para formato docx (hex sem #)
 */
function convertColorToHex(color: string): string | undefined {
  if (!color) return undefined
  
  color = color.trim()
  
  // Já é hex
  if (color.startsWith('#')) {
    const hex = color.substring(1).toUpperCase()
    if (hex.length === 6) {
      return hex
    } else if (hex.length === 3) {
      // Expandir #RGB para #RRGGBB
      return hex.split('').map(c => c + c).join('')
    }
  }
  
  // RGB ou RGBA
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0')
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0')
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0')
    return (r + g + b).toUpperCase()
  }
  
  // Nomes de cores comuns
  const colorNames: Record<string, string> = {
    'black': '000000',
    'white': 'FFFFFF',
    'red': 'FF0000',
    'green': '008000',
    'blue': '0000FF',
    'yellow': 'FFFF00',
    'cyan': '00FFFF',
    'magenta': 'FF00FF',
    'gray': '808080',
    'grey': '808080',
    'orange': 'FFA500',
    'purple': '800080',
    'pink': 'FFC0CB',
    'brown': 'A52A2A',
  }
  
  const lowerColor = color.toLowerCase()
  if (colorNames[lowerColor]) {
    return colorNames[lowerColor]
  }
  
  // Tentar como hex sem #
  if (/^[0-9A-Fa-f]{6}$/.test(color)) {
    return color.toUpperCase()
  }
  
  return undefined
}

/**
 * Parse inline style string para objeto (melhorado)
 */
function parseInlineStyle(style: string): Record<string, string> {
  const result: Record<string, string> = {}
  if (!style) return result
  
  // Dividir por ponto e vírgula, mas preservar valores com ponto e vírgula
  const declarations = style.split(';')
  declarations.forEach((decl) => {
    const colonIndex = decl.indexOf(':')
    if (colonIndex > 0) {
      const property = decl.substring(0, colonIndex).trim()
      const value = decl.substring(colonIndex + 1).trim()
      if (property && value) {
        // Normalizar nome da propriedade (remover hífens e converter para camelCase)
        const normalizedProp = property.toLowerCase().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
        result[normalizedProp] = value
        // Também manter o original para compatibilidade
        result[property] = value
      }
    }
  })
  return result
}

/**
 * Função auxiliar para converter cor hexadecimal para formato docx
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '000000'
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
