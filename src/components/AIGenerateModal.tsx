import { useState, useRef } from 'react'
import { useTeses, useCreateTese } from '@/hooks/useTeses'
import { useAuth } from '@/hooks/useAuth'
import { generateTeseWithAI, processProcessoFile } from '@/lib/openai'
import { generateIdentificador } from '@/lib/generateIdentificador'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Sparkles, FileText, Loader2, Upload, X } from 'lucide-react'
import type { TeseInsert } from '@/types/supabase'

interface AIGenerateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AREAS_DISPONIVEIS = [
  'Trabalhista',
  'Reestruturação',
  'Societário e Contratos',
  'Distressed Deals',
  'Cível',
]

export function AIGenerateModal({ open, onOpenChange }: AIGenerateModalProps) {
  const { user } = useAuth()
  const [processoFile, setProcessoFile] = useState<File | null>(null)
  const [processoContent, setProcessoContent] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [selectedTeses, setSelectedTeses] = useState<Set<string>>(new Set())
  const [area, setArea] = useState<string>('')
  const [tipoTese, setTipoTese] = useState<string>('Consultivo')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<{
    titulo: string
    descricao: string
    texto_conteudo: string
    assuntos: string[]
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const createMutation = useCreateTese()

  // Buscar teses existentes para seleção
  const { data: tesesData } = useTeses({ page: 1, pageSize: 100 })

  const handleProcessoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProcessoFile(file)
      try {
        const content = await processProcessoFile(file)
        setProcessoContent(content.substring(0, 5000)) // Limitar tamanho
        toast({
          title: 'Processo carregado',
          description: 'O conteúdo do processo foi extraído com sucesso.',
        })
      } catch (error: any) {
        toast({
          title: 'Erro ao processar arquivo',
          description: error.message,
          variant: 'destructive',
        })
      }
    }
  }

  const toggleTeseSelection = (teseId: string) => {
    const newSelected = new Set(selectedTeses)
    if (newSelected.has(teseId)) {
      newSelected.delete(teseId)
    } else {
      newSelected.add(teseId)
    }
    setSelectedTeses(newSelected)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt obrigatório',
        description: 'Digite o que você precisa na tese',
        variant: 'destructive',
      })
      return
    }

    setGenerating(true)
    setPreview(null)

    try {
      // Buscar teses selecionadas
      const tesesExistentes =
        tesesData?.data
          .filter((t) => selectedTeses.has(t.id))
          .map((t) => ({
            titulo: t.titulo,
            descricao: t.descricao,
            texto_conteudo: t.texto_conteudo,
          })) || []

      // Gerar tese com IA
      const resultado = await generateTeseWithAI({
        prompt,
        processoContent: processoContent || undefined,
        tesesExistentes: tesesExistentes.length > 0 ? tesesExistentes : undefined,
        area: area || undefined,
      })

      setPreview(resultado)
      toast({
        title: 'Tese gerada!',
        description: 'Revise o conteúdo antes de salvar.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao gerar tese',
        description: error.message || 'Ocorreu um erro ao gerar a tese com IA',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!preview) return

    try {
      // Usar user do useAuth hook em vez de chamar getUser() diretamente

      const identificador = await generateIdentificador()

      const teseData: TeseInsert = {
        identificador,
        titulo: preview.titulo,
        descricao: preview.descricao,
        area: area || null,
        assuntos: preview.assuntos && preview.assuntos.length > 0 
          ? preview.assuntos 
          : null,
        texto_conteudo: preview.texto_conteudo,
        user_id: user?.id || null,
        tipo_tese: tipoTese || 'Consultivo',
      }

      await createMutation.mutateAsync(teseData)

      toast({
        title: 'Tese salva com sucesso!',
        description: `"${preview.titulo}" foi criada e salva no banco de dados.`,
      })

      // Limpar formulário
      setProcessoFile(null)
      setProcessoContent('')
      setPrompt('')
      setSelectedTeses(new Set())
      setArea('')
      setTipoTese('Consultivo')
      setPreview(null)
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar a tese',
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    if (!generating) {
      setProcessoFile(null)
      setProcessoContent('')
      setPrompt('')
      setSelectedTeses(new Set())
      setArea('')
      setTipoTese('Consultivo')
      setPreview(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Tese com Inteligência Artificial
          </DialogTitle>
          <DialogDescription>
            Descreva o que você precisa e a IA criará uma tese jurídica profissional. Você pode
            fazer upload de um processo e selecionar teses existentes como referência.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload de Processo */}
          <div className="space-y-2">
            <Label>Upload de Processo (Opcional)</Label>
            {!processoFile ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Carregar Processo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleProcessoFileSelect}
                  className="hidden"
                />
                <span className="text-xs" style={{ color: '#101f2e' }}>
                  PDF, Word ou arquivo de texto
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{processoFile.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setProcessoFile(null)
                    setProcessoContent('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Área */}
          <div className="grid gap-2">
            <Label htmlFor="area-ai">Área Jurídica (Opcional)</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger id="area-ai">
                <SelectValue placeholder="Selecione uma área" />
              </SelectTrigger>
              <SelectContent>
                {AREAS_DISPONIVEIS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo */}
          <div className="grid gap-2">
            <Label htmlFor="tipo-tese-ai">Tipo</Label>
            <Select value={tipoTese} onValueChange={setTipoTese}>
              <SelectTrigger id="tipo-tese-ai">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tese">Tese</SelectItem>
                <SelectItem value="Consultivo">Consultivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Teses Existentes */}
          {tesesData && tesesData.data.length > 0 && (
            <div className="space-y-2">
              <Label>Usar Teses Existentes como Referência (Opcional)</Label>
              <Card>
                <CardContent className="p-4 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {tesesData.data.slice(0, 10).map((tese) => (
                      <div key={tese.id} className="flex items-start gap-2">
                        <Checkbox
                          checked={selectedTeses.has(tese.id)}
                          onCheckedChange={() => toggleTeseSelection(tese.id)}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{tese.titulo}</p>
                          {tese.descricao && (
                            <p className="text-xs" style={{ color: '#101f2e' }}>{tese.descricao}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Prompt */}
          <div className="grid gap-2">
            <Label htmlFor="prompt">
              Descreva o que você precisa <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="prompt"
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Ex: Preciso de uma tese sobre responsabilidade civil por danos morais em contratos de trabalho, com fundamentação na CLT e jurisprudência do TST..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </div>

          {/* Preview da Tese Gerada */}
          {preview && (
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{preview.titulo}</h3>
                  <p className="text-sm mt-1" style={{ color: '#101f2e' }}>{preview.descricao}</p>
                </div>
                <div className="max-h-64 overflow-y-auto border rounded p-3 bg-gray-50">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: preview.texto_conteudo }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={generating}>
            Cancelar
          </Button>
          {!preview ? (
            <Button type="button" onClick={handleGenerate} disabled={!prompt.trim() || generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Tese
                </>
              )}
            </Button>
          ) : (
            <Button type="button" onClick={handleSave}>
              <FileText className="mr-2 h-4 w-4" />
              Salvar Tese
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
