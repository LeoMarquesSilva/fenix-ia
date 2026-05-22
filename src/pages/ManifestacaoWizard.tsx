import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Sparkles, Upload, FileText, X, ArrowLeft, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useCreateTese } from '@/hooks/useTeses'
import { useAuth } from '@/hooks/useAuth'
import { generateIdentificador } from '@/lib/generateIdentificador'
import {
  generatePeticaoInicialFinalWithAI,
  isPeticaoAttachmentAccepted,
  preparePeticaoWizardData,
  resolvePeticaoFileMime,
  type DynamicQuestion,
  type PeticaoDocumentoInput,
  type PeticaoWizardData,
  type TeseFonteUtilizada,
} from '@/lib/peticao-ai'
import { PeticaoGeradaStep } from '@/components/peticao/PeticaoGeradaStep'
import {
  PETICAO_FILE_ACCEPT,
  TIPOS_MANIFESTACAO,
  type TipoManifestacao,
} from '@/constants/peticao-flow'

type PeticaoPreview = {
  titulo: string
  descricao: string
  texto_conteudo: string
  fontesUtilizadas: TeseFonteUtilizada[]
}

type DocumentoAnexado = {
  file: File
  instrucaoUso: string
}

type PrincipalDoc = {
  file: File
  instrucaoUso: string
}

type DynamicQuestionWithAnswer = DynamicQuestion & { resposta: string }

type Step = 1 | 2 | 3

export default function ManifestacaoWizard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const createMutation = useCreateTese()
  const fileOpcionalRef = useRef<HTMLInputElement>(null)
  const filePrincipalRef = useRef<HTMLInputElement>(null)

  const [nomeCliente, setNomeCliente] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [tipoManifestacao, setTipoManifestacao] = useState<TipoManifestacao>(
    'Manifestação em geral'
  )
  const [arquivoPrincipal, setArquivoPrincipal] = useState<PrincipalDoc | null>(null)
  const [documentosOpcionais, setDocumentosOpcionais] = useState<DocumentoAnexado[]>([])
  const [preview, setPreview] = useState<PeticaoPreview | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [contentVersion, setContentVersion] = useState(0)
  const [step, setStep] = useState<Step>(1)
  const [wizardData, setWizardData] = useState<PeticaoWizardData | null>(null)
  const [perguntas, setPerguntas] = useState<DynamicQuestionWithAnswer[]>([])
  const [loadingStep, setLoadingStep] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState('')

  const documentosParaIA = useMemo<PeticaoDocumentoInput[]>(() => {
    const list: PeticaoDocumentoInput[] = []
    if (arquivoPrincipal) {
      list.push({
        file: arquivoPrincipal.file,
        instrucaoUso:
          arquivoPrincipal.instrucaoUso.trim() ||
          'Despacho ou intimação judicial a cumprir.',
      })
    }
    for (const d of documentosOpcionais) {
      list.push({
        file: d.file,
        instrucaoUso: d.instrucaoUso.trim(),
      })
    }
    return list
  }, [arquivoPrincipal, documentosOpcionais])

  const validateFile = (file: File) => {
    if (!isPeticaoAttachmentAccepted(file)) {
      toast({
        title: 'Formato inválido',
        description: 'Use PDF, PNG ou Word (.docx).',
        variant: 'destructive',
      })
      return false
    }
    return true
  }

  const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!validateFile(f)) return
    setArquivoPrincipal({ file: f, instrucaoUso: '' })
  }

  const handleAddOpcionais = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
    if (!selected.length) return
    const valid = selected.filter((f) => validateFile(f))
    if (valid.length > 0) {
      setDocumentosOpcionais((prev) => [
        ...prev,
        ...valid.map((file) => ({ file, instrucaoUso: '' })),
      ])
    }
    event.target.value = ''
  }

  const handleRemoveOpcional = (index: number) => {
    setDocumentosOpcionais((prev) => prev.filter((_, i) => i !== index))
  }

  const validateStepOne = () => {
    if (nomeCliente.trim().length < 3) {
      toast({
        title: 'Nome do cliente inválido',
        description: 'Informe o nome com pelo menos 3 caracteres.',
        variant: 'destructive',
      })
      return false
    }
    if (!arquivoPrincipal) {
      toast({
        title: 'Documento obrigatório',
        description: 'Anexe o despacho ou intimação judicial.',
        variant: 'destructive',
      })
      return false
    }
    if (arquivoPrincipal.instrucaoUso.trim().length < 3) {
      toast({
        title: 'Instrução do despacho',
        description: 'Indique o que o juízo determinou e como este arquivo deve ser usado.',
        variant: 'destructive',
      })
      return false
    }
    const semInstrucaoOpc = documentosOpcionais.find(
      (doc) => doc.instrucaoUso.trim().length < 3
    )
    if (semInstrucaoOpc) {
      toast({
        title: 'Instrução de uso obrigatória',
        description: 'Para cada documento opcional, informe como utilizá-lo.',
        variant: 'destructive',
      })
      return false
    }
    return true
  }

  const handleAdvance = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateStepOne()) return

    setLoadingStep(true)
    setLoadingLabel('Analisando despacho e preparando perguntas...')
    setPreview(null)
    try {
      const data = await preparePeticaoWizardData(
        {
          nomeCliente: nomeCliente.trim(),
          fatos: observacoes.trim(),
          tipoPeticao: tipoManifestacao,
          parteContraria: '',
          documentos: documentosParaIA,
          tipoManifestacao,
        },
        'manifestacao'
      )

      setWizardData(data)
      setPerguntas(data.perguntasDinamicas.map((q) => ({ ...q, resposta: '' })))

      toast({
        title: 'Perguntas preparadas',
        description: 'Responda os pontos complementares para gerar a manifestação.',
      })
      setStep(2)
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Não foi possível avançar para as perguntas complementares.'
      toast({
        title: 'Erro na análise',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setLoadingStep(false)
      setLoadingLabel('')
    }
  }

  const updatePerguntaResposta = (id: string, resposta: string) => {
    setPerguntas((prev) => prev.map((q) => (q.id === id ? { ...q, resposta } : q)))
  }

  const handleGenerateFinal = async () => {
    if (!wizardData) return
    const missingRequired = perguntas.find(
      (q) => q.obrigatoria && q.resposta.trim().length < 2
    )
    if (missingRequired) {
      toast({
        title: 'Pergunta obrigatória',
        description: `Responda: "${missingRequired.pergunta}"`,
        variant: 'destructive',
      })
      return
    }

    setLoadingStep(true)
    setLoadingLabel('Gerando manifestação...')

    try {
      const result = await generatePeticaoInicialFinalWithAI({
        nomeCliente: nomeCliente.trim(),
        fatos: observacoes.trim(),
        tipoPeticao: tipoManifestacao,
        parteContraria: '',
        respostasDinamicas: perguntas.map((q) => ({
          id: q.id,
          pergunta: q.pergunta,
          resposta: q.resposta.trim(),
        })),
        wizardData,
        flowMode: 'manifestacao',
        tipoManifestacao,
      })

      setPreview(result)
      setPreviewHtml(result.texto_conteudo)
      setContentVersion((v) => v + 1)
      setStep(3)
      toast({
        title: 'Manifestação gerada',
        description: 'Revise o texto e exporte ou salve no editor.',
      })
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Não foi possível gerar a manifestação.'
      toast({
        title: 'Erro na geração final',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setLoadingStep(false)
      setLoadingLabel('')
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
        texto_conteudo: previewHtml,
        tipo_tese: 'Petição Privada - Manifestação',
        assuntos: ['Manifestação', tipoManifestacao],
        user_id: user?.id || null,
      })

      toast({
        title: 'Peça salva',
        description: 'O documento foi salvo e será aberto no editor.',
      })

      navigate(`/teses/${created.id}`)
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Não foi possível salvar.'
      toast({
        title: 'Erro ao salvar',
        description: msg,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-full bg-muted/30 dark:bg-transparent">
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <PageHeader
          title="Manifestações"
          description="Anexe o despacho do juízo, escolha o tipo de manifestação e conclua com a minuta."
        />

        <Card className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              {step === 1 && 'Etapa 1: Dados e despacho'}
              {step === 2 && 'Etapa 2: Perguntas complementares'}
              {step === 3 && 'Etapa 3: Prévia da manifestação'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <form onSubmit={handleAdvance} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome-cliente-m">Nome do cliente *</Label>
                  <Input
                    id="nome-cliente-m"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    placeholder="Ex.: João da Silva"
                    maxLength={250}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Intimação / despacho judicial *</Label>
                  <p className="text-xs text-muted-foreground">
                    Documento em que o juízo determina providências ou intima as partes.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => filePrincipalRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {arquivoPrincipal ? 'Trocar arquivo' : 'Anexar despacho'}
                    </Button>
                    <input
                      ref={filePrincipalRef}
                      type="file"
                      accept={PETICAO_FILE_ACCEPT}
                      className="hidden"
                      onChange={handlePrincipalChange}
                    />
                    {arquivoPrincipal && (
                      <span className="text-sm text-muted-foreground">
                        {arquivoPrincipal.file.name} (
                        {resolvePeticaoFileMime(arquivoPrincipal.file) || 'arquivo'})
                      </span>
                    )}
                  </div>
                  {arquivoPrincipal && (
                    <div className="space-y-1 rounded-md border bg-muted/30 p-3">
                      <Label htmlFor="instr-despacho">O que o juízo determinou? *</Label>
                      <Textarea
                        id="instr-despacho"
                        value={arquivoPrincipal.instrucaoUso}
                        onChange={(e) =>
                          setArquivoPrincipal((prev) =>
                            prev ? { ...prev, instrucaoUso: e.target.value } : prev
                          )
                        }
                        placeholder="Ex.: Prazo de 5 dias para juntar documento X; manifestar sobre perícia."
                        rows={4}
                        maxLength={2000}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Manifestação *</Label>
                  <Select
                    value={tipoManifestacao}
                    onValueChange={(v) => setTipoManifestacao(v as TipoManifestacao)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_MANIFESTACAO.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="obs-m">Observações adicionais (opcional)</Label>
                  <Textarea
                    id="obs-m"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Informações que não constam no despacho e que devem ser consideradas."
                    rows={4}
                    maxLength={10000}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Envio de documentos (opcional)</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileOpcionalRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Anexar arquivos
                    </Button>
                    <input
                      ref={fileOpcionalRef}
                      type="file"
                      accept={PETICAO_FILE_ACCEPT}
                      className="hidden"
                      multiple
                      onChange={handleAddOpcionais}
                    />
                  </div>

                  {documentosOpcionais.length > 0 && (
                    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                      {documentosOpcionais.map((file, index) => (
                        <div
                          key={`${file.file.name}-${index}`}
                          className="space-y-2 rounded-md border bg-background p-3"
                        >
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <div className="truncate font-medium">{file.file.name}</div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOpcional(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`instr-opc-m-${index}`}>
                              Como deseja utilizar este documento? *
                            </Label>
                            <Textarea
                              id={`instr-opc-m-${index}`}
                              value={file.instrucaoUso}
                              onChange={(e) => {
                                const v = e.target.value
                                setDocumentosOpcionais((prev) =>
                                  prev.map((d, i) =>
                                    i === index ? { ...d, instrucaoUso: v } : d
                                  )
                                )
                              }}
                              rows={3}
                              maxLength={1200}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loadingStep}>
                    {loadingStep ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {loadingLabel || 'Processando...'}
                      </>
                    ) : (
                      <>
                        Avançar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm font-medium">
                  Perguntas sobre a manifestação ({tipoManifestacao})
                </p>
                <div className="space-y-3">
                  {perguntas.map((q) => (
                    <div key={q.id} className="space-y-1 rounded-md border p-3">
                      <Label htmlFor={`m-${q.id}`}>
                        {q.pergunta} {q.obrigatoria && '*'}
                      </Label>
                      {q.tipo === 'select' && q.opcoes && q.opcoes.length > 0 ? (
                        <Select
                          value={q.resposta}
                          onValueChange={(value) => updatePerguntaResposta(q.id, value)}
                        >
                          <SelectTrigger id={`m-${q.id}`}>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {q.opcoes.map((opcao) => (
                              <SelectItem key={opcao} value={opcao}>
                                {opcao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Textarea
                          id={`m-${q.id}`}
                          value={q.resposta}
                          onChange={(e) => updatePerguntaResposta(q.id, e.target.value)}
                          rows={q.tipo === 'texto' ? 3 : 2}
                          placeholder={q.ajuda || 'Digite sua resposta'}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={loadingStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button type="button" onClick={handleGenerateFinal} disabled={loadingStep}>
                    {loadingStep ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {loadingLabel || 'Gerando...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gerar manifestação
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {step === 3 && preview && (
          <div className="mt-6">
            <PeticaoGeradaStep
              contentVersion={contentVersion}
              initialHtml={preview.texto_conteudo}
              titulo={preview.titulo}
              descricao={preview.descricao}
              fontesUtilizadas={preview.fontesUtilizadas}
              onHtmlChange={setPreviewHtml}
              onSalvar={handleSave}
              salvarPending={createMutation.isPending}
            />
            <div className="mt-4 flex justify-start">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar às perguntas
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
