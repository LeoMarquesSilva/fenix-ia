import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  FileSignature,
  FilePenLine,
  MessageSquare,
  Scale,
  Lightbulb,
  Layers,
  LayoutDashboard,
  LogOut,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  Settings,
  Shield,
  Sun,
  User,
  Users,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSidebarLayout } from '@/contexts/SidebarLayoutContext'
import { toggleTheme } from '@/lib/theme'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

function roleLabel(role: string | undefined) {
  switch (role) {
    case 'admin':
      return 'Administrador'
    case 'supervisor':
      return 'Supervisor'
    case 'advogado':
      return 'Advogado'
    case 'estagiario':
      return 'Estagiário'
    default:
      return 'Usuário'
  }
}

function initials(nome: string | null | undefined) {
  if (!nome?.trim()) return '?'
  const p = nome.trim().split(/\s+/)
  if (p.length >= 2)
    return (p[0][0] + p[p.length - 1][0]).toUpperCase()
  return nome.slice(0, 2).toUpperCase()
}

export function AppSidebar({
  onNavigate,
  forceExpanded,
}: {
  onNavigate?: () => void
  forceExpanded?: boolean
}) {
  const { collapsed, toggleCollapsed } = useSidebarLayout()
  const collapsedUI = forceExpanded ? false : collapsed
  const { profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )

  const sp = new URLSearchParams(location.search)
  const tab = sp.get('tab')

  const isDashboardHome = location.pathname === '/dashboard' && tab !== 'metrics'
  const isRelatorios = location.pathname === '/dashboard' && tab === 'metrics'
  const isProfile = location.pathname === '/profile'
  const isUsers = location.pathname === '/users'
  const isRoles = location.pathname === '/roles'
  const isSolicitarTese = location.pathname === '/solicitar-tese'
  const isPeticaoInicial = location.pathname === '/peticao-inicial'
  const isContestacaoRecurso = location.pathname === '/peticao-contestacao-recurso'
  const isManifestacoes = location.pathname === '/manifestacoes'
  const isContratos = location.pathname === '/contratos'

  const isPeticaoSectionActive =
    isPeticaoInicial || isContestacaoRecurso || isManifestacoes

  const [gerarPeticaoOpen, setGerarPeticaoOpen] = useState(isPeticaoSectionActive)

  useEffect(() => {
    if (isPeticaoSectionActive) setGerarPeticaoOpen(true)
  }, [isPeticaoSectionActive])

  const navClass = (active: boolean) =>
    cn(
      'flex min-h-[40px] w-full items-center gap-3 rounded-lg border-l-4 px-3 py-2 text-sm font-medium transition-colors',
      collapsedUI && 'justify-center rounded-md border-l-0 px-0',
      active
        ? collapsedUI
          ? 'bg-fenix-navy/15 text-fenix-navy ring-2 ring-fenix-navy/40 dark:bg-primary/25 dark:text-primary-foreground dark:ring-primary/40 [&_svg]:!text-fenix-navy dark:[&_svg]:!text-primary-foreground'
          : 'border-fenix-purple-dark bg-fenix-purple-dark/15 text-fenix-purple-dark dark:border-fenix-purple-light dark:bg-fenix-purple-dark/25 dark:text-fenix-purple-light [&_svg]:text-current'
        : 'border-transparent text-sidebar-foreground hover:bg-muted/70 dark:hover:bg-white/10'
    )

  const wrapTooltip = (label: string, node: ReactNode) => {
    if (!collapsedUI) return node
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  const onSignOut = async () => {
    onNavigate?.()
    try {
      await signOut()
      navigate('/login')
    } catch {
      navigate('/login')
    }
  }

  const syncDarkToggle = () => {
    setDarkMode(document.documentElement.classList.contains('dark'))
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[4px_0_12px_-2px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_12px_-2px_rgba(0,0,0,0.25)] transition-[width] duration-200 ease-out',
        collapsedUI ? 'w-20' : 'w-[280px]'
      )}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-sidebar-border px-3',
          collapsedUI ? 'justify-center' : 'justify-between gap-2'
        )}
      >
        {!collapsedUI && (
          <img
            src="/assets/logos/logo-horizontal-azul-fenix.png"
            alt="Fênix"
            className="h-8 max-w-[160px] object-contain object-left dark:brightness-110 dark:contrast-95"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
        {collapsedUI && (
          <img
            src="/assets/logos/logo-fenix-ia-10.png"
            alt="Fênix I.A"
            className="h-10 w-10 object-contain"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('shrink-0', (collapsedUI || forceExpanded) && 'hidden')}
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <PanelLeftClose className="h-5 w-5" />
        </Button>
      </div>

      {collapsedUI && !forceExpanded && (
        <div className="flex shrink-0 justify-center border-b border-sidebar-border py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={toggleCollapsed}
            aria-label="Expandir menu"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>
      )}

      <nav
        className={cn(
          'flex flex-1 flex-col overflow-y-auto',
          collapsedUI ? 'items-center gap-4 px-2 py-4' : 'gap-2 p-3'
        )}
      >
        {wrapTooltip(
          'Dashboard',
          <NavLink
            to="/dashboard"
            end
            onClick={onNavigate}
            className={navClass(isDashboardHome)}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {!collapsedUI && <span>Dashboard</span>}
          </NavLink>
        )}

        {wrapTooltip(
          'Métricas',
          <NavLink
            to="/dashboard?tab=metrics"
            onClick={onNavigate}
            className={navClass(isRelatorios)}
          >
            <BarChart3 className="h-5 w-5 shrink-0" />
            {!collapsedUI && <span>Métricas</span>}
          </NavLink>
        )}

        {wrapTooltip(
          'Solicitar tese',
          <NavLink
            to="/solicitar-tese"
            onClick={onNavigate}
            className={navClass(isSolicitarTese)}
          >
            <Lightbulb className="h-5 w-5 shrink-0" />
            {!collapsedUI && <span>Solicitar tese</span>}
          </NavLink>
        )}

        {!collapsedUI && (
          <Collapsible open={gerarPeticaoOpen} onOpenChange={setGerarPeticaoOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={cn(
                  navClass(isPeticaoSectionActive),
                  'w-full cursor-pointer text-left outline-none ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  gerarPeticaoOpen &&
                    !isPeticaoSectionActive &&
                    'bg-muted/40 hover:bg-muted/60 dark:bg-white/5 dark:hover:bg-white/10'
                )}
                aria-expanded={gerarPeticaoOpen}
              >
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <Layers className="h-5 w-5 shrink-0" />
                  <span className="truncate">Gerar petição</span>
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 opacity-70 transition-transform duration-200',
                    gerarPeticaoOpen && 'rotate-180',
                    isPeticaoSectionActive && 'opacity-90'
                  )}
                  aria-hidden
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden">
              <div
                className="ml-2 mt-0.5 flex flex-col gap-0.5 border-l-2 border-sidebar-border/70 py-0.5 pl-3 dark:border-white/15"
                role="group"
                aria-label="Opções de Gerar petição"
              >
                <NavLink
                  to="/peticao-inicial"
                  onClick={onNavigate}
                  className={navClass(isPeticaoInicial)}
                >
                  <FilePenLine className="h-5 w-5 shrink-0" />
                  <span>Inicial</span>
                </NavLink>
                <NavLink
                  to="/peticao-contestacao-recurso"
                  onClick={onNavigate}
                  className={navClass(isContestacaoRecurso)}
                >
                  <Scale className="h-5 w-5 shrink-0" />
                  <span>Contestação / Recurso</span>
                </NavLink>
                <NavLink
                  to="/manifestacoes"
                  onClick={onNavigate}
                  className={navClass(isManifestacoes)}
                >
                  <MessageSquare className="h-5 w-5 shrink-0" />
                  <span>Manifestações</span>
                </NavLink>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {collapsedUI && (
          <DropdownMenu>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-10 w-10 rounded-lg',
                      isPeticaoSectionActive &&
                        'bg-fenix-navy/15 text-fenix-navy ring-2 ring-fenix-navy/40 dark:bg-primary/25 dark:text-primary-foreground dark:ring-primary/40'
                    )}
                    aria-label="Gerar Petição"
                  >
                    <Layers className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Gerar Petição
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuItem
                onClick={() => {
                  onNavigate?.()
                  navigate('/peticao-inicial')
                }}
                className="cursor-pointer"
              >
                <FilePenLine className="mr-2 h-4 w-4" />
                Inicial
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onNavigate?.()
                  navigate('/peticao-contestacao-recurso')
                }}
                className="cursor-pointer"
              >
                <Scale className="mr-2 h-4 w-4" />
                Contestação / Recurso
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onNavigate?.()
                  navigate('/manifestacoes')
                }}
                className="cursor-pointer"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Manifestações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Separator className="my-2 bg-sidebar-border" />

        {wrapTooltip(
          'Contratos',
          <NavLink
            to="/contratos"
            onClick={onNavigate}
            className={navClass(isContratos)}
          >
            <FileSignature className="h-5 w-5 shrink-0" />
            {!collapsedUI && <span>Contratos</span>}
          </NavLink>
        )}

        {wrapTooltip(
          'Meu perfil',
          <NavLink
            to="/profile"
            onClick={onNavigate}
            className={navClass(isProfile)}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!collapsedUI && <span>Meu perfil</span>}
          </NavLink>
        )}

        {isAdmin &&
          wrapTooltip(
            'Usuários',
            <NavLink
              to="/users"
              onClick={onNavigate}
              className={navClass(isUsers)}
            >
              <Users className="h-5 w-5 shrink-0" />
              {!collapsedUI && <span>Usuários</span>}
            </NavLink>
          )}

        {isAdmin &&
          wrapTooltip(
            'Funções e permissões',
            <NavLink
              to="/roles"
              onClick={onNavigate}
              className={navClass(isRoles)}
            >
              <Shield className="h-5 w-5 shrink-0" />
              {!collapsedUI && <span>Funções</span>}
            </NavLink>
          )}
      </nav>

      <Separator className="bg-sidebar-border" />

      <div className={cn('shrink-0 p-3', collapsedUI && 'flex flex-col items-center gap-3')}>
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border border-sidebar-border bg-muted/30 p-2 dark:bg-white/5',
            collapsedUI && 'flex-col border-0 bg-transparent p-0'
          )}
        >
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {initials(profile?.nome)}
            </div>
            <span
              className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-emerald-500"
              title="Online"
              aria-hidden
            />
          </div>
          {!collapsedUI && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {profile?.nome || 'Usuário'}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                {roleLabel(profile?.role)}
              </p>
            </div>
          )}
          {!collapsedUI && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Meu perfil
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/users')}>
                      <Users className="mr-2 h-4 w-4" />
                      Usuários
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/roles')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Funções
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    toggleTheme()
                    syncDarkToggle()
                  }}
                >
                  {darkMode ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  {darkMode ? 'Modo claro' : 'Modo escuro'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {collapsedUI && !forceExpanded && (
          <DropdownMenu>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">Conta</TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" align="end">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                Perfil
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/users')}>
                  Usuários
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  toggleTheme()
                  syncDarkToggle()
                }}
              >
                Tema
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSignOut}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {!collapsedUI && (
          <Button
            variant="ghost"
            className="mt-2 w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        )}
        {collapsedUI &&
          wrapTooltip(
            'Sair',
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive"
              onClick={onSignOut}
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
      </div>
    </aside>
  )
}
