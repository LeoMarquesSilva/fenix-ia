import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useUpsertTeses } from '@/hooks/useTeses'
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
import { useToast } from '@/components/ui/use-toast'
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react'
import type { TeseInsert } from '@/types/supabase'
import { supabase } from '@/lib/supabase'

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ImportResult {
  inserted: number
  updated: number
  errors: string[]
}

export function ImportModal({ open, onOpenChange }: ImportModalProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const upsertMutation = useUpsertTeses()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
      setFile(selectedFile)
      setResult(null)
    } else {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo .xlsx',
        variant: 'destructive',
      })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile)
      setResult(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const parseExcel = async (file: File): Promise<TeseInsert[]> => {
    // Usar user do useAuth hook em vez de chamar getUser() diretamente
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)

          const teses: TeseInsert[] = jsonData.map((row: any) => {
            // Mapear colunas do Excel
            const identificador = String(row.Identificador || row.identificador || '')
            const titulo = String(row.Título || row.titulo || row.Titulo || '')
            const descricao = String(row.Descrição || row.descricao || row.Descricao || '')
            const area = String(row.Área || row.area || row.Area || '')
            const assuntosStr = String(row.Assuntos || row.assuntos || row.Assuntos || '')
            const link = String(row.Link || row.link || '')

            // Processar assuntos (separados por ||)
            const assuntos = assuntosStr
              .split('||')
              .map((a: string) => a.trim())
              .filter((a: string) => a.length > 0)

            return {
              identificador,
              titulo,
              descricao: descricao || null,
              area: area || null,
              assuntos: assuntos.length > 0 ? assuntos : null,
              link_externo: link || null,
              texto_conteudo: null,
              user_id: user?.id || null,
            }
          })

          resolve(teses)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const handleImport = async () => {
    if (!file) return

    setProcessing(true)
    setResult(null)

    try {
      const teses = await parseExcel(file)

      // Verificar quais já existem (para contar inseridos vs atualizados)
      const identificadores = teses.map((t) => t.identificador)
      const { data: existing } = await supabase
        .from('teses')
        .select('identificador')
        .in('identificador', identificadores)

      const existingIds = new Set((existing as { identificador: string }[] | null)?.map((e) => e.identificador) || [])

      // Fazer upsert
      await upsertMutation.mutateAsync(teses)

      const inserted = teses.filter((t) => !existingIds.has(t.identificador)).length
      const updated = teses.filter((t) => existingIds.has(t.identificador)).length

      setResult({
        inserted,
        updated,
        errors: [],
      })

      toast({
        title: 'Importação concluída!',
        description: `${inserted} inseridos, ${updated} atualizados`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message || 'Ocorreu um erro ao processar o arquivo',
        variant: 'destructive',
      })
      setResult({
        inserted: 0,
        updated: 0,
        errors: [error.message || 'Erro desconhecido'],
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Teses do Excel</DialogTitle>
          <DialogDescription>
            Selecione um arquivo .xlsx com as colunas: Identificador, Título, Descrição, Área,
            Assuntos (separados por ||), Link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-primary"
            >
              <FileSpreadsheet className="mb-4 h-12 w-12" style={{ color: '#101f2e' }} />
              <p className="mb-2 text-sm" style={{ color: '#101f2e' }}>
                Arraste o arquivo aqui ou clique para selecionar
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Selecionar Arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remover
                </Button>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-lg border bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">Importação concluída</p>
                  <p className="mt-1 text-sm text-green-700">
                    {result.inserted} teses inseridas • {result.updated} teses atualizadas
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!file || processing}
          >
            {processing ? 'Processando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
