import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import TiptapUnderline from '@tiptap/extension-underline'
import { Document, Packer, PageOrientation } from 'docx'
import { saveAs } from 'file-saver'
import { Download, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { htmlToDocxElements } from '@/lib/htmlToDocx'
import { extractHTMLFromEditor } from '@/lib/preserveHTML'
import type { TeseFonteUtilizada } from '@/lib/peticao-ai'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

type PeticaoGeradaStepProps = {
  /** Incrementar quando um novo HTML for gerado para remontar o editor. */
  contentVersion: number
  initialHtml: string
  titulo: string
  descricao: string
  fontesUtilizadas: TeseFonteUtilizada[]
  onHtmlChange: (html: string) => void
  onSalvar?: () => void
  salvarLabel?: string
  salvarPending?: boolean
  mostrarSalvar?: boolean
  className?: string
}

export function PeticaoGeradaStep({
  contentVersion,
  initialHtml,
  titulo,
  descricao,
  fontesUtilizadas,
  onHtmlChange,
  onSalvar,
  salvarLabel = 'Salvar e abrir editor',
  salvarPending = false,
  mostrarSalvar = true,
  className,
}: PeticaoGeradaStepProps) {
  const { toast } = useToast()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        paragraph: { HTMLAttributes: { class: null } },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
      Placeholder.configure({ placeholder: 'Edite o texto da peça...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TiptapUnderline,
    ],
    content: initialHtml,
    parseOptions: { preserveWhitespace: 'full' },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[320px] p-4 dark:prose-invert',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onHtmlChange(ed.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const html = initialHtml?.trim() ? initialHtml : '<p></p>'
    editor.commands.setContent(html, false, { preserveWhitespace: 'full' })
    // Somente quando contentVersion muda (nova geração); não incluir initialHtml nas deps para não sobrescrever digitação.
  }, [contentVersion, editor])

  const handleExportDocx = async () => {
    if (!editor) return
    try {
      const htmlContent = extractHTMLFromEditor(editor)
      if (!htmlContent || htmlContent === '<p></p>') {
        toast({
          title: 'Sem conteúdo',
          description: 'Gere ou edite o texto antes de exportar.',
          variant: 'destructive',
        })
        return
      }
      const contentElements = htmlToDocxElements(htmlContent)
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                size: {
                  orientation: PageOrientation.PORTRAIT,
                  width: 11906,
                  height: 16838,
                },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
              },
            },
            children: contentElements,
          },
        ],
      })
      const blob = await Packer.toBlob(doc)
      const fileName =
        titulo.replace(/[^a-z0-9\u00C0-\u024F]/gi, '_').replace(/_+/g, '_').substring(0, 80) ||
        'peca'
      saveAs(blob, `${fileName}.docx`)
      toast({ title: 'Download', description: 'Arquivo Word gerado.' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao exportar'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    }
  }

  return (
    <Card className={cn('border-primary/20', className)}>
      <CardHeader>
        <CardTitle>Prévia da peça</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{titulo}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
        </div>

        <div className="rounded-md border bg-muted/20 p-4">
          <p className="text-sm font-semibold">Fontes utilizadas do acervo</p>
          {fontesUtilizadas.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhuma tese aderente foi utilizada nesta geração.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {fontesUtilizadas.map((fonte) => (
                <li
                  key={fonte.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{fonte.titulo}</span>
                    <span className="ml-2 text-muted-foreground">
                      {fonte.tipo_tese || 'Tipo não definido'} · relevância {fonte.score}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    asChild
                  >
                    <a href={`/teses/${fonte.id}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Abrir tese
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border bg-background">
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">Carregando editor…</p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleExportDocx}>
            <Download className="mr-2 h-4 w-4" />
            Baixar Word (.docx)
          </Button>
          {mostrarSalvar && onSalvar && (
            <Button type="button" onClick={onSalvar} disabled={salvarPending}>
              {salvarPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {salvarLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
