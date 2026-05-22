import { useState, useRef, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import {
  MessageSquare,
  FileText,
  FileCode,
  Scale,
  Globe,
  Library,
  Users,
  Send,
  Loader2,
  Upload,
  X,
  Sparkles,
  Search,
  ExternalLink,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'
import type { Tese } from '@/types/supabase'
import { cn } from '@/lib/utils'
import { AI_MODEL, promptDeveAplicar } from '@/lib/ai-config'

interface EditorAISidebarProps {
  editor: Editor | null
  tese: Tese | null
  onUpdateContent?: (content: string) => void
  /** Quando true, não aplica HTML no editor (ex.: perfil advogado). */
  readOnly?: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  userPrompt?: string
}

interface WebSearchResult {
  title: string
  url: string
  snippet: string
  source?: string
}

interface Grupo {
  id: string
  nome: string
  documentoIds: string[]
  modeloIds: string[]
  createdAt: string
}

const GRUPOS_KEY = 'fenix-ia-grupos'

export function EditorAISidebar({
  editor,
  tese,
  onUpdateContent,
  readOnly = false,
}: EditorAISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [documentos, setDocumentos] = useState<File[]>([])
  const [modelos, setModelos] = useState<File[]>([])
  const [jurisprudenciaQuery, setJurisprudenciaQuery] = useState('')
  const [webSearchQuery, setWebSearchQuery] = useState('')
  const [webSearchResults, setWebSearchResults] = useState<WebSearchResult[]>([])
  const [isSearchingWeb, setIsSearchingWeb] = useState(false)
  const [showAtMenu, setShowAtMenu] = useState(false)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [grupos, setGrupos] = useState<Grupo[]>(() => {
    try {
      const s = localStorage.getItem(GRUPOS_KEY)
      return s ? JSON.parse(s) : []
    } catch {
      return []
    }
  })
  const [novoGrupoNome, setNovoGrupoNome] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    localStorage.setItem(GRUPOS_KEY, JSON.stringify(grupos))
  }, [grupos])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const lastChar = input[input.length - 1]
    if (lastChar === '@') setShowAtMenu(true)
    else if (lastChar === '/') setShowSlashMenu(true)
    else {
      setShowAtMenu(false)
      setShowSlashMenu(false)
    }
  }, [input])

  const buildContext = async () => {
    const editorContent = editor?.getHTML() || ''
    const documentosContent = await Promise.all(
      documentos.map(async (file) => {
        try {
          const text = await file.text()
          return { name: file.name, content: text.substring(0, 3000) }
        } catch {
          return { name: file.name, content: '(arquivo binário - use .txt ou .html)' }
        }
      })
    )
    const modelosContent = await Promise.all(
      modelos.map(async (file) => {
        try {
          const text = await file.text()
          return { name: file.name, content: text.substring(0, 2000) }
        } catch {
          return { name: file.name, content: '(arquivo binário - use .txt ou .html)' }
        }
      })
    )
    return {
      editorContent,
      documentosContent,
      modelosContent,
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsGenerating(true)

    try {
      const { editorContent, documentosContent, modelosContent } = await buildContext()

      const context = `
Tese atual: ${tese?.titulo || 'Sem título'}
Área: ${tese?.area || 'Não especificada'}
Assuntos: ${tese?.assuntos?.join(', ') || 'Não especificados'}
Conteúdo atual da tese:
${editorContent.substring(0, 4000)}

${documentosContent.length > 0 ? `\nDocumentos anexados (use como referência):\n${documentosContent.map((d) => `--- ${d.name} ---\n${d.content}`).join('\n\n')}` : ''}
${modelosContent.length > 0 ? `\nModelos de estilo (imite a formatação e tom):\n${modelosContent.map((m) => `--- ${m.name} ---\n${m.content}`).join('\n\n')}` : ''}
${webSearchResults.length > 0 ? `\nPesquisas web recentes:\n${webSearchResults.map((r) => `[${r.title}] ${r.snippet} - ${r.url}`).join('\n')}` : ''}
`

      const systemPrompt = `Você é um assistente jurídico especializado em direito brasileiro da Fênix I.A.
Ajude o usuário a melhorar e editar teses jurídicas.
- Use linguagem jurídica adequada e precisa
- Cite fundamentos legais quando relevante
- Quando o usuário pedir para APLICAR mudanças (melhorar, reescrever, expandir, fundamentar, adicionar, corrigir), forneça o conteúdo em HTML formatado dentro de \`\`\`html ... \`\`\`
- Para prompts como /resumir, /explicar, /analisar: responda com análise/sugestões em texto, NÃO forneça HTML para aplicar
- Seja objetivo e estruturado`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${context}\n\nInstrução do usuário: ${currentInput}` },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      })

      if (!response.ok) throw new Error('Erro ao chamar IA')

      const data = await response.json()
      const assistantContent = data.choices[0]?.message?.content || 'Erro ao gerar resposta'

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
          userPrompt: currentInput,
        },
      ])

      const hasHtml = assistantContent.includes('```html') || (assistantContent.includes('<p>') && assistantContent.includes('</p>'))
      if (hasHtml && promptDeveAplicar(currentInput)) {
        toast({
          title: 'Conteúdo gerado',
          description: 'Use o botão "Aplicar" para inserir no editor.',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao processar mensagem',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const hasApplicableHtml = (content: string) => {
    const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/) || content.match(/<p>[\s\S]*?<\/p>/)
    return !!htmlMatch
  }

  const handleApplyContent = (content: string) => {
    if (readOnly) {
      toast({
        title: 'Somente leitura',
        description: 'Seu perfil não pode alterar o conteúdo da tese.',
        variant: 'destructive',
      })
      return
    }
    const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/)
    if (htmlMatch && editor) {
      const html = htmlMatch[1].trim()
      editor.commands.setContent(html)
      onUpdateContent?.(html)
      toast({ title: 'Conteúdo aplicado', description: 'O conteúdo foi inserido no editor.' })
    } else {
      const inlineMatch = content.match(/<p>[\s\S]*?<\/p>/)
      if (inlineMatch && editor) {
        editor.commands.insertContent(inlineMatch[0])
        onUpdateContent?.(editor.getHTML())
        toast({ title: 'Conteúdo inserido', description: 'O trecho foi adicionado ao editor.' })
      } else if (editor) {
        editor.commands.insertContent(`<p>${content.replace(/\n/g, '</p><p>')}</p>`)
        toast({ title: 'Conteúdo inserido', description: 'O texto foi adicionado ao editor.' })
      }
    }
  }

  const handleFileUpload = (files: FileList | null, type: 'documentos' | 'modelos') => {
    if (!files) return
    const fileArray = Array.from(files)
    if (type === 'documentos') setDocumentos((prev) => [...prev, ...fileArray])
    else setModelos((prev) => [...prev, ...fileArray])
    toast({ title: 'Arquivo(s) adicionado(s)', description: `${fileArray.length} arquivo(s) adicionado(s).` })
  }

  const handleWebSearch = async () => {
    if (!webSearchQuery.trim()) {
      toast({ title: 'Campo vazio', description: 'Digite algo para pesquisar', variant: 'destructive' })
      return
    }
    setIsSearchingWeb(true)
    try {
      const searchQuery = encodeURIComponent(webSearchQuery)
      const results: WebSearchResult[] = []

      try {
        const wikiRes = await fetch(
          `https://pt.wikipedia.org/w/rest.php/v1/search/page?q=${searchQuery}&limit=5`
        )
        const wikiData = await wikiRes.json()
        if (wikiData.pages) {
          wikiData.pages.forEach((p: { key?: string; title: string; description?: string; excerpt?: string }) => {
            const slug = p.key || p.title.replace(/ /g, '_')
            results.push({
              title: p.title,
              url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(slug)}`,
              snippet: p.description || p.excerpt || '',
              source: 'wikipedia',
            })
          })
        }
      } catch {
        // Wikipedia falhou, continuar
      }

      results.push(
        {
          title: `Pesquisar no Google: ${webSearchQuery}`,
          url: `https://www.google.com/search?q=${searchQuery}`,
          snippet: 'Clique para abrir a pesquisa no Google',
          source: 'google',
        },
        {
          title: `Pesquisar no Bing: ${webSearchQuery}`,
          url: `https://www.bing.com/search?q=${searchQuery}`,
          snippet: 'Clique para abrir a pesquisa no Bing',
          source: 'bing',
        }
      )

      setWebSearchResults(results)
      toast({
        title: 'Pesquisa realizada',
        description: results.length > 2 ? 'Wikipedia + links para Google e Bing.' : 'Links para Google e Bing.',
      })
    } catch (error: any) {
      toast({ title: 'Erro na pesquisa', description: error.message, variant: 'destructive' })
    } finally {
      setIsSearchingWeb(false)
    }
  }

  const handleJurisprudenciaSearch = () => {
    if (!jurisprudenciaQuery.trim()) {
      toast({ title: 'Campo vazio', description: 'Digite o termo para pesquisar', variant: 'destructive' })
      return
    }
    const q = encodeURIComponent(jurisprudenciaQuery.trim())
    window.open(`https://www.jusbrasil.com.br/busca?q=${q}`, '_blank')
    window.open(`https://www.lexml.gov.br/urn/search?q=${q}`, '_blank')
    toast({
      title: 'Pesquisa aberta',
      description: 'Jusbrasil e LexML abertos em novas abas.',
    })
  }

  const handleCriarGrupo = () => {
    if (!novoGrupoNome.trim()) {
      toast({ title: 'Nome vazio', description: 'Digite um nome para o grupo', variant: 'destructive' })
      return
    }
    const docIds = documentos.map((_, i) => `doc-${i}`)
    const modIds = modelos.map((_, i) => `mod-${i}`)
    setGrupos((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        nome: novoGrupoNome.trim(),
        documentoIds: docIds,
        modeloIds: modIds,
        createdAt: new Date().toISOString(),
      },
    ])
    setNovoGrupoNome('')
    toast({ title: 'Grupo criado', description: `"${novoGrupoNome.trim()}" com ${docIds.length} docs e ${modIds.length} modelos.` })
  }

  const handleAtMenuSelect = (option: string) => {
    setInput((prev) => prev.slice(0, -1) + option + ' ')
    setShowAtMenu(false)
  }

  const handleSlashMenuSelect = (option: string) => {
    setInput((prev) => prev.slice(0, -1) + option)
    setShowSlashMenu(false)
  }

  const atMenuOptions = [
    { label: 'Documentos', value: '@documentos' },
    { label: 'Modelos', value: '@modelos' },
    { label: 'Jurisprudência', value: '@jurisprudencia' },
    { label: 'Web', value: '@web' },
  ]

  const slashMenuOptions = [
    { label: 'Melhorar texto', value: '/melhorar' },
    { label: 'Adicionar fundamentação', value: '/fundamentar' },
    { label: 'Reescrever', value: '/reescrever' },
    { label: 'Expandir', value: '/expandir' },
    { label: 'Resumir', value: '/resumir' },
    { label: 'Corrigir gramática', value: '/corrigir' },
    { label: 'Adicionar citação', value: '/citação' },
    { label: 'Formalizar linguagem', value: '/formalizar' },
    { label: 'Adicionar conclusão', value: '/conclusão' },
    { label: 'Simplificar', value: '/simplificar' },
    { label: 'Analisar', value: '/analisar' },
    { label: 'Explicar trecho', value: '/explicar' },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-card">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full min-h-0 flex-col overflow-hidden">
        <TabsList className="h-auto shrink-0 w-full flex-wrap justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-muted/40 p-2">
          <TabsTrigger
            value="chat"
            className="gap-1.5 data-[state=active]:bg-fenix-navy/15 data-[state=active]:text-fenix-navy data-[state=active]:shadow-none dark:data-[state=active]:bg-fenix-purple-dark/25 dark:data-[state=active]:text-fenix-purple-light"
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Docs
          </TabsTrigger>
          <TabsTrigger value="modelos" className="gap-1.5">
            <FileCode className="h-4 w-4" />
            Modelos
          </TabsTrigger>
          <TabsTrigger value="jurisprudencia" className="gap-1.5">
            <Scale className="h-4 w-4" />
            Juris
          </TabsTrigger>
          <TabsTrigger value="web" className="gap-1.5">
            <Globe className="h-4 w-4" />
            Web
          </TabsTrigger>
          <TabsTrigger value="biblioteca" className="gap-1.5">
            <Library className="h-4 w-4" />
            Biblio
          </TabsTrigger>
          <TabsTrigger value="bibliotecarios" className="gap-1.5">
            <Users className="h-4 w-4" />
            Grupos
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="shrink-0 border-b border-border bg-gradient-to-br from-fenix-navy/5 to-fenix-purple-dark/5 px-4 py-3 dark:from-fenix-navy/10 dark:to-fenix-purple-dark/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fenix-purple-dark/20 to-fenix-purple-light/20 text-fenix-purple-dark dark:text-fenix-purple-light">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Assistente IA</h3>
                <p className="text-xs text-muted-foreground">
                  Modelo: {AI_MODEL} · <kbd className="rounded border px-1 font-mono text-[10px]">@</kbd> recursos ·{' '}
                  <kbd className="rounded border px-1 font-mono text-[10px]">/</kbd> prompts
                </p>
              </div>
            </div>
          </div>

          <div
            ref={messagesContainerRef}
            className="messages-container min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <MessageSquare className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Comece uma conversa</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use / para prompts rápidos (melhorar, fundamentar, resumir...)
                </p>
              </div>
            )}
            {messages.map((message) => {
              const canApply =
                !readOnly &&
                message.role === 'assistant' &&
                message.userPrompt &&
                promptDeveAplicar(message.userPrompt) &&
                hasApplicableHtml(message.content)
              return (
                <div
                  key={message.id}
                  className={cn('flex min-w-0', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'min-w-0 max-w-[90%] shrink rounded-xl px-4 py-3',
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white'
                        : 'border border-border bg-muted/50'
                    )}
                  >
                    <p className="break-words whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">
                      {message.content}
                    </p>
                    {canApply && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 border-fenix-purple-dark/30 bg-transparent text-fenix-purple-dark hover:bg-fenix-purple-dark/10 dark:border-fenix-purple-light/40 dark:text-fenix-purple-light dark:hover:bg-fenix-purple-dark/20"
                        onClick={() => handleApplyContent(message.content)}
                      >
                        Aplicar no Editor
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-fenix-purple-dark dark:text-fenix-purple-light" />
                  <span className="text-sm text-muted-foreground">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="relative shrink-0 border-t border-border bg-card p-4">
            {showAtMenu && (
              <div className="absolute bottom-full left-4 right-4 z-10 mb-2 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
                {atMenuOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted"
                    onClick={() => handleAtMenuSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            {showSlashMenu && (
              <div className="absolute bottom-full left-4 right-4 z-10 mb-2 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
                {slashMenuOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted"
                    onClick={() => handleSlashMenuSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex min-w-0 shrink-0 gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                  if (e.key === 'Escape') {
                    setShowAtMenu(false)
                    setShowSlashMenu(false)
                  }
                }}
                placeholder="Mensagem... (@ recursos, / prompts)"
                className="min-w-0 flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isGenerating}
                className="bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white hover:opacity-95"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Documentos Tab */}
        <TabsContent value="documentos" className="m-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground">Documentos</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Adicione textos de referência (.txt, .html). A IA usará como contexto.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => {
                  const el = document.createElement('input')
                  el.type = 'file'
                  el.multiple = true
                  el.accept = '.txt,.html,.md'
                  el.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, 'documentos')
                  el.click()
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Adicionar Documentos
              </Button>
            </div>
            <div className="space-y-2">
              {documentos.map((file, index) => (
                <Card key={index}>
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-fenix-purple-dark dark:text-fenix-purple-light" />
                      <span className="truncate text-sm">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDocumentos((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Modelos Tab */}
        <TabsContent value="modelos" className="m-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground">Modelos</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Adicione teses modelo (.txt, .html) para a IA imitar o estilo.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => {
                  const el = document.createElement('input')
                  el.type = 'file'
                  el.multiple = true
                  el.accept = '.txt,.html,.md'
                  el.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, 'modelos')
                  el.click()
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Adicionar Modelos
              </Button>
            </div>
            <div className="space-y-2">
              {modelos.map((file, index) => (
                <Card key={index}>
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <FileCode className="h-4 w-4 shrink-0 text-fenix-purple-dark dark:text-fenix-purple-light" />
                      <span className="truncate text-sm">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setModelos((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Jurisprudência Tab */}
        <TabsContent value="jurisprudencia" className="m-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground">Jurisprudência</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Pesquise em Jusbrasil e LexML (abre em nova aba)
              </p>
              <Input
                placeholder="Ex: Responsabilidade civil danos morais"
                value={jurisprudenciaQuery}
                onChange={(e) => setJurisprudenciaQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJurisprudenciaSearch()}
                className="mt-3"
              />
              <Button
                size="sm"
                className="mt-2 w-full bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light text-white"
                onClick={handleJurisprudenciaSearch}
              >
                <Scale className="mr-2 h-4 w-4" />
                Pesquisar Jusbrasil + LexML
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Web Tab */}
        <TabsContent value="web" className="m-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground">Pesquisa Web</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Wikipedia + links para Google e Bing
              </p>
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Digite sua pesquisa..."
                  value={webSearchQuery}
                  onChange={(e) => setWebSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleWebSearch()}
                  className="min-w-0 flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleWebSearch}
                  disabled={!webSearchQuery.trim() || isSearchingWeb}
                  className="shrink-0"
                >
                  {isSearchingWeb ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {webSearchResults.length === 0 && !isSearchingWeb && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma pesquisa realizada ainda
                </p>
              )}
              {isSearchingWeb && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-fenix-purple-dark dark:text-fenix-purple-light" />
                  <span className="text-sm text-muted-foreground">Pesquisando...</span>
                </div>
              )}
              {webSearchResults.map((result, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <h4 className="font-semibold text-sm">{result.title}</h4>
                    {result.snippet && (
                      <p className="mt-1 text-xs text-muted-foreground">{result.snippet}</p>
                    )}
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 text-xs text-fenix-purple-dark hover:underline dark:text-fenix-purple-light"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {result.source === 'wikipedia' ? 'Wikipedia' : result.url}
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Biblioteca Tab */}
        <TabsContent value="biblioteca" className="m-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Biblioteca</h3>
            <p className="text-xs text-muted-foreground">Visão geral dos recursos disponíveis</p>
            <div className="space-y-2">
              <Card
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => setActiveTab('documentos')}
              >
                <CardContent className="flex items-center justify-between p-3">
                  <span className="text-sm font-medium">Documentos</span>
                  <span className="text-xs text-muted-foreground">{documentos.length} arquivo(s)</span>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => setActiveTab('modelos')}
              >
                <CardContent className="flex items-center justify-between p-3">
                  <span className="text-sm font-medium">Modelos</span>
                  <span className="text-xs text-muted-foreground">{modelos.length} arquivo(s)</span>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => setActiveTab('web')}
              >
                <CardContent className="flex items-center justify-between p-3">
                  <span className="text-sm font-medium">Pesquisas Web</span>
                  <span className="text-xs text-muted-foreground">{webSearchResults.length} resultado(s)</span>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Grupos Tab */}
        <TabsContent value="bibliotecarios" className="m-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Grupos</h3>
            <p className="text-xs text-muted-foreground">
              Salve o conjunto atual de docs/modelos para casos recorrentes
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Nome do grupo"
                value={novoGrupoNome}
                onChange={(e) => setNovoGrupoNome(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCriarGrupo()}
              />
              <Button size="sm" onClick={handleCriarGrupo} disabled={!novoGrupoNome.trim()}>
                Criar
              </Button>
            </div>
            <div className="space-y-2">
              {grupos.map((g) => (
                <Card key={g.id}>
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium text-sm">{g.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.documentoIds.length} docs, {g.modeloIds.length} modelos
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setGrupos((prev) => prev.filter((x) => x.id !== g.id))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
