import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTese, useUpdateTese } from '@/hooks/useTeses'
import { useTeses } from '@/hooks/useTeses'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ArrowLeft,
  Save,
  Download,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Copy,
  Check,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Minus,
  Undo2,
  Redo2,
} from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import TiptapUnderline from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageOrientation } from 'docx'
import { saveAs } from 'file-saver'
import { EditorAISidebar } from '@/components/EditorAISidebar'
import { htmlToDocxElements } from '@/lib/htmlToDocx'
import { copyHTMLToWordClipboard, copyHTMLToWordAlternative } from '@/lib/copyToWord'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { extractHTMLFromEditor, preserveInlineStyles, decideHTMLToSave } from '@/lib/preserveHTML'
import { getAreaIcon } from '@/constants/area-icons'
import { tipoTeseBadgeClass, areaBadgeClass, assuntoBadgeClass } from '@/components/dashboard/teseMetaStyles'
import { cn } from '@/lib/utils'

export default function ThesisEditor() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const idsParam = searchParams.get('ids')
  const teseIds = idsParam ? idsParam.split(',') : id ? [id] : []
  const isMultiple = teseIds.length > 1

  const { data: singleTese, isLoading: isLoadingSingle } = useTese(teseIds[0] || '')

  const { data: allTesesData } = useTeses({
    page: 1,
    pageSize: 1000,
  })

  const teses = isMultiple
    ? (allTesesData?.data.filter((t) => teseIds.includes(t.id)) || []).sort((a, b) => {
        const indexA = teseIds.indexOf(a.id)
        const indexB = teseIds.indexOf(b.id)
        return indexA - indexB
      })
    : singleTese
      ? [singleTese]
      : []

  const isLoading = isMultiple ? false : isLoadingSingle
  const updateMutation = useUpdateTese()
  const { toast } = useToast()
  const { user, canEditTeseContent } = useAuth()
  const visualizacaoRegistrada = useRef<Set<string>>(new Set())

  const [activeTeseIndex, setActiveTeseIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const activeTese = teses[activeTeseIndex]
  /** Persistir no Supabase (acervo). Edição local no TipTap é permitida sem isso para copiar/exportar. */
  const canSaveTeseContent = activeTese
    ? canEditTeseContent(activeTese.user_id)
    : false

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
      Placeholder.configure({
        placeholder: 'Comece a escrever sua tese...',
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TiptapUnderline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: activeTese?.texto_conteudo || '',
    parseOptions: { preserveWhitespace: 'full' },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-6 max-w-4xl dark:prose-invert',
      },
      transformPastedHTML: (html: string) => html,
      transformPastedText: (text: string) => text,
    },
  })

  useEffect(() => {
    if (activeTese && editor) {
      const htmlContent = activeTese.texto_conteudo || ''
      editor.commands.setContent(htmlContent, false, { preserveWhitespace: 'full' })
    }
  }, [activeTese, editor])

  useEffect(() => {
    const tid = activeTese?.id
    const uid = user?.id
    if (!tid || !uid) return
    if (visualizacaoRegistrada.current.has(tid)) return
    visualizacaoRegistrada.current.add(tid)
    void supabase.from('tese_visualizacoes').insert({ tese_id: tid, user_id: uid })
  }, [activeTese?.id, user?.id])

  useEffect(() => {
    if (!editor) return
    const id = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'))
    })
    return () => window.cancelAnimationFrame(id)
  }, [sidebarOpen, editor])

  const handleSave = async () => {
    if (!canSaveTeseContent || !activeTese || !editor) return
    try {
      const originalHTML = activeTese.texto_conteudo || ''
      let editedHTML = extractHTMLFromEditor(editor)
      editedHTML = preserveInlineStyles(editedHTML)
      const htmlToSave = decideHTMLToSave(originalHTML, editedHTML)

      await updateMutation.mutateAsync({
        id: activeTese.id,
        updates: { texto_conteudo: htmlToSave },
      })
      toast({
        title: 'Salvo!',
        description: `"${activeTese.titulo}" foi salva com sucesso.`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar',
        variant: 'destructive',
      })
    }
  }

  const handleSaveAll = async () => {
    if (!canSaveTeseContent || !editor || teses.length === 0) return
    try {
      const currentTese = teses[activeTeseIndex]
      const originalHTML = currentTese.texto_conteudo || ''
      let editedHTML = extractHTMLFromEditor(editor)
      editedHTML = preserveInlineStyles(editedHTML)
      const htmlToSave = decideHTMLToSave(originalHTML, editedHTML)

      await updateMutation.mutateAsync({
        id: currentTese.id,
        updates: { texto_conteudo: htmlToSave },
      })
      toast({
        title: 'Salvo!',
        description: `Tese "${currentTese.titulo}" salva. Continue editando as outras.`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar',
        variant: 'destructive',
      })
    }
  }

  const handleCopyHTML = async () => {
    if (!activeTese) return
    try {
      let htmlContent = ''
      if (editor) {
        const live = extractHTMLFromEditor(editor)
        htmlContent = live.trim()
          ? preserveInlineStyles(live)
          : (activeTese.texto_conteudo || '')
      } else {
        htmlContent = activeTese.texto_conteudo || ''
      }
      if (!htmlContent) {
        toast({ title: 'Erro', description: 'Nenhum conteúdo para copiar', variant: 'destructive' })
        return
      }
      try {
        await copyHTMLToWordClipboard(htmlContent)
      } catch {
        await copyHTMLToWordAlternative(htmlContent)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: 'Copiado!',
        description: 'Conteúdo copiado. Cole no Word (Ctrl+V) e escolha "Manter Formatação Original".',
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao copiar.',
        variant: 'destructive',
      })
    }
  }

  const handleExport = async () => {
    if (!editor || !activeTese) return
    try {
      const live = extractHTMLFromEditor(editor)
      const htmlContent = live.trim()
        ? preserveInlineStyles(live)
        : (activeTese.texto_conteudo || '')
      if (!htmlContent) {
        toast({ title: 'Erro', description: 'Nenhum conteúdo para exportar', variant: 'destructive' })
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
      const fileName = activeTese.titulo.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').substring(0, 50) || 'tese'
      saveAs(blob, `${fileName}.docx`)
      toast({ title: 'Exportado!', description: 'Documento gerado com formatação preservada.' })
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Erro ao exportar', variant: 'destructive' })
    }
  }

  const handleExportAll = async () => {
    if (teses.length === 0) return
    try {
      const sections = teses.map((tese) => {
        const contentElements = tese.texto_conteudo ? htmlToDocxElements(tese.texto_conteudo) : []
        return {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: tese.titulo, bold: true, size: 32 })],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),
            ...(tese.descricao
              ? [
                  new Paragraph({
                    children: [new TextRun({ text: tese.descricao, italics: true, size: 22 })],
                    spacing: { after: 200 },
                  }),
                ]
              : []),
            new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 200 } }),
            ...contentElements,
            new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 400 } }),
            new Paragraph({
              children: [new TextRun({ text: '─'.repeat(50), color: 'CCCCCC' })],
              spacing: { after: 400 },
            }),
            new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 400 } }),
          ],
        }
      })
      const doc = new Document({ sections })
      const blob = await Packer.toBlob(doc)
      saveAs(blob, `teses-${teses.length}-${Date.now()}.docx`)
      toast({ title: 'Exportado!', description: `${teses.length} tese(s) exportada(s) com sucesso.` })
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Erro ao exportar', variant: 'destructive' })
    }
  }

  const ToolbarButton = ({
    onClick,
    active,
    children,
    label,
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    label: string
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          className={cn(
            'h-9 w-9 p-0 text-muted-foreground hover:bg-fenix-navy/10 hover:text-fenix-navy dark:hover:bg-fenix-purple-light/15 dark:hover:text-fenix-purple-light',
            active && 'bg-fenix-navy/15 text-fenix-navy dark:bg-fenix-purple-dark/25 dark:text-fenix-purple-light'
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-fenix-purple-dark border-t-transparent dark:border-fenix-purple-light dark:border-t-transparent" />
          <p className="text-muted-foreground">Carregando tese...</p>
        </div>
      </div>
    )
  }

  if (teses.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <FileText className="h-16 w-16 text-muted-foreground/50" />
        <p className="text-lg font-medium text-foreground">Tese(s) não encontrada(s)</p>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-[calc(100vh-3.5rem)] min-h-0 flex-col overflow-hidden lg:h-screen">
        {/* Header Fênix */}
        <header className="flex shrink-0 flex-col gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="shrink-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-semibold text-foreground">
                  {isMultiple ? `${teses.length} teses selecionadas` : activeTese.titulo}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {activeTese.area && (
                    <Badge variant="outline" className={cn('gap-1', areaBadgeClass())}>
                      {(() => {
                        const AreaIcon = getAreaIcon(activeTese.area)
                        return <AreaIcon className="h-3 w-3" aria-hidden />
                      })()}
                      {activeTese.area}
                    </Badge>
                  )}
                  {activeTese.tipo_tese && (
                    <Badge variant="outline" className={tipoTeseBadgeClass(activeTese.tipo_tese)}>
                      {activeTese.tipo_tese}
                    </Badge>
                  )}
                  {activeTese.assuntos?.slice(0, 2).map((a, i) => (
                    <Badge key={i} variant="outline" className={assuntoBadgeClass()}>
                      {a}
                    </Badge>
                  ))}
                  {activeTese.assuntos && activeTese.assuntos.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{activeTese.assuntos.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="shrink-0"
                  >
                    {sidebarOpen ? (
                      <PanelRightClose className="h-4 w-4" />
                    ) : (
                      <PanelRightOpen className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">
                      {sidebarOpen ? 'Ocultar' : 'Mostrar'} IA
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Assistente de IA para edição</TooltipContent>
              </Tooltip>
              {isMultiple && (
                <>
                  <Button variant="outline" size="sm" onClick={handleExportAll}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Todas
                  </Button>
                  {canSaveTeseContent && (
                    <Button
                      size="sm"
                      onClick={handleSaveAll}
                      disabled={updateMutation.isPending}
                      className="bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white hover:opacity-95"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Atual
                    </Button>
                  )}
                </>
              )}
              {!isMultiple && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyHTML}
                    disabled={!activeTese}
                    title="Copiar para Word"
                  >
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Word
                  </Button>
                  {canSaveTeseContent && (
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white hover:opacity-95"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {!canSaveTeseContent && (
            <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              Você pode editar, usar a barra de ferramentas e a IA para montar o texto localmente; use{' '}
              <strong className="font-semibold">Copiar</strong> ou <strong className="font-semibold">Word</strong> para
              levar o resultado. O botão Salvar não está disponível: seu perfil não pode alterar o texto padrão salvo no
              acervo.
            </p>
          )}

          {/* Navegação entre teses (múltiplas) */}
          {isMultiple && teses.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="shrink-0 text-xs font-medium text-muted-foreground">Navegar:</span>
              <div className="flex gap-1.5">
                {teses.map((tese, index) => (
                  <Button
                    key={tese.id}
                    variant={index === activeTeseIndex ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTeseIndex(index)}
                    className={cn(
                      'shrink-0 whitespace-nowrap',
                      index === activeTeseIndex &&
                        'bg-fenix-navy text-white hover:bg-fenix-navy/90 dark:bg-fenix-purple-dark dark:text-white dark:hover:bg-fenix-purple-dark/90'
                    )}
                  >
                    {tese.titulo.length > 30 ? `${tese.titulo.slice(0, 30)}…` : tese.titulo}
                    {index === activeTeseIndex && ' ✓'}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div className="relative flex min-h-0 flex-1 overflow-x-hidden">
          <div
            className={cn(
              'relative z-0 flex min-h-0 flex-1 flex-col transition-[margin] duration-200 ease-out',
              sidebarOpen && 'lg:mr-[380px]'
            )}
          >
            {/* Editor Card */}
            <div className="flex flex-1 flex-col overflow-hidden border-t border-border bg-muted/30">
              {/* Toolbar Fênix */}
              <div className="flex flex-wrap items-center gap-1 border-b border-border bg-card px-3 py-2">
                <div className="flex items-center gap-0.5 border-r border-border pr-2">
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    active={editor?.isActive('bold')}
                    label="Negrito"
                  >
                    <Bold className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    active={editor?.isActive('italic')}
                    label="Itálico"
                  >
                    <Italic className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    active={editor?.isActive('underline')}
                    label="Sublinhado"
                  >
                    <Underline className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    active={editor?.isActive('strike')}
                    label="Riscado"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHighlight().run()}
                    active={editor?.isActive('highlight')}
                    label="Destacar"
                  >
                    <Highlighter className="h-4 w-4" />
                  </ToolbarButton>
                </div>
                <div className="flex items-center gap-0.5 border-r border-border pr-2">
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor?.isActive('heading', { level: 1 })}
                    label="Título 1"
                  >
                    <Heading1 className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor?.isActive('heading', { level: 2 })}
                    label="Título 2"
                  >
                    <Heading2 className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor?.isActive('heading', { level: 3 })}
                    label="Título 3"
                  >
                    <Heading3 className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
                    active={editor?.isActive('heading', { level: 4 })}
                    label="Título 4"
                  >
                    <Heading4 className="h-4 w-4" />
                  </ToolbarButton>
                </div>
                <div className="flex items-center gap-0.5 border-r border-border pr-2">
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                    active={editor?.isActive({ textAlign: 'left' })}
                    label="Alinhar à esquerda"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                    active={editor?.isActive({ textAlign: 'center' })}
                    label="Centralizar"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                    active={editor?.isActive({ textAlign: 'right' })}
                    label="Alinhar à direita"
                  >
                    <AlignRight className="h-4 w-4" />
                  </ToolbarButton>
                </div>
                <div className="flex items-center gap-0.5 border-r border-border pr-2">
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    active={editor?.isActive('bulletList')}
                    label="Lista com marcadores"
                  >
                    <List className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    active={editor?.isActive('orderedList')}
                    label="Lista numerada"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </ToolbarButton>
                </div>
                <div className="flex items-center gap-0.5">
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                    label="Linha horizontal"
                  >
                    <Minus className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().undo().run()}
                    label="Desfazer"
                  >
                    <Undo2 className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().redo().run()}
                    label="Refazer"
                  >
                    <Redo2 className="h-4 w-4" />
                  </ToolbarButton>
                </div>
              </div>

              {/* Editor Content */}
              <div className="flex-1 overflow-y-auto bg-background">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {sidebarOpen && (
            <button
              type="button"
              aria-label="Fechar assistente de IA"
              className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] transition-opacity duration-200 ease-out lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* AI Sidebar — permanece montado para transição; estado do chat preservado */}
          <aside
            className={cn(
              'absolute bottom-0 right-0 top-0 z-20 flex min-h-0 w-full max-w-full flex-col overflow-hidden border-l border-border bg-card shadow-xl will-change-transform',
              'sm:max-w-md',
              'transition-transform duration-200 ease-out lg:w-[380px] lg:max-w-[380px]',
              sidebarOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
            )}
            aria-hidden={!sidebarOpen}
          >
            <EditorAISidebar
              editor={editor}
              tese={activeTese}
              onUpdateContent={(content) => editor?.commands.setContent(content)}
            />
          </aside>
        </div>
      </div>
    </TooltipProvider>
  )
}
