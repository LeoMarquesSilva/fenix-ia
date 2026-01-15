import { useState, useRef, useEffect } from 'react'
import mammoth from 'mammoth'
import { useCreateTese } from '@/hooks/useTeses'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Upload, FileText, Loader2 } from 'lucide-react'
import type { TeseInsert } from '@/types/supabase'
import { generateIdentificador } from '@/lib/generateIdentificador'
import { generateAssuntosEDescricao } from '@/lib/openai'

interface UploadWordModalProps {
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

export function UploadWordModal({ open, onOpenChange }: UploadWordModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [formData, setFormData] = useState({
    identificador: '',
    titulo: '',
    descricao: '',
    area: '',
    assuntos: '',
  })
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const createMutation = useCreateTese()
  const { user } = useAuth()

  // Gerar identificador automático quando o modal abrir
  useEffect(() => {
    if (open) {
      generateIdentificador().then((id) => {
        setFormData((prev) => ({ ...prev, identificador: id }))
      })
    }
  }, [open])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc')) {
        setFile(selectedFile)
        // Tentar extrair título do nome do arquivo
        const fileName = selectedFile.name.replace(/\.(docx?|DOCX?)$/i, '')
        if (!formData.titulo) {
          setFormData((prev) => ({ ...prev, titulo: fileName }))
        }
        
        // Não gerar automaticamente aqui - aguardar usuário preencher título e área
      } else {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione um arquivo .docx ou .doc',
          variant: 'destructive',
        })
      }
    }
  }

  const generateAIFields = async (file: File, titulo?: string, area?: string) => {
    const currentTitulo = titulo || formData.titulo
    const currentArea = area || formData.area
    
    if (!currentTitulo || !currentArea) {
      return
    }

    setIsGeneratingAI(true)
    setAiGenerated(false)

    try {
      // Processar arquivo Word primeiro
      const htmlContent = await processWordFile(file)
      
      // Gerar assuntos e descrição com IA
      const aiResult = await generateAssuntosEDescricao({
        titulo: currentTitulo,
        area: currentArea,
        conteudoHTML: htmlContent,
      })

      setFormData((prev) => ({
        ...prev,
        descricao: aiResult.descricao,
        assuntos: aiResult.assuntos.join(', '),
      }))
      setAiGenerated(true)

      toast({
        title: 'Campos gerados com IA',
        description: 'Assuntos e descrição foram preenchidos automaticamente. Revise e ajuste se necessário, depois clique em "Criar Tese".',
        duration: 5000,
      })
    } catch (error: any) {
      console.error('Erro ao gerar com IA:', error)
      toast({
        title: 'Erro ao gerar com IA',
        description: 'Não foi possível gerar os campos automaticamente. Preencha manualmente.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (droppedFile.name.endsWith('.docx') || droppedFile.name.endsWith('.doc')) {
        setFile(droppedFile)
        const fileName = droppedFile.name.replace(/\.(docx?|DOCX?)$/i, '')
        if (!formData.titulo) {
          setFormData((prev) => ({ ...prev, titulo: fileName }))
        }
      } else {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione um arquivo .docx ou .doc',
          variant: 'destructive',
        })
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const processWordFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          
          // Configurar opções do mammoth para preservar melhor a formatação
          const result = await mammoth.convertToHtml(
            { arrayBuffer },
            {
              styleMap: [
                // Mapear estilos do Word para HTML preservando formatação
                "p[style-name='Heading 1'] => h1:fresh",
                "p[style-name='Heading 2'] => h2:fresh",
                "p[style-name='Heading 3'] => h3:fresh",
                "p[style-name='Heading 4'] => h4:fresh",
                "p[style-name='Title'] => h1:fresh",
                "p[style-name='Subtitle'] => h2:fresh",
                // Preservar formatação inline
                "r[style-name='Strong'] => strong",
                "r[style-name='Emphasis'] => em",
              ],
              includeDefaultStyleMap: true,
              // Preservar formatação inline (negrito, itálico, cores, etc)
              convertImage: mammoth.images.imgElement((image) => {
                return image.read("base64").then((imageBuffer) => {
                  return {
                    src: "data:" + image.contentType + ";base64," + imageBuffer,
                  }
                })
              }),
            }
          )
          
          // Log para debug
          console.log('HTML gerado pelo mammoth:', result.value)
          if (result.messages && result.messages.length > 0) {
            console.log('Mensagens do mammoth:', result.messages)
          }
          
          resolve(result.value)
        } catch (error) {
          console.error('Erro ao processar Word:', error)
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Erro',
        description: 'Selecione um arquivo Word',
        variant: 'destructive',
      })
      return
    }

    // Validações
    if (!formData.titulo.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Título da Tese é obrigatório',
        variant: 'destructive',
      })
      return
    }

    if (!formData.area) {
      toast({
        title: 'Campo obrigatório',
        description: 'Área é obrigatória',
        variant: 'destructive',
      })
      return
    }

    // Validar que descrição e assuntos foram preenchidos (pela IA ou manualmente)
    if (!formData.descricao.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Descrição é obrigatória. Aguarde a IA gerar ou preencha manualmente.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.identificador) {
      // Gerar identificador se não existir
      const newId = await generateIdentificador()
      setFormData((prev) => ({ ...prev, identificador: newId }))
    }

    setProcessing(true)

    try {
      // Processar arquivo Word
      const htmlContent = await processWordFile(file)

      // Usar user do useAuth hook em vez de chamar getUser() diretamente

      // Processar assuntos (separados por vírgula)
      const assuntosArray = formData.assuntos
        ? formData.assuntos
            .split(',')
            .map((a) => a.trim())
            .filter((a) => a.length > 0)
        : null

      // Criar tese
      const teseData: TeseInsert = {
        identificador: formData.identificador,
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        area: formData.area || null,
        assuntos: assuntosArray,
        texto_conteudo: htmlContent,
        user_id: user?.id || null,
      }

      await createMutation.mutateAsync(teseData)

      toast({
        title: 'Tese criada com sucesso!',
        description: `"${formData.titulo}" foi adicionada ao banco de dados.`,
      })

      // Limpar formulário
      setFile(null)
      const newId = await generateIdentificador()
      setFormData({
        identificador: newId,
        titulo: '',
        descricao: '',
        area: '',
        assuntos: '',
      })
      setAiGenerated(false)
      onOpenChange(false)
    } catch (error: any) {
      console.error('Erro ao processar arquivo:', error)
      toast({
        title: 'Erro ao processar arquivo',
        description: error.message || 'Ocorreu um erro ao processar o arquivo Word',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleClose = () => {
    if (!processing && !isGeneratingAI) {
      setFile(null)
      generateIdentificador().then((id) => {
        setFormData({
          identificador: id,
          titulo: '',
          descricao: '',
          area: '',
          assuntos: '',
        })
        setAiGenerated(false)
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Só permitir fechar se não estiver processando ou gerando com IA
      if (!isOpen && !processing && !isGeneratingAI) {
        handleClose()
      } else if (isOpen) {
        // Permitir abrir normalmente
        onOpenChange(true)
      }
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload de Tese (Word)</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Word (.docx) para criar uma nova tese. O conteúdo será
            extraído automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload de arquivo */}
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center hover:border-primary"
              style={{ borderColor: '#101f2e' }}
            >
              <FileText className="mb-4 h-12 w-12" style={{ color: '#101f2e' }} />
              <p className="mb-2 text-sm" style={{ color: '#101f2e' }}>
                Arraste o arquivo Word aqui ou clique para selecionar
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Selecionar Arquivo Word
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs" style={{ color: '#101f2e' }}>
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  disabled={processing}
                >
                  Remover
                </Button>
              </div>
            </div>
          )}

          {/* Formulário */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="titulo">
                Título da Tese <span className="text-red-500">*</span>
              </Label>
              <Input
                id="titulo"
                placeholder="Digite o título da tese"
                value={formData.titulo}
                onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="area">
                Área <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.area} 
                onValueChange={async (value) => {
                  setFormData((prev) => ({ ...prev, area: value }))
                  // Se tiver arquivo e título, gerar campos com IA
                  if (file && formData.titulo.trim() && value) {
                    await generateAIFields(file, formData.titulo, value)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma área" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS_DISPONIVEIS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campos gerados pela IA */}
            {(isGeneratingAI || aiGenerated || formData.descricao || formData.assuntos) && (
              <>
                {isGeneratingAI && (
                  <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700">Gerando descrição e assuntos com IA...</span>
                  </div>
                )}

                {aiGenerated && !isGeneratingAI && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                    <span className="text-sm text-green-700">✓ Campos gerados com IA. Revise e ajuste se necessário.</span>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="descricao">
                    Descrição Resumida {aiGenerated && <span className="text-xs" style={{ color: '#101f2e' }}>(gerada por IA)</span>}
                  </Label>
                  <Input
                    id="descricao"
                    placeholder="Será gerada automaticamente pela IA"
                    value={formData.descricao}
                    onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                    disabled={isGeneratingAI}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="assuntos">
                    Assuntos {aiGenerated && <span className="text-xs" style={{ color: '#101f2e' }}>(gerados por IA)</span>}
                  </Label>
                  <Input
                    id="assuntos"
                    placeholder="Serão gerados automaticamente pela IA"
                    value={formData.assuntos}
                    onChange={(e) => setFormData((prev) => ({ ...prev, assuntos: e.target.value }))}
                    disabled={isGeneratingAI}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={processing}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleUpload} disabled={!file || processing}>
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Criar Tese
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
