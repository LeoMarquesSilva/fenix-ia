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
} from 'lucide-react'
import type { Editor } from '@tiptap/react'
import type { Tese } from '@/types/supabase'

interface EditorAISidebarProps {
  editor: Editor | null
  tese: Tese | null
  onUpdateContent?: (content: string) => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

export function EditorAISidebar({ editor, tese, onUpdateContent }: EditorAISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [documentos, setDocumentos] = useState<File[]>([])
  const [modelos, setModelos] = useState<File[]>([])
  const [jurisprudencia, setJurisprudencia] = useState<string[]>([])
  const [webSearchQuery, setWebSearchQuery] = useState('')
  const [webSearchResults, setWebSearchResults] = useState<WebSearchResult[]>([])
  const [isSearchingWeb, setIsSearchingWeb] = useState(false)
  const [showAtMenu, setShowAtMenu] = useState(false)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Detectar @ e / no input
  useEffect(() => {
    const lastChar = input[input.length - 1]
    if (lastChar === '@') {
      setShowAtMenu(true)
    } else if (lastChar === '/') {
      setShowSlashMenu(true)
    } else {
      setShowAtMenu(false)
      setShowSlashMenu(false)
    }
  }, [input])

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
      // Obter conteúdo atual do editor
      const editorContent = editor?.getHTML() || ''
      
      // Processar documentos
      const documentosContent = await Promise.all(
        documentos.map(async (file) => {
          const text = await file.text()
          return { name: file.name, content: text.substring(0, 2000) }
        })
      )

      // Construir contexto
      const context = `
Tese atual: ${tese?.titulo || 'Sem título'}
Área: ${tese?.area || 'Não especificada'}
Conteúdo atual da tese:
${editorContent.substring(0, 3000)}

${documentosContent.length > 0 ? `\nDocumentos anexados:\n${documentosContent.map(d => `${d.name}: ${d.content}`).join('\n\n')}` : ''}
${webSearchResults.length > 0 ? `\nPesquisas web recentes:\n${webSearchResults.map(r => `${r.title}: ${r.snippet}`).join('\n\n')}` : ''}
`

      // Chamar IA
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `Você é um assistente jurídico especializado em direito brasileiro. 
Ajude o usuário a melhorar e editar teses jurídicas. 
Forneça sugestões, correções e melhorias no conteúdo jurídico.
Seja objetivo, preciso e use linguagem jurídica adequada.
Quando o usuário pedir para aplicar mudanças, forneça o HTML formatado.`,
            },
            {
              role: 'user',
              content: `${context}\n\nInstrução do usuário: ${currentInput}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao chamar IA')
      }

      const data = await response.json()
      const assistantContent = data.choices[0]?.message?.content || 'Erro ao gerar resposta'

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Se a resposta contém HTML, oferecer para aplicar
      if (assistantContent.includes('<') && assistantContent.includes('>')) {
        toast({
          title: 'Conteúdo gerado',
          description: 'A resposta contém HTML. Use o botão "Aplicar" se quiser inserir no editor.',
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

  const handleApplyContent = (content: string) => {
    // Extrair HTML da resposta
    const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/) || content.match(/<[^>]+>/)
    if (htmlMatch && editor) {
      const html = htmlMatch[1] || content
      editor.commands.setContent(html)
      if (onUpdateContent) {
        onUpdateContent(html)
      }
      toast({
        title: 'Conteúdo aplicado',
        description: 'O conteúdo foi inserido no editor.',
      })
    } else if (editor) {
      // Se não tem HTML, inserir como texto formatado
      editor.commands.insertContent(`<p>${content}</p>`)
      toast({
        title: 'Conteúdo inserido',
        description: 'O texto foi inserido no editor.',
      })
    }
  }

  const handleFileUpload = (files: FileList | null, type: 'documentos' | 'modelos') => {
    if (!files) return
    const fileArray = Array.from(files)
    if (type === 'documentos') {
      setDocumentos((prev) => [...prev, ...fileArray])
    } else {
      setModelos((prev) => [...prev, ...fileArray])
    }
    toast({
      title: 'Arquivo(s) adicionado(s)',
      description: `${fileArray.length} arquivo(s) adicionado(s) com sucesso.`,
    })
  }

  const handleWebSearch = async () => {
    if (!webSearchQuery.trim()) {
      toast({
        title: 'Campo vazio',
        description: 'Digite algo para pesquisar',
        variant: 'destructive',
      })
      return
    }

    setIsSearchingWeb(true)
    try {
      // Usar DuckDuckGo Instant Answer API (gratuita, sem API key)
      const searchQuery = encodeURIComponent(webSearchQuery)
      
      // Tentar buscar com DuckDuckGo
      try {
        const response = await fetch(`https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1&skip_disambig=1`)
        const data = await response.json()
        
        const results: WebSearchResult[] = []
        
        // Adicionar resultado principal se existir
        if (data.AbstractText) {
          results.push({
            title: data.Heading || webSearchQuery,
            url: data.AbstractURL || `https://duckduckgo.com/?q=${searchQuery}`,
            snippet: data.AbstractText,
          })
        }
        
        // Adicionar resultados relacionados
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
          data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
            if (topic.Text) {
              results.push({
                title: topic.Text.split(' - ')[0] || webSearchQuery,
                url: topic.FirstURL || `https://duckduckgo.com/?q=${searchQuery}`,
                snippet: topic.Text,
              })
            }
          })
        }
        
        if (results.length > 0) {
          setWebSearchResults((prev) => [...prev, ...results])
          toast({
            title: 'Pesquisa concluída',
            description: `${results.length} resultado(s) encontrado(s).`,
          })
        } else {
          // Fallback: resultado genérico
          const fallbackResult: WebSearchResult = {
            title: `Pesquisa: ${webSearchQuery}`,
            url: `https://duckduckgo.com/?q=${searchQuery}`,
            snippet: `Clique para pesquisar "${webSearchQuery}" no DuckDuckGo e encontrar informações atualizadas.`,
          }
          setWebSearchResults((prev) => [...prev, fallbackResult])
          toast({
            title: 'Pesquisa realizada',
            description: 'Resultado disponível. Clique no link para ver mais.',
          })
        }
      } catch (apiError) {
        // Fallback se API falhar
        const fallbackResult: WebSearchResult = {
          title: `Pesquisa: ${webSearchQuery}`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(webSearchQuery)}`,
          snippet: `Pesquise "${webSearchQuery}" no DuckDuckGo para encontrar informações atualizadas sobre este tópico jurídico.`,
        }
        setWebSearchResults((prev) => [...prev, fallbackResult])
        toast({
          title: 'Pesquisa realizada',
          description: 'Link de pesquisa gerado. Clique para ver resultados.',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Erro na pesquisa',
        description: error.message || 'Erro ao pesquisar na web',
        variant: 'destructive',
      })
    } finally {
      setIsSearchingWeb(false)
    }
  }

  const handleAtMenuSelect = (option: string) => {
    const withoutAt = input.slice(0, -1)
    setInput(`${withoutAt}${option} `)
    setShowAtMenu(false)
  }

  const handleSlashMenuSelect = (option: string) => {
    const withoutSlash = input.slice(0, -1)
    setInput(`${withoutSlash}${option}`)
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
  ]

  return (
    <div className="flex h-full flex-col bg-white">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
        <TabsList className="!flex w-full flex-wrap rounded-none border-b shrink-0 overflow-x-auto !h-auto min-h-[48px] !bg-white !p-1">
          <TabsTrigger value="chat" className="text-xs flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Docs</span>
          </TabsTrigger>
          <TabsTrigger value="modelos" className="text-xs flex items-center gap-1">
            <FileCode className="h-4 w-4" />
            <span>Modelos</span>
          </TabsTrigger>
          <TabsTrigger value="jurisprudencia" className="text-xs flex items-center gap-1">
            <Scale className="h-4 w-4" />
            <span>Juris</span>
          </TabsTrigger>
          <TabsTrigger value="web" className="text-xs flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span>Web</span>
          </TabsTrigger>
          <TabsTrigger value="biblioteca" className="text-xs flex items-center gap-1">
            <Library className="h-4 w-4" />
            <span>Biblio</span>
          </TabsTrigger>
          <TabsTrigger value="bibliotecarios" className="text-xs flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Grupos</span>
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col !m-0 p-0 h-full">
          <div className="p-4 border-b shrink-0" style={{ borderColor: '#101f2e', backgroundColor: '#101f2e' }}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <div>
                <h3 className="font-semibold text-sm text-white">Assistente IA</h3>
                <p className="text-xs" style={{ color: '#101f2e' }}>Digite "@" para recursos ou "/" para prompts</p>
              </div>
            </div>
          </div>
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 messages-container"
            style={{ minHeight: 0, maxHeight: '100%', backgroundColor: '#101f2e' }}
          >
            {messages.length === 0 && (
              <div className="text-center text-sm mt-8 text-white">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-white" />
                <p>Comece uma conversa com a IA</p>
                <p className="text-xs mt-1">Dica: digite "@" para acessar recursos</p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 break-words word-wrap ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                      : 'text-white border'
                  }`}
                  style={message.role === 'assistant' ? { backgroundColor: '#101f2e', borderColor: '#101f2e' } : {}}
                >
                  <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</p>
                  {message.role === 'assistant' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 text-xs border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200"
                      onClick={() => handleApplyContent(message.content)}
                    >
                      Aplicar no Editor
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="rounded-lg p-3 border" style={{ backgroundColor: '#101f2e', borderColor: '#101f2e' }}>
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t shrink-0 relative" style={{ borderColor: '#101f2e', backgroundColor: '#101f2e' }}>
            {/* Menu @ */}
            {showAtMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {atMenuOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm"
                    className="text-white"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#101f2e'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => handleAtMenuSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            {/* Menu / */}
            {showSlashMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {slashMenuOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm"
                    className="text-white"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#101f2e'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => handleSlashMenuSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
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
                placeholder="Digite sua mensagem... (@ para recursos, / para prompts)"
                className="flex-1 text-white focus:border-purple-500 focus:ring-purple-500/20"
                style={{ backgroundColor: '#101f2e', borderColor: '#101f2e' }}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!input.trim() || isGenerating}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Documentos Tab */}
        <TabsContent value="documentos" className="flex-1 overflow-y-auto !m-0 p-4 min-h-0">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Documentos</h3>
              <p className="text-xs mb-4 text-white">
                Adicione documentos relevantes para contexto da tese
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, 'documentos')
                  input.click()
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Adicionar Documentos
              </Button>
            </div>
            <div className="space-y-2">
              {documentos.map((file, index) => (
                <Card key={index}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
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
        <TabsContent value="modelos" className="flex-1 overflow-y-auto !m-0 p-4 min-h-0">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Modelos</h3>
              <p className="text-xs mb-4 text-white">
                Adicione modelos para personalizar o estilo da IA
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, 'modelos')
                  input.click()
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Adicionar Modelos
              </Button>
            </div>
            <div className="space-y-2">
              {modelos.map((file, index) => (
                <Card key={index}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileCode className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
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
        <TabsContent value="jurisprudencia" className="flex-1 overflow-y-auto !m-0 p-4 min-h-0">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Jurisprudência</h3>
              <p className="text-xs mb-4 text-white">
                Pesquise jurisprudência usando linguagem natural
              </p>
              <Input
                placeholder="Ex: Responsabilidade civil danos morais..."
                className="mb-2"
              />
              <Button size="sm" className="w-full">
                <Scale className="h-4 w-4 mr-2" />
                Pesquisar
              </Button>
            </div>
            <div className="space-y-2">
              {jurisprudencia.length === 0 && (
                <p className="text-xs text-center py-4 text-white">
                  Nenhuma jurisprudência selecionada
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Web Tab */}
        <TabsContent value="web" className="flex-1 overflow-y-auto !m-0 p-4 min-h-0">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Pesquisa Web</h3>
              <p className="text-xs mb-4 text-white">
                Pesquise informações atualizadas em tempo real
              </p>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Digite sua pesquisa..."
                  value={webSearchQuery}
                  onChange={(e) => setWebSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleWebSearch()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleWebSearch}
                  disabled={!webSearchQuery.trim() || isSearchingWeb}
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
                <p className="text-xs text-center py-4 text-white">
                  Nenhuma pesquisa realizada ainda
                </p>
              )}
              {isSearchingWeb && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-white">Pesquisando...</span>
                </div>
              )}
              {webSearchResults.map((result, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <h4 className="font-semibold text-sm mb-1">{result.title}</h4>
                    <p className="text-xs mb-2 text-white">{result.snippet}</p>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      {result.url}
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Biblioteca Tab */}
        <TabsContent value="biblioteca" className="flex-1 overflow-y-auto !m-0 p-4 min-h-0">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Biblioteca</h3>
              <p className="text-xs mb-4 text-white">
                Recursos organizados e acessíveis
              </p>
            </div>
            <div className="space-y-2">
              <Card>
                <CardContent className="p-3">
                  <p className="text-sm font-medium">Documentos</p>
                  <p className="text-xs text-white">{documentos.length} arquivo(s)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-sm font-medium">Modelos</p>
                  <p className="text-xs text-white">{modelos.length} arquivo(s)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-sm font-medium">Pesquisas Web</p>
                  <p className="text-xs text-white">{webSearchResults.length} resultado(s)</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Bibliotecários Tab */}
        <TabsContent value="bibliotecarios" className="flex-1 overflow-y-auto !m-0 p-4 min-h-0">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Bibliotecários</h3>
              <p className="text-xs mb-4 text-white">
                Agrupe recursos para casos recorrentes
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Criar Grupo
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
