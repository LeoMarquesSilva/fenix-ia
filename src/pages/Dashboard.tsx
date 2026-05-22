import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTeses, useDeleteTese } from '@/hooks/useTeses'
import { useTeseRanking } from '@/hooks/useTeseRanking'
import { useProfiles } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImportModal } from '@/components/ImportModal'
import { UploadWordModal } from '@/components/UploadWordModal'
import { AIGenerateModal } from '@/components/AIGenerateModal'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { DashboardMetricsPanel } from '@/components/dashboard/DashboardMetricsPanel'
import { DashboardTeseRanking } from '@/components/dashboard/DashboardTeseRanking'
import { DashboardThesisList } from '@/components/dashboard/DashboardThesisList'
import { tipoTeseFromSegmento } from '@/constants/acervo-segments'
import { AREAS_DIREITO } from '@/types/profiles'
import { BarChart3, Library } from 'lucide-react'

type ViewMode = 'grid' | 'list'

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const segmento = searchParams.get('segmento')
  const tipoTeseFilter = tipoTeseFromSegmento(segmento)

  const [search, setSearch] = useState('')
  const [area, setArea] = useState<string>('all')
  const [assunto, setAssunto] = useState<string>('all')
  const [tipo, setTipo] = useState<string>('all')
  const [ordenacao, setOrdenacao] = useState<
    'recentes' | 'antigos' | 'titulo_asc' | 'titulo_desc'
  >('recentes')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedTeses, setSelectedTeses] = useState<Set<string>>(new Set())
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [uploadWordModalOpen, setUploadWordModalOpen] = useState(false)
  const [aiGenerateModalOpen, setAiGenerateModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [teseToDelete, setTeseToDelete] = useState<string | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [mainTab, setMainTab] = useState<'library' | 'metrics'>(() =>
    searchParams.get('tab') === 'metrics' ? 'metrics' : 'library'
  )

  const { canDeleteTeses, user, isEstagiario, canEditTeseContent } = useAuth()

  useEffect(() => {
    setPage(1)
  }, [segmento, tipoTeseFilter])

  useEffect(() => {
    if (searchParams.get('tab') === 'metrics') setMainTab('metrics')
    else setMainTab('library')
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get('focus') !== 'filters') return
    setMainTab('library')
    const t = window.setTimeout(() => {
      document
        .getElementById('dashboard-filters')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => clearTimeout(t)
  }, [searchParams])

  const onTabChange = (v: string) => {
    const next = v as 'library' | 'metrics'
    setMainTab(next)
    const p = new URLSearchParams(searchParams)
    if (next === 'metrics') p.set('tab', 'metrics')
    else p.delete('tab')
    setSearchParams(p, { replace: true })
  }

  const { data: favoritos } = useFavorites()
  const { toggleFavorite, isLoading: isTogglingFavorite } = useToggleFavorite()
  const favoriteIds = useMemo(
    () => favoritos?.map((f) => f.tese_id) || [],
    [favoritos]
  )
  const navigate = useNavigate()
  const { toast } = useToast()
  const deleteMutation = useDeleteTese()
  const { data: profiles } = useProfiles()

  const tipoTeseFilterResolved =
    tipo !== 'all' ? tipo : tipoTeseFilter

  const filters = {
    search: search || undefined,
    area: area === 'all' ? undefined : area || undefined,
    assunto: assunto === 'all' ? undefined : assunto || undefined,
    tipoTese: tipoTeseFilterResolved,
    ordenacao,
  }

  const { data, isLoading, error } = useTeses({
    ...filters,
    page,
    pageSize: viewMode === 'grid' ? 12 : 20,
  })

  const { data: metricsData } = useTeses({
    ...filters,
    page: 1,
    pageSize: 500,
  })

  const {
    data: rankingRows,
    isLoading: rankingLoading,
    error: rankingError,
  } = useTeseRanking(15)

  const getCreatorName = (userId: string | null) => {
    if (!userId || !profiles) return null
    const creator = profiles.find((p) => p.id === userId)
    return creator?.nome || null
  }

  const getCreatorAvatar = (userId: string | null) => {
    if (!userId || !profiles) return null
    const creator = profiles.find((p) => p.id === userId)
    return creator?.avatar_url || null
  }

  const totalTeses = data?.count || 0
  const areasCount = new Set(
    data?.data.map((t) => t.area).filter(Boolean) || []
  ).size
  const assuntosCount = new Set(
    data?.data.flatMap((t) => t.assuntos || []).filter(Boolean) || []
  ).size

  const filteredTeses = useMemo(() => {
    if (!data?.data) return []
    if (!showFavoritesOnly) return data.data
    return data.data.filter((tese) => favoriteIds.includes(tese.id))
  }, [data?.data, showFavoritesOnly, favoriteIds])

  const selectionCanEditContent = useMemo(() => {
    if (selectedTeses.size === 0) return false
    return Array.from(selectedTeses).every((id) => {
      const t = filteredTeses.find((x) => x.id === id)
      return t != null && canEditTeseContent(t.user_id)
    })
  }, [selectedTeses, filteredTeses, canEditTeseContent])

  const metrics = useMemo(() => {
    const source = metricsData?.data ?? data?.data
    if (!source) return { byArea: [], byMonth: [], byCreator: [], byTipo: [] }
    const areaMap = new Map<string, number>()
    source.forEach((t) => {
      const a = t.area || 'Sem área'
      areaMap.set(a, (areaMap.get(a) || 0) + 1)
    })
    const byArea = Array.from(areaMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const tipoMap = new Map<string, number>()
    source.forEach((t) => {
      const tipo = t.tipo_tese || 'Não definido'
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1)
    })
    const byTipo = Array.from(tipoMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const monthMap = new Map<string, number>()
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit',
      })
      monthMap.set(key, 0)
    }
    source.forEach((t) => {
      const d = new Date(t.created_at)
      const key = d.toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit',
      })
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + 1)
      }
    })
    const byMonth = Array.from(monthMap.entries()).map(([name, count]) => ({
      name,
      count,
    }))

    const creatorMap = new Map<string, { count: number; name: string; avatarUrl: string | null }>()
    source.forEach((t) => {
      const id = t.user_id || 'unknown'
      const name = getCreatorName(t.user_id) || 'Desconhecido'
      const avatarUrl = getCreatorAvatar(t.user_id)
      const existing = creatorMap.get(id)
      if (existing) {
        existing.count += 1
      } else {
        creatorMap.set(id, { count: 1, name, avatarUrl })
      }
    })
    const byCreator = Array.from(creatorMap.entries())
      .map(([userId, { count, name, avatarUrl }]) => ({ userId, name, count, avatarUrl }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    return { byArea, byMonth, byCreator, byTipo }
  }, [metricsData?.data, data?.data, profiles])

  const areas = useMemo(() => {
    const fromData = new Set(
      [
        ...(data?.data?.map((t) => t.area).filter(Boolean) || []),
        ...(metricsData?.data?.map((t) => t.area).filter(Boolean) || []),
      ] as string[]
    )
    const all = [...AREAS_DIREITO.filter(Boolean), ...fromData]
    return Array.from(new Set(all)).filter(Boolean).sort() as string[]
  }, [data?.data, metricsData?.data])
  const assuntos = useMemo(() => {
    const flat = [
      ...(data?.data?.flatMap((t) => t.assuntos || []) || []),
      ...(metricsData?.data?.flatMap((t) => t.assuntos || []) || []),
    ].filter(Boolean) as string[]
    return Array.from(new Set(flat)).sort()
  }, [data?.data, metricsData?.data])

  const toggleSelectTese = (teseId: string) => {
    setSelectedTeses((prev) => {
      const next = new Set(prev)
      if (next.has(teseId)) next.delete(teseId)
      else next.add(teseId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!data?.data) return
    if (selectedTeses.size === filteredTeses.length && filteredTeses.length > 0) {
      setSelectedTeses(new Set())
    } else {
      setSelectedTeses(new Set(filteredTeses.map((t) => t.id)))
    }
  }

  const handleEditSelected = () => {
    if (selectedTeses.size === 0) {
      toast({
        title: 'Nenhuma tese selecionada',
        description: 'Selecione pelo menos uma tese para abrir',
        variant: 'destructive',
      })
      return
    }
    const ids = Array.from(selectedTeses).join(',')
    navigate(`/teses?ids=${ids}`)
  }

  const handleEditSingle = (teseId: string) => {
    navigate(`/teses/${teseId}`)
  }

  const handleDeleteClick = (teseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setTeseToDelete(teseId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!teseToDelete) return
    try {
      await deleteMutation.mutateAsync(teseToDelete)
      toast({
        title: 'Tese excluída',
        description: 'A tese foi removida com sucesso.',
      })
      setSelectedTeses((prev) => {
        const next = new Set(prev)
        next.delete(teseToDelete)
        return next
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir tese'
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setTeseToDelete(null)
    }
  }

  const handleToggleFavorite = async (teseId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isTogglingFavorite) return
    await toggleFavorite(teseId)
  }

  return (
    <div className="min-h-full overflow-x-hidden bg-muted/30 dark:bg-transparent">
      <main className="container mx-auto min-w-0 px-4 py-6">
        <DashboardTopBar
          onOpenAI={() => setAiGenerateModalOpen(true)}
          onOpenWord={() => setUploadWordModalOpen(true)}
          onOpenExcel={() => setImportModalOpen(true)}
        />

        <Tabs
          value={mainTab}
          onValueChange={onTabChange}
          className="space-y-6"
        >
          <TabsList className="grid h-auto w-full max-w-md grid-cols-2 p-1 sm:inline-flex sm:w-auto">
            <TabsTrigger
              value="library"
              className="gap-2 min-h-11 sm:min-h-10"
            >
              <Library className="h-4 w-4" />
              Biblioteca
            </TabsTrigger>
            <TabsTrigger
              value="metrics"
              className="gap-2 min-h-11 sm:min-h-10"
            >
              <BarChart3 className="h-4 w-4" />
              Métricas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-0 space-y-6">
            <DashboardKPIs
              totalTeses={totalTeses}
              areasCount={areasCount}
              assuntosCount={assuntosCount}
              selectedCount={selectedTeses.size}
            />
            <DashboardFilters
              search={search}
              setSearch={setSearch}
              area={area}
              setArea={setArea}
              assunto={assunto}
              setAssunto={setAssunto}
              tipo={tipo}
              setTipo={setTipo}
              ordenacao={ordenacao}
              setOrdenacao={setOrdenacao}
              showFavoritesOnly={showFavoritesOnly}
              setShowFavoritesOnly={setShowFavoritesOnly}
              favoriteCount={favoriteIds.length}
              areas={areas}
              assuntos={assuntos}
              setPage={setPage}
            />
            <DashboardThesisList
              isLoading={isLoading}
              error={error}
              data={data}
              filteredTeses={filteredTeses}
              viewMode={viewMode}
              setViewMode={setViewMode}
              selectedTeses={selectedTeses}
              toggleSelectTese={toggleSelectTese}
              toggleSelectAll={toggleSelectAll}
              showFavoritesOnly={showFavoritesOnly}
              setShowFavoritesOnly={setShowFavoritesOnly}
              favoriteIds={favoriteIds}
              page={page}
              setPage={setPage}
              onEditSelected={handleEditSelected}
              onEditSingle={handleEditSingle}
              onDeleteClick={handleDeleteClick}
              onToggleFavorite={handleToggleFavorite}
              onOpenWord={() => setUploadWordModalOpen(true)}
              onOpenExcel={() => setImportModalOpen(true)}
              getCreatorName={getCreatorName}
              getCreatorAvatar={getCreatorAvatar}
              isEstagiario={!!isEstagiario}
              canDeleteTeses={!!canDeleteTeses}
              canEditTeseContent={canEditTeseContent}
              selectionCanEditContent={selectionCanEditContent}
              userId={user?.id}
              isTogglingFavorite={isTogglingFavorite}
              onClearSelection={() => setSelectedTeses(new Set())}
            />
          </TabsContent>

          <TabsContent value="metrics" className="mt-0 space-y-6">
            <DashboardFilters
              search={search}
              setSearch={setSearch}
              area={area}
              setArea={setArea}
              assunto={assunto}
              setAssunto={setAssunto}
              tipo={tipo}
              setTipo={setTipo}
              ordenacao={ordenacao}
              setOrdenacao={setOrdenacao}
              showFavoritesOnly={showFavoritesOnly}
              setShowFavoritesOnly={setShowFavoritesOnly}
              favoriteCount={favoriteIds.length}
              areas={areas}
              assuntos={assuntos}
              setPage={setPage}
            />
            <DashboardMetricsPanel
              totalTeses={metricsData?.count ?? totalTeses}
              byArea={metrics.byArea}
              byMonth={metrics.byMonth}
              byCreator={metrics.byCreator}
              byTipo={metrics.byTipo}
            />
            <DashboardTeseRanking
              rows={rankingRows}
              isLoading={rankingLoading}
              error={rankingError}
            />
          </TabsContent>
        </Tabs>
      </main>

      <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} />
      <UploadWordModal
        open={uploadWordModalOpen}
        onOpenChange={setUploadWordModalOpen}
      />
      <AIGenerateModal
        open={aiGenerateModalOpen}
        onOpenChange={setAiGenerateModalOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tese? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
