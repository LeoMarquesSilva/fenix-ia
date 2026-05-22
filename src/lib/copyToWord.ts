/**
 * Copia HTML para clipboard para colar no Word com formatação correta.
 *
 * ORDEM DE TENTATIVAS:
 * 1. Clipboard API  — envia HTML puro sem renderizar no DOM, evita herdar CSS global
 * 2. iframe         — documento isolado, sem herdar CSS global (border-border, etc.)
 * 3. execCommand    — fallback, pode herdar CSS global; aceitável como último recurso
 *
 * NÃO use execCommand no DOM principal como primeira tentativa: o CSS global
 * "* { @apply border-border }" do Tailwind aplica border-color a todos os elementos,
 * e o browser serializa isso como estilo inline ao copiar, fazendo o Word adicionar
 * bordas em todos os parágrafos (pBdr com cor E2E8F0).
 */

/**
 * Estilos base para peças jurídicas: Times New Roman 12 pt.
 * Não forçamos font-family nos elementos individuais — eles herdam daqui.
 */
const WRAPPER_STYLE =
  "font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: normal; color: #000000; line-height: 1.5;"

/**
 * Propriedades CSS que NÃO devem ir para o Word:
 * - border/outline/box-shadow → Word converte em pBdr (borda de parágrafo)
 * - font-family/font-size inline → sobrescrevem o wrapper, podem trazer Calibri/11pt
 * - background-color → não faz sentido em documento jurídico
 */
const STRIP_CSS_PROP =
  /^(-(webkit|moz|ms|o)-)?((border|outline|box-shadow|background|font-family|font-size))/i

function sanitizeInlineStyle(style: string): string {
  if (!style.trim()) return ''
  return style
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((decl) => {
      const prop = decl.split(':')[0]?.trim() || ''
      return !STRIP_CSS_PROP.test(prop)
    })
    .join('; ')
}

/** Classes Tailwind que causam bordas/sombras no Word. */
const STRIP_CLASS_PREFIXES = [
  'border', 'ring', 'divide', 'outline', 'shadow', 'rounded', 'bg-', 'p-', 'px-', 'py-',
]

function sanitizeClasses(el: HTMLElement): void {
  for (const c of [...el.classList]) {
    if (STRIP_CLASS_PREFIXES.some((pfx) => c === pfx || c.startsWith(pfx))) {
      el.classList.remove(c)
    }
  }
}

function sanitizeDomForWord(root: HTMLElement): void {
  const style = root.getAttribute('style')
  if (style) {
    const cleaned = sanitizeInlineStyle(style)
    if (cleaned) root.setAttribute('style', cleaned)
    else root.removeAttribute('style')
  }
  sanitizeClasses(root)
  for (const child of root.children) {
    sanitizeDomForWord(child as HTMLElement)
  }
}

/**
 * Prepara HTML para colagem no Word:
 * - Remove classes/estilos incompatíveis (bordas, fontes inline, backgrounds)
 * - Mantém negrito/itálico/sublinhado estrutural
 * - Envolve em div com TNR 12pt
 */
export function prepareHtmlForWordClipboard(html: string): string {
  const trimmed = html?.trim() || ''
  if (!trimmed) return ''

  const parser = new DOMParser()
  const doc = parser.parseFromString(trimmed, 'text/html')
  const body = doc.body

  function stripWeightClasses(el: HTMLElement): void {
    el.classList.remove('prose', 'prose-invert', 'dark:prose-invert')
    for (const c of [...el.classList]) {
      if (
        c.includes('font-bold') ||
        c.includes('font-semibold') ||
        c.includes('font-black') ||
        c === 'font-medium'
      ) {
        el.classList.remove(c)
      }
    }
    for (const child of el.children) {
      stripWeightClasses(child as HTMLElement)
    }
  }

  stripWeightClasses(body)
  sanitizeDomForWord(body)

  if (body.children.length === 1) {
    const only = body.children[0] as HTMLElement
    const tag = only.tagName.toLowerCase()
    if (tag === 'strong' || tag === 'b') {
      body.innerHTML = only.innerHTML
    }
  }

  const wrapper = doc.createElement('div')
  wrapper.setAttribute('style', WRAPPER_STYLE)
  wrapper.innerHTML = body.innerHTML

  body.innerHTML = ''
  body.appendChild(wrapper)

  return body.innerHTML
}

/** Documento HTML completo para Clipboard API — sem CF_HTML, sem CSS global. */
function buildCleanHtmlDocument(bodyInnerHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<style>
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    font-weight: normal;
    color: #000000;
    margin: 2.54cm;
  }
  * { border: none !important; outline: none !important; box-shadow: none !important; background: transparent !important; }
  strong, b { font-weight: bold; }
  em, i     { font-style: italic; }
  u         { text-decoration: underline; }
</style>
</head>
<body>
${bodyInnerHtml}
</body>
</html>`
}

function extractPlainText(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return doc.body.textContent || doc.body.innerText || ''
}

// ─── Via Clipboard API (preferida) ─────────────────────────────────────────

async function copyViaClipboardApi(bodyInnerHtml: string): Promise<void> {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Clipboard API não disponível')
  }

  const htmlString = buildCleanHtmlDocument(bodyInnerHtml)
  const plainText = extractPlainText(bodyInnerHtml)

  const htmlBlob = new Blob([htmlString], { type: 'text/html' })
  const textBlob = new Blob([plainText], { type: 'text/plain' })

  await navigator.clipboard.write([
    new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob }),
  ])
}

// ─── Via iframe (2ª opção — DOM isolado, sem CSS global) ───────────────────

async function copyViaIframe(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    Object.assign(iframe.style, {
      position: 'fixed', left: '-9999px', top: '0',
      width: '210mm', height: '297mm', border: 'none', opacity: '0',
    })
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      document.body.removeChild(iframe)
      return reject(new Error('iframe document inacessível'))
    }

    iframeDoc.open()
    iframeDoc.write(buildCleanHtmlDocument(html))
    iframeDoc.close()

    const cleanup = () => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe)
    }

    const failTimer = window.setTimeout(() => { cleanup(); reject(new Error('Timeout iframe')) }, 5000)

    window.setTimeout(() => {
      try {
        const range = iframeDoc.createRange()
        range.selectNodeContents(iframeDoc.body)
        const sel = iframe.contentWindow?.getSelection() || iframeDoc.getSelection()
        if (!sel) throw new Error('getSelection indisponível no iframe')
        sel.removeAllRanges()
        sel.addRange(range)
        const ok = iframeDoc.execCommand('copy')
        sel.removeAllRanges()
        window.clearTimeout(failTimer)
        cleanup()
        if (ok) resolve()
        else reject(new Error('execCommand false no iframe'))
      } catch (err) {
        window.clearTimeout(failTimer)
        cleanup()
        reject(err)
      }
    }, 60)
  })
}

// ─── Via execCommand no DOM principal (último recurso) ─────────────────────
// ATENÇÃO: o CSS global pode contaminar os estilos copiados.

async function copyViaDOMElement(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const container = document.createElement('div')
    Object.assign(container.style, {
      position: 'fixed', left: '-9999px', top: '0', opacity: '0',
      width: '210mm', padding: '2.54cm',
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: '12pt', fontWeight: 'normal', lineHeight: '1.5',
      color: '#000000', backgroundColor: 'white',
      border: 'none', outline: 'none', boxShadow: 'none',
    })
    container.contentEditable = 'true'
    container.setAttribute('spellcheck', 'false')
    container.innerHTML = html
    document.body.appendChild(container)

    let frames = 0
    const tick = () => {
      requestAnimationFrame(() => {
        if (++frames < 3) return tick()
        try {
          container.focus()
          const range = document.createRange()
          range.selectNodeContents(container)
          const sel = window.getSelection()
          if (!sel) { document.body.removeChild(container); return reject(new Error('no selection')) }
          sel.removeAllRanges()
          sel.addRange(range)
          setTimeout(() => {
            try {
              const ok = document.execCommand('copy')
              sel.removeAllRanges()
              document.body.removeChild(container)
              if (ok) resolve()
              else reject(new Error('execCommand false'))
            } catch (e) {
              sel.removeAllRanges()
              document.body.removeChild(container)
              reject(e)
            }
          }, 10)
        } catch (e) {
          try { document.body.removeChild(container) } catch { /* ignore */ }
          reject(e)
        }
      })
    }
    tick()
  })
}

// ─── Ponto de entrada público ───────────────────────────────────────────────

/**
 * Copia HTML para o clipboard em formato compatível com Word.
 * Tenta Clipboard API → iframe → execCommand (DOM principal).
 */
export async function copyHTMLToWordClipboard(html: string): Promise<void> {
  const prepared = prepareHtmlForWordClipboard(html)

  try {
    await copyViaClipboardApi(prepared)
    return
  } catch (e) {
    console.warn('Clipboard API falhou, tentando iframe:', e)
  }

  try {
    await copyViaIframe(prepared)
    return
  } catch (e) {
    console.warn('iframe falhou, tentando execCommand:', e)
  }

  await copyViaDOMElement(prepared)
}

export function copyHTMLToWordAlternative(html: string): Promise<void> {
  return copyHTMLToWordClipboard(html)
}
