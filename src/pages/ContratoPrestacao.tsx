import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Loader2, Sparkles, Upload, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { generateIdentificador } from '@/lib/generateIdentificador'
import {
  generateContratoPrestacaoWithAI,
  type ContratoDocumentoInput,
} from '@/lib/contrato-ai'
import { useCreateTese, useMyPrivateContratos } from '@/hooks/useTeses'
import { useAuth } from '@/hooks/useAuth'

const MIME_TYPES_ACEITOS = ['application/pdf', 'image/png']

type DocumentoAnexado = { file: File; instrucaoUso: string }

type ContratoPreview = {
  titulo: string
  descricao: string
  texto_conteudo: string
}

export default function ContratoPrestacao() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createMutation = useCreateTese()
  const { data: contratosPrivados, isLoading: loadingContratos } =
    useMyPrivateContratos()

  const [contratante, setContratante] = useState('')
  const [documentoContratante, setDocumentoContratante] = useState('')
  const [enderecoContratante, setEnderecoContratante] = useState('')
  const [contratado, setContratado] = useState('')
  const [documentoContratado, setDocumentoContratado] = useState('')
  const [enderecoContratado, setEnderecoContratado] = useState('')
  const [objeto, setObjeto] = useState('')
  const [prazoVigencia, setPrazoVigencia] = useState('')
  const [valorFormaPagamento, setValorFormaPagamento] = useState('')
  const [multasPenalidades, setMultasPenalidades] = useState('')
  const [foro, setForo] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [documentos, setDocumentos] = useState<DocumentoAnexado[]>([])
  const [preview, setPreview] = useState<ContratoPreview | null>(null)
  const [generating, setGenerating] = useState(false)

  const documentosParaIA = useMemo<ContratoDocumentoInput[]>(
    () => documentos.map((d) => ({ file: d.file, instrucaoUso: d.instrucaoUso.trim() })),
    [documentos]
  )

  const handleAddFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
    if (!selected.length) return

    const invalid = selected.filter((f) => !MIME_TYPES_ACEITOS.includes(f.type))
    if (invalid.length > 0) {
      toast({
        title: 'Formato inválido',
        description: 'Envie apenas arquivos PNG ou PDF.',
        variant: 'destructive',
      })
    }
    const valid = selected.filter((f) => MIME_TYPES_ACEITOS.includes(f.type))
    if (valid.length > 0) {
      setDocumentos((prev) => [...prev, ...valid.map((file) => ({ file, instrucaoUso: '' }))])
    }
    event.target.value = ''
  }

  const validate = () => {
    if (contratante.trim().length < 3 || contratado.trim().length < 3) {
      toast({
        title: 'Partes obrigatórias',
        description: 'Preencha contratante e contratado.',
        variant: 'destructive',
      })
      return false
    }
    if (objeto.trim().length < 15) {
      toast({
        title: 'Objeto curto',
        description: 'Descreva melhor o objeto do contrato.',
        variant: 'destructive',
      })
      return false
    }
    if (!valorFormaPagamento.trim()) {
      toast({
        title: 'Valor e pagamento',
        description: 'Informe as condições de pagamento.',
        variant: 'destructive',
      })
      return false
    }
    if (!foro.trim()) {
      toast({
        title: 'Foro obrigatório',
        description: 'Informe o foro do contrato.',
        variant: 'destructive',
      })
      return false
    }
    const semInstrucao = documentos.find((d) => d.instrucaoUso.trim().length < 3)
    if (semInstrucao) {
      toast({
        title: 'Instrução por documento',
        description: 'Informe como cada anexo deve ser usado.',
        variant: 'destructive',
      })
      return false
    }
    return true
  }

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setGenerating(true)
    setPreview(null)
    try {
      const result = await generateContratoPrestacaoWithAI({
        contratante: contratante.trim(),
        documentoContratante: documentoContratante.trim(),
        enderecoContratante: enderecoContratante.trim(),
        contratado: contratado.trim(),
        documentoContratado: documentoContratado.trim(),
        enderecoContratado: enderecoContratado.trim(),
        objeto: objeto.trim(),
        prazoVigencia: prazoVigencia.trim(),
        valorFormaPagamento: valorFormaPagamento.trim(),
        multasPenalidades: multasPenalidades.trim(),
        foro: foro.trim(),
        observacoes: observacoes.trim(),
        documentos: documentosParaIA,
      })
      setPreview(result)
      toast({
        title: 'Contrato gerado',
        description: 'Revise o conteúdo antes de salvar.',
      })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao gerar contrato.'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!preview) return
    try {
      const identificador = await generateIdentificador()
      const created = await createMutation.mutateAsync({
        identificador,
        titulo: preview.titulo,
        descricao: preview.descricao,
        texto_conteudo: preview.texto_conteudo,
        tipo_tese: 'Contrato Privado - Prestação de Serviços',
        assuntos: ['Contrato', 'Prestação de Serviços', 'Privado'],
        user_id: user?.id || null,
      })
      toast({
        title: 'Contrato salvo',
        description: 'Contrato privado salvo com sucesso.',
      })
      navigate(`/teses/${created.id}`)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao salvar contrato.'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-full bg-muted/30 dark:bg-transparent">
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <PageHeader
          title="Contrato"
          description="Crie contrato de prestação de serviços com apoio de IA e mantenha-o privado nesta aba."
        />

        <Card className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Dados do contrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contratante">Contratante *</Label>
                  <Input id="contratante" value={contratante} onChange={(e) => setContratante(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-contratante">Documento contratante</Label>
                  <Input id="doc-contratante" value={documentoContratante} onChange={(e) => setDocumentoContratante(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="end-contratante">Endereço contratante</Label>
                  <Input id="end-contratante" value={enderecoContratante} onChange={(e) => setEnderecoContratante(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contratado">Contratado *</Label>
                  <Input id="contratado" value={contratado} onChange={(e) => setContratado(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-contratado">Documento contratado</Label>
                  <Input id="doc-contratado" value={documentoContratado} onChange={(e) => setDocumentoContratado(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="end-contratado">Endereço contratado</Label>
                  <Input id="end-contratado" value={enderecoContratado} onChange={(e) => setEnderecoContratado(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="objeto">Objeto do contrato *</Label>
                <Textarea id="objeto" value={objeto} onChange={(e) => setObjeto(e.target.value)} rows={4} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prazo">Prazo de vigência</Label>
                  <Input id="prazo" value={prazoVigencia} onChange={(e) => setPrazoVigencia(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor e forma de pagamento *</Label>
                  <Input id="valor" value={valorFormaPagamento} onChange={(e) => setValorFormaPagamento(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="multas">Multas e penalidades</Label>
                <Textarea id="multas" value={multasPenalidades} onChange={(e) => setMultasPenalidades(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foro">Foro *</Label>
                <Input id="foro" value={foro} onChange={(e) => setForo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="obs">Observações</Label>
                <Textarea id="obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Anexos (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Anexar PNG/PDF
                  </Button>
                  <input ref={fileInputRef} className="hidden" type="file" accept=".pdf,.png" multiple onChange={handleAddFiles} />
                </div>
                {documentos.length > 0 && (
                  <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                    {documentos.map((doc, index) => (
                      <div key={`${doc.file.name}-${index}`} className="space-y-2 rounded-md border bg-background p-3">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium">{doc.file.name}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setDocumentos((prev) => prev.filter((_, i) => i !== index))}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={doc.instrucaoUso}
                          onChange={(e) =>
                            setDocumentos((prev) =>
                              prev.map((x, i) => (i === index ? { ...x, instrucaoUso: e.target.value } : x))
                            )
                          }
                          rows={2}
                          placeholder="Como deseja utilizar este documento?"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar contrato
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {preview && (
          <Card className="mt-6 border-primary/20">
            <CardHeader>
              <CardTitle>Prévia do contrato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{preview.titulo}</h3>
                <p className="text-sm text-muted-foreground">{preview.descricao}</p>
              </div>
              <div className="max-h-[520px] overflow-y-auto rounded-md border bg-background p-4">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: preview.texto_conteudo }}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar e abrir editor
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6 border">
          <CardHeader>
            <CardTitle>Meus contratos privados</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingContratos && (
              <p className="text-sm text-muted-foreground">Carregando contratos...</p>
            )}
            {!loadingContratos &&
              (!contratosPrivados || contratosPrivados.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  Nenhum contrato privado salvo ainda.
                </p>
              )}
            {!loadingContratos && contratosPrivados && contratosPrivados.length > 0 && (
              <ul className="space-y-2">
                {contratosPrivados.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 p-3"
                  >
                    <div>
                      <p className="font-medium">{c.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/teses/${c.id}`)}>
                      Abrir no editor
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

