import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeses, useDeleteTese } from '@/hooks/useTeses'
import { useProfiles } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImportModal } from '@/components/ImportModal'
import { UploadWordModal } from '@/components/UploadWordModal'
import { AIGenerateModal } from '@/components/AIGenerateModal'
import { useToast } from '@/components/ui/use-toast'
import {
  Upload,
  LogOut,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Edit,
  Grid3x3,
  List,
  CheckSquare,
  X,
  BarChart3,
  TrendingUp,
  Zap,
  Sparkles,
  Trash2,
  Users,
  Shield,
  Calendar,
  ArrowUpDown,
  User,
  PieChart,
} from 'lucide-react'
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
import type { Tese } from '@/types/supabase'

type ViewMode = 'grid' | 'list'

export default function Dashboard() {
  const [search, setSearch] = useState('')
  const [area, setArea] = useState<string>('all')
  const [assunto, setAssunto] = useState<string>('all')
  const [criadorId, setCriadorId] = useState<string>('all')
  const [dataInicio, setDataInicio] = useState<string>('')
  const [dataFim, setDataFim] = useState<string>('')
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'antigos' | 'titulo_asc' | 'titulo_desc'>('recentes')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedTeses, setSelectedTeses] = useState<Set<string>>(new Set())
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [uploadWordModalOpen, setUploadWordModalOpen] = useState(false)
  const [aiGenerateModalOpen, setAiGenerateModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [teseToDelete, setTeseToDelete] = useState<string | null>(null)
  const [showMetrics, setShowMetrics] = useState(false)
  const { signOut, isAdmin, profile, canDeleteTeses, canEditAllTeses, user, isEstagiario } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const deleteMutation = useDeleteTese()
  
  // Buscar lista de usuários para filtro por criador
  const { data: profiles } = useProfiles()

  const { data, isLoading, error } = useTeses({
    search: search || undefined,
    area: area === 'all' ? undefined : area || undefined,
    assunto: assunto === 'all' ? undefined : assunto || undefined,
    criadorId: criadorId === 'all' ? undefined : criadorId || undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
    ordenacao,
    page,
    pageSize: viewMode === 'grid' ? 12 : 20,
  })

  // Debug: Log dos dados recebidos
  console.log('📊 Dashboard - useTeses result:', { 
    isLoading, 
    hasError: !!error, 
    errorMessage: error?.message,
    dataCount: data?.count,
    dataLength: data?.data?.length,
    data: data?.data?.slice(0, 2) // Primeiras 2 teses para debug
  })

  // Mapear user_id para nome do criador
  const getCreatorName = (userId: string | null) => {
    if (!userId || !profiles) return null
    const creator = profiles.find(p => p.id === userId)
    return creator?.nome || null
  }

  // Estatísticas
  const totalTeses = data?.count || 0
  const areasCount = new Set(data?.data.map((t) => t.area).filter(Boolean) || []).size
  const assuntosCount = new Set(
    data?.data.flatMap((t) => t.assuntos || []).filter(Boolean) || []
  ).size

  // Métricas para gráficos
  const metrics = useMemo(() => {
    if (!data?.data) return { byArea: [], byMonth: [], byCreator: [] }
    
    // Teses por área
    const areaMap = new Map<string, number>()
    data.data.forEach(t => {
      const a = t.area || 'Sem área'
      areaMap.set(a, (areaMap.get(a) || 0) + 1)
    })
    const byArea = Array.from(areaMap.entries()).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
    
    // Teses por mês (últimos 6 meses)
    const monthMap = new Map<string, number>()
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      monthMap.set(key, 0)
    }
    data.data.forEach(t => {
      const d = new Date(t.created_at)
      const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + 1)
      }
    })
    const byMonth = Array.from(monthMap.entries()).map(([name, count]) => ({ name, count }))
    
    // Teses por criador
    const creatorMap = new Map<string, number>()
    data.data.forEach(t => {
      const name = getCreatorName(t.user_id) || 'Desconhecido'
      creatorMap.set(name, (creatorMap.get(name) || 0) + 1)
    })
    const byCreator = Array.from(creatorMap.entries()).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    return { byArea, byMonth, byCreator }
  }, [data?.data, profiles])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const areas = Array.from(
    new Set(data?.data.map((t) => t.area).filter(Boolean) || [])
  ).sort()

  const assuntos = Array.from(
    new Set(data?.data.flatMap((t) => t.assuntos || []).filter(Boolean) || [])
  ).sort()

  const toggleSelectTese = (teseId: string) => {
    const newSelected = new Set(selectedTeses)
    if (newSelected.has(teseId)) {
      newSelected.delete(teseId)
    } else {
      newSelected.add(teseId)
    }
    setSelectedTeses(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedTeses.size === data?.data.length) {
      setSelectedTeses(new Set())
    } else {
      setSelectedTeses(new Set(data?.data.map((t) => t.id)))
    }
  }

  const handleEditSelected = () => {
    if (selectedTeses.size === 0) {
      toast({
        title: 'Nenhuma tese selecionada',
        description: 'Selecione pelo menos uma tese para editar',
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
    if (e) {
      e.stopPropagation()
    }
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
        const newSet = new Set(prev)
        newSet.delete(teseToDelete)
        return newSet
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir tese',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setTeseToDelete(null)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/logos/LOGO-HORIZONTAL-AZUL.png" 
              alt="Fênix I.A" 
              className="h-10 w-auto"
              onError={(e) => {
                // Fallback se a imagem não carregar
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent && !parent.querySelector('.fallback-icon')) {
                  const fallback = document.createElement('div')
                  fallback.className = 'fallback-icon flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-md'
                  fallback.innerHTML = '<svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>'
                  parent.insertBefore(fallback, target)
                }
              }}
            />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-fenix-navy to-fenix-purple-dark bg-clip-text text-transparent">
                Fênix I.A
              </h1>
              <p className="text-xs text-white">Banco de Teses Jurídicas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Badge de Role */}
            {profile && (
              <div className="flex items-center gap-2 mr-2">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  profile.role === 'admin' 
                    ? 'bg-red-500/20 text-red-700 border border-red-500/30' 
                    : profile.role === 'supervisor'
                    ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                    : profile.role === 'estagiario'
                    ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                    : 'bg-purple-500/20 text-purple-700 border border-purple-500/30'
                }`}>
                  <Shield className="inline h-3 w-3 mr-1" />
                  {profile.role}
                </span>
                <span className="text-xs text-gray-500">{profile.nome}</span>
              </div>
            )}
            <Button
              onClick={() => setAiGenerateModalOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light hover:from-fenix-purple-dark/90 hover:to-fenix-purple-light/90 shadow-sm text-white"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar com IA
            </Button>
            <Button onClick={() => setUploadWordModalOpen(true)} size="sm" className="shadow-sm">
              <FileUp className="mr-2 h-4 w-4" />
              Upload Word
            </Button>
            <Button onClick={() => setImportModalOpen(true)} variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Excel
            </Button>
            {/* Botão de Gerenciar Usuários - apenas para Admin */}
            {isAdmin && (
              <Button 
                onClick={() => navigate('/users')} 
                variant="outline" 
                size="sm"
                className="border-red-500/30 text-red-700 hover:bg-red-500/10"
              >
                <Users className="mr-2 h-4 w-4" />
                Usuários
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Estatísticas - Visual Tecnológico e Profissional */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="border shadow-xl transition-all hover:border-blue-500/50 hover:shadow-blue-500/20 !bg-[#101f2e] !border-[#101f2e]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-white">Total de Teses</p>
                  <p className="text-3xl font-bold text-white mt-2">{totalTeses}</p>
                </div>
                <div className="rounded-lg bg-blue-500/20 p-3 border border-blue-500/30">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xl transition-all hover:border-emerald-500/50 hover:shadow-emerald-500/20 !bg-[#101f2e] !border-[#101f2e]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-white">Áreas Jurídicas</p>
                  <p className="text-3xl font-bold text-white mt-2">{areasCount}</p>
                </div>
                <div className="rounded-lg bg-emerald-500/20 p-3 border border-emerald-500/30">
                  <BarChart3 className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xl transition-all hover:border-purple-500/50 hover:shadow-purple-500/20 !bg-[#101f2e] !border-[#101f2e]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-white">Assuntos</p>
                  <p className="text-3xl font-bold text-white mt-2">{assuntosCount}</p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-3 border border-purple-500/30">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xl transition-all hover:border-amber-500/50 hover:shadow-amber-500/20 !bg-[#101f2e] !border-[#101f2e]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-white">Produtividade</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {selectedTeses.size > 0 ? selectedTeses.size : '—'}
                  </p>
                  <p className="text-xs mt-1 text-white">selecionadas</p>
                </div>
                <div className="rounded-lg bg-amber-500/20 p-3 border border-amber-500/30">
                  <Zap className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas - Visual Tecnológico */}
        <Card className="mb-6 border shadow-xl !bg-[#101f2e] !border-[#101f2e]">
          <CardHeader className="border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-5 w-5 text-purple-400" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Button
                onClick={() => setAiGenerateModalOpen(true)}
                variant="outline"
                className="h-auto flex-col items-start justify-start p-5 hover:bg-gradient-to-br hover:from-purple-600/20 hover:to-purple-700/20 hover:border-purple-500/50 transition-all group"
                style={{ borderColor: '#101f2e', backgroundColor: '#101f2e' }}
              >
                <div className="rounded-lg bg-purple-500/20 p-3 border border-purple-500/30 group-hover:border-purple-400/50 mb-3">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
                <span className="font-semibold text-white mb-1">Gerar com IA</span>
                <span className="text-xs text-white">Crie teses com inteligência artificial</span>
              </Button>
              <Button
                onClick={() => setUploadWordModalOpen(true)}
                variant="outline"
                className="h-auto flex-col items-start justify-start p-5 hover:bg-blue-600/20 hover:border-blue-500/50 transition-all group"
                style={{ borderColor: '#101f2e', backgroundColor: '#101f2e' }}
              >
                <div className="rounded-lg bg-blue-500/20 p-3 border border-blue-500/30 group-hover:border-blue-400/50 mb-3">
                  <FileUp className="h-6 w-6 text-blue-400" />
                </div>
                <span className="font-semibold text-white mb-1">Upload Word</span>
                <span className="text-xs text-white">Importe teses de arquivos Word</span>
              </Button>
              <Button
                onClick={() => setImportModalOpen(true)}
                variant="outline"
                className="h-auto flex-col items-start justify-start p-5 hover:bg-emerald-600/20 hover:border-emerald-500/50 transition-all group"
                style={{ borderColor: '#101f2e', backgroundColor: '#101f2e' }}
              >
                <div className="rounded-lg bg-emerald-500/20 p-3 border border-emerald-500/30 group-hover:border-emerald-400/50 mb-3">
                  <Upload className="h-6 w-6 text-emerald-400" />
                </div>
                <span className="font-semibold text-white mb-1">Importar Excel</span>
                <span className="text-xs text-white">Importe múltiplas teses via Excel</span>
              </Button>
              {selectedTeses.size > 0 && (
                <Button
                  onClick={handleEditSelected}
                  className="h-auto flex-col items-start justify-start p-5 bg-gradient-to-r from-fenix-purple-dark to-fenix-purple-light hover:from-fenix-purple-dark/90 hover:to-fenix-purple-light/90 shadow-lg shadow-purple-500/20 border-0"
                >
                  <div className="rounded-lg bg-white/20 p-3 border border-white/30 mb-3">
                    <Edit className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-semibold text-white mb-1">Editar Selecionadas</span>
                  <span className="text-xs text-primary-foreground/80">
                    {selectedTeses.size} tese(s) pronta(s) para edição
                  </span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filtros e Controles */}
        <div className="mb-6 space-y-4">
          <Card className="border shadow-xl !bg-[#101f2e] !border-[#101f2e]">
            <CardContent className="pt-6">
              {/* Linha 1: Busca, Área, Assunto */}
              <div className="grid gap-4 md:grid-cols-4 mb-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
                  <Input
                    placeholder="Buscar por título, descrição ou conteúdo..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="pl-10 text-white placeholder:text-white/60 focus:border-purple-500 focus:ring-purple-500/20"
                    style={{ backgroundColor: '#101f2e', borderColor: '#101f2e' }}
                  />
                </div>
                <Select value={area} onValueChange={(value) => {
                  setArea(value)
                  setPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as áreas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as áreas</SelectItem>
                    {areas.map((a) => (
                      <SelectItem key={a} value={a || 'unknown'}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={assunto} onValueChange={(value) => {
                  setAssunto(value)
                  setPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os assuntos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os assuntos</SelectItem>
                    {assuntos.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Linha 2: Filtros avançados */}
              <div className="grid gap-4 md:grid-cols-5">
                {/* Filtro por Criador */}
                <Select value={criadorId} onValueChange={(value) => {
                  setCriadorId(value)
                  setPage(1)
                }}>
                  <SelectTrigger className="bg-white text-black border-gray-300">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Todos os criadores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os criadores</SelectItem>
                    {profiles?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Data Início */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 z-10" />
                  <Input
                    type="date"
                    placeholder="Data início"
                    value={dataInicio}
                    onChange={(e) => {
                      setDataInicio(e.target.value)
                      setPage(1)
                    }}
                    className="pl-10 bg-white text-black border-gray-300 placeholder:text-gray-500"
                  />
                </div>
                
                {/* Data Fim */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 z-10" />
                  <Input
                    type="date"
                    placeholder="Data fim"
                    value={dataFim}
                    onChange={(e) => {
                      setDataFim(e.target.value)
                      setPage(1)
                    }}
                    className="pl-10 bg-white text-black border-gray-300 placeholder:text-gray-500"
                  />
                </div>
                
                {/* Ordenação */}
                <Select value={ordenacao} onValueChange={(value: 'recentes' | 'antigos' | 'titulo_asc' | 'titulo_desc') => {
                  setOrdenacao(value)
                  setPage(1)
                }}>
                  <SelectTrigger className="bg-white text-black border-gray-300">
                    <ArrowUpDown className="h-4 w-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recentes">Mais recentes</SelectItem>
                    <SelectItem value="antigos">Mais antigos</SelectItem>
                    <SelectItem value="titulo_asc">Título A-Z</SelectItem>
                    <SelectItem value="titulo_desc">Título Z-A</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Botão Métricas */}
                <Button
                  variant={showMetrics ? 'default' : 'outline'}
                  onClick={() => setShowMetrics(!showMetrics)}
                  className={showMetrics 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-white text-black border-gray-300 hover:bg-gray-200 hover:text-black'
                  }
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Métricas
                </Button>
              </div>
              
              {/* Botão Limpar Filtros */}
              {(search || area !== 'all' || assunto !== 'all' || criadorId !== 'all' || dataInicio || dataFim) && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch('')
                      setArea('all')
                      setAssunto('all')
                      setCriadorId('all')
                      setDataInicio('')
                      setDataFim('')
                      setOrdenacao('recentes')
                      setPage(1)
                    }}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Seção de Métricas */}
          {showMetrics && (
            <Card className="border shadow-xl !bg-[#101f2e] !border-[#101f2e]">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  Métricas e Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Teses por Área */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      Teses por Área
                    </h4>
                    <div className="space-y-2">
                      {metrics.byArea.map((item, i) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div 
                            className="h-3 rounded-full" 
                            style={{ 
                              width: `${Math.max(20, (item.count / (metrics.byArea[0]?.count || 1)) * 100)}%`,
                              backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i % 5]
                            }}
                          />
                          <span className="text-xs text-white/70 whitespace-nowrap">{item.name}</span>
                          <span className="text-xs font-bold text-white ml-auto">{item.count}</span>
                        </div>
                      ))}
                      {metrics.byArea.length === 0 && (
                        <p className="text-xs text-white/50">Nenhum dado disponível</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Teses por Mês */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Teses por Mês
                    </h4>
                    <div className="flex items-end gap-1 h-24">
                      {metrics.byMonth.map((item) => (
                        <div key={item.name} className="flex-1 flex flex-col items-center gap-1">
                          <div 
                            className="w-full bg-purple-500 rounded-t"
                            style={{ 
                              height: `${Math.max(4, (item.count / Math.max(...metrics.byMonth.map(m => m.count), 1)) * 80)}px`
                            }}
                          />
                          <span className="text-[10px] text-white/60">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Top Criadores */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Top Criadores
                    </h4>
                    <div className="space-y-2">
                      {metrics.byCreator.map((item, i) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-purple-500/30 flex items-center justify-center text-xs text-white font-bold">
                            {i + 1}
                          </div>
                          <span className="text-sm text-white/80 flex-1 truncate">{item.name}</span>
                          <span className="text-sm font-bold text-purple-400">{item.count}</span>
                        </div>
                      ))}
                      {metrics.byCreator.length === 0 && (
                        <p className="text-xs text-white/50">Nenhum dado disponível</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Barra de ações */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedTeses.size > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-purple-500/20 px-4 py-2 border border-purple-500/30 backdrop-blur-sm">
                  <CheckSquare className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">
                    {selectedTeses.size} selecionada{selectedTeses.size > 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTeses(new Set())}
                    className="h-6 w-6 p-0 hover:bg-purple-500/20 text-purple-400"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border p-1 shadow-lg !bg-[#101f2e] !border-[#101f2e]">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30' : 'hover:text-white text-white'}`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30' : 'hover:text-white text-white'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              {data && (
                <span className="text-sm font-medium text-white">
                  {data.count} tese{data.count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto"></div>
              <p className="text-sm text-white">Carregando teses...</p>
            </div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-500">
                {error.message || 'Erro ao carregar teses'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Verifique o console para mais detalhes
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4"
                variant="outline"
              >
                Recarregar
              </Button>
            </CardContent>
          </Card>
        ) : !data || !data.data || data.data.length === 0 ? (
          <Card className="border shadow-xl !bg-[#101f2e] !border-[#101f2e]">
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-white" />
              <p className="text-lg font-semibold text-white">Nenhuma tese encontrada</p>
              <p className="mt-2 text-sm text-white">
                Tente ajustar os filtros ou importe novas teses
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button 
                  onClick={() => setUploadWordModalOpen(true)} 
                  variant="outline"
                  className="text-white hover:text-white"
                  style={{ borderColor: '#101f2e' }}
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload Word
                </Button>
                <Button 
                  onClick={() => setImportModalOpen(true)} 
                  variant="outline"
                  className="hover:text-white text-white"
                  style={{ borderColor: '#101f2e' }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <>
            {/* Grid View */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedTeses.size === data.data.length && data.data.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-white">Selecionar todas</span>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.data.map((tese) => (
                <TeseCard
                  key={tese.id}
                  tese={tese}
                  isSelected={selectedTeses.has(tese.id)}
                  onSelect={() => toggleSelectTese(tese.id)}
                  onEdit={() => handleEditSingle(tese.id)}
                  onDelete={(e) => handleDeleteClick(tese.id, e)}
                  canDelete={!isEstagiario && (canDeleteTeses || tese.user_id === user?.id)}
                  canEdit={canEditAllTeses || tese.user_id === user?.id}
                  creatorName={getCreatorName(tese.user_id)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* List View */}
            <Card className="border shadow-xl !bg-[#101f2e] !border-[#101f2e]">
              <CardContent className="p-0">
                <div className="divide-y" style={{ borderColor: '#101f2e' }}>
                  {data.data.map((tese) => (
                    <TeseListItem
                      key={tese.id}
                      tese={tese}
                      isSelected={selectedTeses.has(tese.id)}
                      onSelect={() => toggleSelectTese(tese.id)}
                      onEdit={() => handleEditSingle(tese.id)}
                      onDelete={(e) => handleDeleteClick(tese.id, e)}
                      canDelete={!isEstagiario && (canDeleteTeses || tese.user_id === user?.id)}
                      canEdit={canEditAllTeses || tese.user_id === user?.id}
                      creatorName={getCreatorName(tese.user_id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Paginação */}
        {data && data.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-white">
              Página {data.page} de {data.totalPages} • {data.count} total
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-white hover:text-white disabled:opacity-50"
                style={{ borderColor: '#101f2e' }}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="text-white hover:text-white disabled:opacity-50"
                style={{ borderColor: '#101f2e' }}
              >
                Próxima
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} />
      <UploadWordModal open={uploadWordModalOpen} onOpenChange={setUploadWordModalOpen} />
      <AIGenerateModal open={aiGenerateModalOpen} onOpenChange={setAiGenerateModalOpen} />

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tese? Esta ação não pode ser desfeita.
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

// Componente Card para Grid View
function TeseCard({
  tese,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  canDelete,
  canEdit,
  creatorName,
}: {
  tese: Tese
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: (e: React.MouseEvent) => void
  canDelete: boolean
  canEdit: boolean
  creatorName: string | null
}) {
  return (
    <Card
      className={`group cursor-pointer border-2 transition-all hover:shadow-xl hover:scale-[1.02] ${
        isSelected 
          ? 'border-purple-500 bg-purple-600 shadow-lg shadow-purple-500/20' 
          : 'hover:border-purple-500/30 !bg-[#101f2e] !border-[#101f2e]'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <Checkbox checked={isSelected} onCheckedChange={onSelect} />
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="hover:text-white text-white"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <h3 className={`mb-2 line-clamp-2 font-semibold leading-tight ${isSelected ? 'text-white' : 'text-white'}`}>{tese.titulo}</h3>
        {tese.descricao && (
          <p className={`mb-3 line-clamp-2 text-sm ${isSelected ? 'text-white/90' : 'text-white/80'}`}>{tese.descricao}</p>
        )}
        <div className="mb-3 flex flex-wrap gap-1">
          {tese.area && (
            <span className={`rounded-full border px-2 py-1 text-xs font-medium ${isSelected ? 'bg-white/20 border-white/30 text-white' : 'bg-blue-500/20 border-blue-500/30 text-blue-400'}`}>
              {tese.area}
            </span>
          )}
          {tese.assuntos?.slice(0, 2).map((a, i) => (
            <span
              key={i}
              className={`rounded-full border px-2 py-1 text-xs font-medium ${isSelected ? 'bg-white/20 border-white/30 text-white' : 'bg-purple-500/20 border-purple-500/30 text-purple-400'}`}
            >
              {a}
            </span>
          ))}
          {tese.assuntos && tese.assuntos.length > 2 && (
            <span className={`rounded-full border px-2 py-1 text-xs ${isSelected ? 'bg-white/20 border-white/30 text-white' : 'text-white'}`} style={!isSelected ? { backgroundColor: '#101f2e', borderColor: '#101f2e' } : {}}>
              +{tese.assuntos.length - 2}
            </span>
          )}
        </div>
        <div className={`flex items-center justify-between text-xs ${isSelected ? 'text-white' : 'text-white'}`}>
          <div className="flex flex-col">
            <span>{new Date(tese.created_at).toLocaleDateString('pt-BR')}</span>
            {creatorName && (
              <span className="text-[10px] opacity-70 flex items-center gap-1">
                <User className="h-3 w-3" />
                {creatorName}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="h-7 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
          >
            Abrir →
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente List Item
function TeseListItem({
  tese,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  canDelete,
  canEdit,
  creatorName,
}: {
  tese: Tese
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: (e: React.MouseEvent) => void
  canDelete: boolean
  canEdit: boolean
  creatorName: string | null
}) {
  return (
    <div
      className={`flex items-center gap-4 p-4 transition-colors border-b ${
        isSelected ? 'bg-purple-600 border-purple-500' : '!bg-[#101f2e] !border-[#101f2e]'
      }`}
    >
      <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          {tese.area && (
            <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-xs font-medium text-blue-400">
              {tese.area}
            </span>
          )}
        </div>
        <h3 className="mb-1 font-semibold text-white">{tese.titulo}</h3>
        {tese.descricao && (
          <p className="mb-2 line-clamp-1 text-sm text-white/80">{tese.descricao}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {tese.assuntos?.slice(0, 3).map((a, i) => (
            <span
              key={i}
              className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-xs font-medium text-purple-400"
            >
              {a}
            </span>
          ))}
          {tese.assuntos && tese.assuntos.length > 3 && (
            <span className="text-xs text-white">+{tese.assuntos.length - 3}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col text-xs text-white text-right">
          <span>{new Date(tese.created_at).toLocaleDateString('pt-BR')}</span>
          {creatorName && (
            <span className="text-xs opacity-75 flex items-center gap-1 justify-end">
              <User className="h-3 w-3" />
              {creatorName}
            </span>
          )}
        </div>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit} className="hover:text-white text-white">
            <Edit className="mr-2 h-4 w-4 text-white" />
            Editar
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        )}
      </div>
    </div>
  )
}
