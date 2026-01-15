import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTese, useUpdateTese } from '@/hooks/useTeses'
import { useTeses } from '@/hooks/useTeses'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Save, Download, FileText, PanelRightClose, PanelRightOpen, Copy, Check } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageOrientation } from 'docx'
import { saveAs } from 'file-saver'
import { EditorAISidebar } from '@/components/EditorAISidebar'
import { htmlToDocxElements } from '@/lib/htmlToDocx'
import { copyHTMLToWordClipboard, copyHTMLToWordAlternative } from '@/lib/copyToWord'
import { extractHTMLFromEditor, preserveInlineStyles, decideHTMLToSave } from '@/lib/preserveHTML'

export default function ThesisEditor() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const idsParam = searchParams.get('ids')
  const teseIds = idsParam ? idsParam.split(',') : id ? [id] : []
  const isMultiple = teseIds.length > 1

  const { data: singleTese, isLoading: isLoadingSingle } = useTese(teseIds[0] || '')
  
  // Para múltiplas teses, buscar todas e filtrar
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

  const [activeTeseIndex, setActiveTeseIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const activeTese = teses[activeTeseIndex]

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        // Configurar para preservar melhor atributos HTML
        paragraph: {
          HTMLAttributes: {
            class: null, // Não adicionar classes automáticas
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Comece a escrever sua tese...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: activeTese?.texto_conteudo || '',
    parseOptions: {
      preserveWhitespace: 'full',
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[600px] p-6 max-w-4xl',
      },
      // Preservar estilos ao colar
      transformPastedHTML: (html: string) => {
        // Retornar HTML sem modificações para preservar formatação
        return html
      },
      // Preservar atributos ao parsear
      transformPastedText: (text: string) => {
        return text
      },
    },
  })

  useEffect(() => {
    if (activeTese && editor) {
      // Carregar conteúdo preservando formatação original
      // O false evita disparar eventos, preservando melhor o HTML original
      const htmlContent = activeTese.texto_conteudo || ''
      
      // Usar setContent com opções para preservar melhor
      editor.commands.setContent(htmlContent, false, {
        preserveWhitespace: 'full',
      })
      
      // Log para debug (verificar se HTML está sendo preservado)
      console.log('HTML carregado no editor (primeiros 500 chars):', htmlContent.substring(0, 500))
    }
  }, [activeTese, editor])

  const handleSave = async () => {
    if (!activeTese || !editor) return

    try {
      // IMPORTANTE: Comparar HTML original com HTML editado
      // Se não houve mudanças reais (apenas normalização do Tiptap), manter HTML original
      const originalHTML = activeTese.texto_conteudo || ''
      
      // Extrair HTML do editor
      let editedHTML = extractHTMLFromEditor(editor)
      editedHTML = preserveInlineStyles(editedHTML)
      
      // Decidir qual HTML usar (original se não houve mudanças reais)
      const htmlToSave = decideHTMLToSave(originalHTML, editedHTML)
      
      // Log para debug
      console.log('HTML original (primeiros 200 chars):', originalHTML.substring(0, 200))
      console.log('HTML editado (primeiros 200 chars):', editedHTML.substring(0, 200))
      console.log('HTML sendo salvo (primeiros 200 chars):', htmlToSave.substring(0, 200))
      
      await updateMutation.mutateAsync({
        id: activeTese.id,
        updates: {
          texto_conteudo: htmlToSave,
        },
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
    if (!editor || teses.length === 0) return

    try {
      const currentTese = teses[activeTeseIndex]
      const originalHTML = currentTese.texto_conteudo || ''
      
      // Extrair HTML do editor
      let editedHTML = extractHTMLFromEditor(editor)
      editedHTML = preserveInlineStyles(editedHTML)
      
      // Decidir qual HTML usar
      const htmlToSave = decideHTMLToSave(originalHTML, editedHTML)

      await updateMutation.mutateAsync({
        id: currentTese.id,
        updates: {
          texto_conteudo: htmlToSave,
        },
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
      // Copiar HTML original do banco (não o do editor que pode ter sido modificado)
      const htmlContent = activeTese.texto_conteudo || ''
      
      if (!htmlContent) {
        toast({
          title: 'Erro',
          description: 'Nenhum conteúdo para copiar',
          variant: 'destructive',
        })
        return
      }
      
      // Tentar método otimizado para Word primeiro
      try {
        await copyHTMLToWordClipboard(htmlContent)
      } catch (error) {
        // Se falhar, usar método alternativo
        console.warn('Método principal falhou, usando alternativo:', error)
        copyHTMLToWordAlternative(htmlContent)
      }
      
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      
      toast({
        title: 'Copiado!',
        description: 'Conteúdo copiado no formato Word. Cole no Word (Ctrl+V) e escolha "Manter Formatação Original" ou "Usar Tema do Destino".',
      })
    } catch (error: any) {
      console.error('Erro ao copiar:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao copiar. Tente selecionar o texto manualmente e copiar.',
        variant: 'destructive',
      })
    }
  }

  const handleExport = async () => {
    if (!editor || !activeTese) return

    try {
      // SEMPRE usar o HTML salvo no banco (que veio do Word original)
      // NUNCA usar editor.getHTML() pois o Tiptap modifica/normaliza o HTML
      const htmlContent = activeTese.texto_conteudo || ''
      
      if (!htmlContent) {
        toast({
          title: 'Erro',
          description: 'Nenhum conteúdo encontrado para exportar',
          variant: 'destructive',
        })
        return
      }
      
      // Debug: log do HTML que será convertido
      console.log('HTML sendo convertido para DOCX:', htmlContent.substring(0, 500) + '...')

      // Converter HTML para elementos docx preservando formatação
      const contentElements = htmlToDocxElements(htmlContent)

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                size: {
                  orientation: PageOrientation.PORTRAIT,
                  width: 11906, // A4 width em twips (210mm = 8.27" = 11906 twips)
                  height: 16838, // A4 height em twips (297mm = 11.69" = 16838 twips)
                },
                margin: {
                  top: 1440, // 1 polegada (em twips) - igual ao código antigo
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            children: [
              // Apenas o conteúdo da tese com formatação preservada (sem título e descrição)
              ...contentElements,
            ],
          },
        ],
      })

      const blob = await Packer.toBlob(doc)
      // Usar título da tese como nome do arquivo (sanitizado)
      const fileName = activeTese.titulo
        .replace(/[^a-z0-9]/gi, '_')
        .replace(/_+/g, '_')
        .substring(0, 50) || 'tese'
      saveAs(blob, `${fileName}.docx`)

      toast({
        title: 'Exportado!',
        description: 'O documento foi gerado com formatação preservada.',
      })
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao exportar',
        variant: 'destructive',
      })
    }
  }

  const handleExportAll = async () => {
    if (teses.length === 0) return

    try {
      const sections = teses.map((tese) => {
        // Converter HTML para elementos docx preservando formatação
        const contentElements = tese.texto_conteudo
          ? htmlToDocxElements(tese.texto_conteudo)
          : []

        return {
          properties: {},
          children: [
            // Título da tese
            new Paragraph({
              children: [
                new TextRun({
                  text: tese.titulo,
                  bold: true,
                  size: 32,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 },
            }),
            // Descrição (se houver)
            ...(tese.descricao
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: tese.descricao,
                        italics: true,
                        size: 22,
                      }),
                    ],
                    spacing: { after: 200 },
                  }),
                ]
              : []),
            // Espaço
            new Paragraph({
              children: [new TextRun({ text: '' })],
              spacing: { after: 200 },
            }),
            // Conteúdo da tese com formatação preservada
            ...contentElements,
            // Separador entre teses
            new Paragraph({
              children: [new TextRun({ text: '' })],
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: '─'.repeat(50),
                  color: 'CCCCCC',
                }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [new TextRun({ text: '' })],
              spacing: { after: 400 },
            }),
          ],
        }
      })

      const doc = new Document({
        sections,
      })

      const blob = await Packer.toBlob(doc)
      saveAs(blob, `teses-${teses.length}-${Date.now()}.docx`)

      toast({
        title: 'Exportado!',
        description: `${teses.length} tese(s) exportada(s) com sucesso.`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao exportar',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    )
  }

  if (teses.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto mb-4 h-12 w-12" style={{ color: '#101f2e' }} />
          <div className="text-lg text-red-500">Tese(s) não encontrada(s)</div>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                {isMultiple ? `${teses.length} Teses Selecionadas` : activeTese.titulo}
              </h1>
              {activeTese.area && (
                <p className="text-sm" style={{ color: '#101f2e' }}>
                  {activeTese.area}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
            {isMultiple && (
              <>
                <Button variant="outline" onClick={handleExportAll}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Todas
                </Button>
                <Button onClick={handleSaveAll} disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Atual
                </Button>
              </>
            )}
            {!isMultiple && (
              <>
                <Button 
                  onClick={handleCopyHTML} 
                  disabled={!activeTese}
                  variant="outline"
                  title="Copiar HTML original para colar no Word (preserva formatação)"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar HTML
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Word
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Area */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all ${sidebarOpen ? 'mr-[400px]' : ''}`}>
          {/* Navegação entre teses (múltiplas) */}
          {isMultiple && teses.length > 1 && (
            <Card className="m-4 mb-0 border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-sm font-medium" style={{ color: '#101f2e' }}>Navegar:</span>
                  {teses.map((tese, index) => (
                    <Button
                      key={tese.id}
                      variant={index === activeTeseIndex ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setActiveTeseIndex(index)
                      }}
                      className="whitespace-nowrap"
                    >
                      {tese.titulo}
                      {index === activeTeseIndex && ' ✓'}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info da tese atual */}
          {isMultiple && (
            <Card className="mx-4 mb-4 border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{activeTese.titulo}</h2>
                    <p className="text-sm" style={{ color: '#101f2e' }}>{activeTese.descricao}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeTese.area && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                          {activeTese.area}
                        </span>
                      )}
                      {activeTese.assuntos?.map((a, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-sm" style={{ color: '#101f2e' }}>
                    {activeTeseIndex + 1} de {teses.length}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Editor */}
          <Card className="mx-4 mb-4 flex-1 flex flex-col border-0 shadow-md overflow-hidden min-h-0">
            <CardHeader className="border-b shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>Editor de Conteúdo</CardTitle>
                {isMultiple && (
                  <span className="text-sm" style={{ color: '#101f2e' }}>
                    {activeTeseIndex + 1} de {teses.length}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
              {/* Toolbar melhorada */}
              <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b backdrop-blur p-3 shrink-0" style={{ backgroundColor: '#101f2e' }}>
                <div className="flex items-center gap-1 border-r pr-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive('bold') ? 'bg-white/30' : ''}`}
                  >
                    <strong className="font-bold text-white">B</strong>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive('italic') ? 'bg-white/30' : ''}`}
                  >
                    <em className="italic text-white">I</em>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive('underline') ? 'bg-white/30' : ''}`}
                  >
                    <u className="text-white">U</u>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive('strike') ? 'bg-white/30' : ''}`}
                  >
                    <span className="line-through text-white">S</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleHighlight().run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive('highlight') ? 'bg-white/30' : ''}`}
                  >
                    <span className="bg-yellow-200 px-1 text-gray-900">H</span>
                  </Button>
                </div>
                <div className="flex items-center gap-1 border-r pr-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive('heading', { level: 1 }) ? 'bg-white/30' : ''}`}
                  >
                    <span className="text-white">H1</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive('heading', { level: 2 }) ? 'bg-white/30' : ''}`}
                  >
                    <span className="text-white">H2</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive('heading', { level: 3 }) ? 'bg-white/30' : ''}`}
                  >
                    <span className="text-white">H3</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive('heading', { level: 4 }) ? 'bg-white/30' : ''}`}
                  >
                    <span className="text-white">H4</span>
                  </Button>
                </div>
                <div className="flex items-center gap-1 border-r pr-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive({ textAlign: 'left' }) ? 'bg-white/30' : ''}`}
                  >
                    <span className="text-white">⬅</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive({ textAlign: 'center' }) ? 'bg-white/30' : ''}`}
                  >
                    <span className="text-white">⬌</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive({ textAlign: 'right' }) ? 'bg-white/30' : ''}`}
                  >
                    <span className="text-white">➡</span>
                  </Button>
                </div>
                <div className="flex items-center gap-1 border-r pr-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive('bulletList') ? 'bg-white/30' : ''}`}
                  >
                    <span className="text-white">•</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    className={`text-white hover:bg-white/20 ${editor?.isActive('orderedList') ? 'bg-white/30' : ''}`}
                  >
                    <span className="text-white">1.</span>
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                    className="text-white hover:bg-white/20"
                  >
                    <span className="text-white">─</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().undo().run()}
                    className="text-white hover:bg-white/20"
                  >
                    <span className="text-white">↶</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor?.chain().focus().redo().run()}
                    className="text-white hover:bg-white/20"
                  >
                    <span className="text-white">↷</span>
                  </Button>
                </div>
              </div>

              {/* Editor Content */}
              <div className="flex-1 overflow-y-auto bg-white min-h-0">
                <EditorContent editor={editor} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Sidebar */}
        {sidebarOpen && (
          <div className="absolute right-0 top-0 bottom-0 w-[400px] border-l bg-white shadow-lg">
            <EditorAISidebar
              editor={editor}
              tese={activeTese}
              onUpdateContent={(content) => {
                if (editor) {
                  editor.commands.setContent(content)
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
