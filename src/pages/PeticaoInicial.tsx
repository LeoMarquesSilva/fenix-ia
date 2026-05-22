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
import { useCreateTese, useMyPrivatePeticoes } from '@/hooks/useTeses'
import { useAuth } from '@/hooks/useAuth'
import { generateIdentificador } from '@/lib/generateIdentificador'
import {
  generatePeticaoInicialFinalWithAI,
  isPeticaoAttachmentAccepted,
  preparePeticaoWizardData,
  type DynamicQuestion,
  type ExecutadoExtraido,
  type PeticaoDocumentoInput,
  type PeticaoWizardData,
  type TeseFonteUtilizada,
} from '@/lib/peticao-ai'
import { PeticaoGeradaStep } from '@/components/peticao/PeticaoGeradaStep'
import { PETICAO_FILE_ACCEPT } from '@/constants/peticao-flow'

const TIPO_PETICAO_FIXO = 'Execução de título extrajudicial'

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

type DynamicQuestionWithAnswer = DynamicQuestion & { resposta: string }

type Step = 1 | 2 | 3

const EXECUTADO_VAZIO: ExecutadoExtraido = {
  razaoSocial: '',
  cnpj: '',
  endereco: '',
  nire: '',
  municipioUf: '',
}

export default function PeticaoInicial() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const createMutation = useCreateTese()
  const { data: peticoesPrivadas, isLoading: loadingPeticoesPrivadas } =
    useMyPrivatePeticoes()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nomeCliente, setNomeCliente] = useState('')
  const [fatos, setFatos] = useState('')
  const [parteContraria, setParteContraria] = useState('')
  const [tipoPeticao, setTipoPeticao] = useState(TIPO_PETICAO_FIXO)
  const [documentos, setDocumentos] = useState<DocumentoAnexado[]>([])
  const [preview, setPreview] = useState<PeticaoPreview | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [contentVersion, setContentVersion] = useState(0)
  const [step, setStep] = useState<Step>(1)
  const [wizardData, setWizardData] = useState<PeticaoWizardData | null>(null)
  const [executadoExtraido, setExecutadoExtraido] = useState<ExecutadoExtraido>(EXECUTADO_VAZIO)
  const [perguntas, setPerguntas] = useState<DynamicQuestionWithAnswer[]>([])
  const [loadingStep, setLoadingStep] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState('')

  const documentosParaIA = useMemo<PeticaoDocumentoInput[]>(
    () =>
      documentos.map((doc) => ({
        file: doc.file,
        instrucaoUso: doc.instrucaoUso.trim(),
      })),
    [documentos]
  )

  const handleAddFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
    if (!selected.length) return

    const invalid = selected.filter((f) => !isPeticaoAttachmentAccepted(f))
    if (invalid.length > 0) {
      toast({
        title: 'Formato inválido',
        description: 'Envie PDF, PNG ou Word (.docx).',
        variant: 'destructive',
      })
    }

    const valid = selected.filter((f) => isPeticaoAttachmentAccepted(f))
    if (valid.length > 0) {
      setDocumentos((prev) => [
        ...prev,
        ...valid.map((file) => ({ file, instrucaoUso: '' })),
      ])
    }

    event.target.value = ''
  }

  const handleRemoveFile = (index: number) => {
    setDocumentos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateInstrucao = (index: number, value: string) => {
    setDocumentos((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, instrucaoUso: value } : doc))
    )
  }

  const validateStepOne = () => {
    if (nomeCliente.trim().length < 3) {
      toast({
        title: 'Nome do cliente inválido',
        description: 'Informe o nome do cliente com pelo menos 3 caracteres.',
        variant: 'destructive',
      })
      return false
    }

    if (fatos.trim().length < 30) {
      toast({
        title: 'Fatos insuficientes',
        description: 'Descreva os fatos com mais detalhes (mínimo de 30 caracteres).',
        variant: 'destructive',
      })
      return false
    }

    if (parteContraria.trim().length < 3 && documentos.length === 0) {
      toast({
        title: 'Parte contrária ausente',
        description:
          'Preencha a parte contrária ou anexe documento para extração automática dos dados.',
        variant: 'destructive',
      })
      return false
    }

    const semInstrucao = documentos.find(
      (doc) => doc.instrucaoUso.trim().length < 3
    )
    if (semInstrucao) {
      toast({
        title: 'Instrução de uso obrigatória',
        description:
          'Para cada documento anexado, informe como ele deve ser utilizado na fundamentação.',
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
    setLoadingLabel('Analisando anexos e montando perguntas...')
    setPreview(null)
    try {
      const data = await preparePeticaoWizardData(
        {
          nomeCliente: nomeCliente.trim(),
          fatos: fatos.trim(),
          tipoPeticao,
          parteContraria: parteContraria.trim(),
          documentos: documentosParaIA,
        },
        'inicial_execucao'
      )

      setWizardData(data)
      setExecutadoExtraido(data.executadoExtraido)
      setPerguntas(data.perguntasDinamicas.map((q) => ({ ...q, resposta: '' })))

      if (!parteContraria.trim() && data.executadoExtraido.razaoSocial) {
        setParteContraria(data.executadoExtraido.razaoSocial)
      }

      toast({
        title: 'Perguntas preparadas',
        description: 'Responda os pontos complementares para gerar a petição final.',
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
    setLoadingLabel('Gerando petição final...')

    try {
      const result = await generatePeticaoInicialFinalWithAI({
        nomeCliente: nomeCliente.trim(),
        fatos: fatos.trim(),
        tipoPeticao,
        parteContraria:
          parteContraria.trim() ||
          executadoExtraido.razaoSocial ||
          'Executado a qualificar',
        respostasDinamicas: perguntas.map((q) => ({
          id: q.id,
          pergunta: q.pergunta,
          resposta: q.resposta.trim(),
        })),
        wizardData: {
          ...wizardData,
          executadoExtraido,
        },
        flowMode: 'inicial_execucao',
      })

      setPreview(result)
      setPreviewHtml(result.texto_conteudo)
      setContentVersion((v) => v + 1)
      setStep(3)
      toast({
        title: 'Petição gerada',
        description: 'Revise o conteúdo e salve para abrir no editor.',
      })
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar a petição inicial.'
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
        tipo_tese: 'Petição Inicial Privada',
        assuntos: [
          'Petição Inicial',
          'Execução de Título Extrajudicial',
          'Cobrança Judicial',
          executadoExtraido.cnpj ? `CNPJ ${executadoExtraido.cnpj}` : '',
        ],
        user_id: user?.id || null,
      })

      toast({
        title: 'Petição salva',
        description: 'A peça foi salva e será aberta no editor.',
      })

      navigate(`/teses/${created.id}`)
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Não foi possível salvar a petição.'
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
          title="Petição inicial"
          description="Fluxo em etapas: dados do caso, perguntas complementares e geração final da petição."
        />

        <Card className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              {step === 1 && 'Etapa 1: Dados para análise'}
              {step === 2 && 'Etapa 2: Perguntas complementares'}
              {step === 3 && 'Etapa 3: Prévia da petição'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <form onSubmit={handleAdvance} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome-cliente">Nome do cliente *</Label>
                  <Input
                    id="nome-cliente"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    placeholder="Ex.: João da Silva"
                    maxLength={250}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fatos">Fatos *</Label>
                  <Textarea
                    id="fatos"
                    value={fatos}
                    onChange={(e) => setFatos(e.target.value)}
                    placeholder="Descreva o histórico da dívida, inadimplemento, documentos comprobatórios e tentativas de cobrança."
                    rows={7}
                    maxLength={10000}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tipo-peticao">Tipo da petição *</Label>
                    <Select value={tipoPeticao} onValueChange={setTipoPeticao}>
                      <SelectTrigger id="tipo-peticao">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TIPO_PETICAO_FIXO}>
                          Execução de título extrajudicial
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parte-contraria">
                      Parte contrária (opcional se anexar documento)
                    </Label>
                    <Input
                      id="parte-contraria"
                      value={parteContraria}
                      onChange={(e) => setParteContraria(e.target.value)}
                      placeholder="Ex.: Empresa XPTO Ltda."
                      maxLength={250}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Envio de documentos (opcional)</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Anexar arquivos
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={PETICAO_FILE_ACCEPT}
                      className="hidden"
                      multiple
                      onChange={handleAddFiles}
                    />
                    <span className="text-sm text-muted-foreground">
                      PDF, PNG ou .docx. Extração de texto e OCR quando necessário.
                    </span>
                  </div>

                  {documentos.length > 0 && (
                    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                      {documentos.map((file, index) => (
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
                              onClick={() => handleRemoveFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`instrucao-doc-${index}`}>
                              Como deseja utilizar este documento? *
                            </Label>
                            <Textarea
                              id={`instrucao-doc-${index}`}
                              value={file.instrucaoUso}
                              onChange={(e) =>
                                handleUpdateInstrucao(index, e.target.value)
                              }
                              placeholder="Ex.: Use este documento para identificar o CNPJ e a razão social do executado e reforçar sua qualificação."
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
                <div className="rounded-md border bg-muted/30 p-4">
                  <p className="text-sm font-medium">
                    Dados sugeridos para o executado (extraídos dos anexos)
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Revise e ajuste os campos abaixo antes de gerar a petição final.
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="exec-razao">Razão social</Label>
                      <Input
                        id="exec-razao"
                        value={executadoExtraido.razaoSocial}
                        onChange={(e) =>
                          setExecutadoExtraido((prev) => ({
                            ...prev,
                            razaoSocial: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="exec-cnpj">CNPJ</Label>
                      <Input
                        id="exec-cnpj"
                        value={executadoExtraido.cnpj}
                        onChange={(e) =>
                          setExecutadoExtraido((prev) => ({
                            ...prev,
                            cnpj: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="exec-endereco">Endereço</Label>
                      <Input
                        id="exec-endereco"
                        value={executadoExtraido.endereco}
                        onChange={(e) =>
                          setExecutadoExtraido((prev) => ({
                            ...prev,
                            endereco: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="exec-nire">NIRE</Label>
                      <Input
                        id="exec-nire"
                        value={executadoExtraido.nire}
                        onChange={(e) =>
                          setExecutadoExtraido((prev) => ({
                            ...prev,
                            nire: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="exec-municipio-uf">Município/UF</Label>
                      <Input
                        id="exec-municipio-uf"
                        value={executadoExtraido.municipioUf}
                        onChange={(e) =>
                          setExecutadoExtraido((prev) => ({
                            ...prev,
                            municipioUf: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Antes de seguir, vou te fazer algumas perguntas para entender melhor o caso
                  </p>
                  {perguntas.map((q) => (
                    <div key={q.id} className="space-y-1 rounded-md border p-3">
                      <Label htmlFor={q.id}>
                        {q.pergunta} {q.obrigatoria && '*'}
                      </Label>
                      {q.tipo === 'select' && q.opcoes && q.opcoes.length > 0 ? (
                        <Select
                          value={q.resposta}
                          onValueChange={(value) => updatePerguntaResposta(q.id, value)}
                        >
                          <SelectTrigger id={q.id}>
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
                          id={q.id}
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
                        Gerar petição final
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {step === 3 && preview && (
          <div className="mt-6 space-y-4">
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
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar às perguntas
            </Button>
          </div>
        )}

        <Card className="mt-6 border">
          <CardHeader>
            <CardTitle>Minhas petições privadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPeticoesPrivadas && (
              <p className="text-sm text-muted-foreground">Carregando petições...</p>
            )}
            {!loadingPeticoesPrivadas &&
              (!peticoesPrivadas || peticoesPrivadas.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma petição privada salva ainda.
                </p>
              )}
            {!loadingPeticoesPrivadas &&
              peticoesPrivadas &&
              peticoesPrivadas.length > 0 && (
                <ul className="space-y-2">
                  {peticoesPrivadas.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 p-3"
                    >
                      <div>
                        <p className="font-medium">{p.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/teses/${p.id}`)}
                      >
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
