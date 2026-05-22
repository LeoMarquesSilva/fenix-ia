import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  ArrowLeft,
  Crown,
  Briefcase,
  Eye,
  GraduationCap,
  Check,
  X,
  Shield,
  FileText,
  Users,
  Trash2,
  Edit,
  Upload,
  Download,
  Sparkles,
} from 'lucide-react'

interface Permission {
  name: string
  icon: React.ReactNode
  admin: boolean
  advogado: boolean
  supervisor: boolean
  estagiario: boolean
}

/** Permissões alinhadas ao que o sistema oferece hoje (acervo, Word, IA, Excel, admin). */
const permissions: Permission[] = [
  {
    name: 'Ver acervo (teses e consultivos)',
    icon: <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />,
    admin: true,
    advogado: true,
    supervisor: true,
    estagiario: true,
  },
  {
    name: 'Criar ou importar teses (Word, Excel, fluxos)',
    icon: <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />,
    admin: true,
    advogado: true,
    supervisor: true,
    estagiario: true,
  },
  {
    name: 'Salvar alterações no texto das teses no editor',
    icon: <Edit className="h-4 w-4 shrink-0 text-muted-foreground" />,
    admin: true,
    advogado: false,
    supervisor: true,
    estagiario: true,
  },
  {
    name: 'Editar conteúdo de outros usuários',
    icon: <Edit className="h-4 w-4 shrink-0 text-muted-foreground" />,
    admin: true,
    advogado: false,
    supervisor: true,
    estagiario: false,
  },
  {
    name: 'Excluir itens do acervo',
    icon: <Trash2 className="h-4 w-4 shrink-0 text-muted-foreground" />,
    admin: true,
    advogado: true,
    supervisor: true,
    estagiario: false,
  },
  {
    name: 'Exportar para Word',
    icon: <Download className="h-4 w-4 shrink-0 text-muted-foreground" />,
    admin: true,
    advogado: true,
    supervisor: true,
    estagiario: true,
  },
  {
    name: 'Assistente de IA (geração / apoio)',
    icon: <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />,
    admin: true,
    advogado: true,
    supervisor: true,
    estagiario: true,
  },
  {
    name: 'Importar via Excel / Word',
    icon: <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />,
    admin: true,
    advogado: true,
    supervisor: true,
    estagiario: false,
  },
  {
    name: 'Gerenciar usuários e funções',
    icon: <Users className="h-4 w-4 shrink-0 text-muted-foreground" />,
    admin: true,
    advogado: false,
    supervisor: false,
    estagiario: false,
  },
  {
    name: 'Métricas e painel administrativo',
    icon: <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />,
    admin: true,
    advogado: false,
    supervisor: false,
    estagiario: false,
  },
]

const roleDetails = [
  {
    role: 'admin',
    title: 'Administrador',
    icon: <Crown className="h-8 w-8" />,
    accent: 'from-destructive/80 to-orange-500/90',
    iconWrap: 'bg-destructive/10 text-destructive border-destructive/20',
    description:
      'Acesso total: usuários, funções, acervo (teses e consultivos), métricas e exportações.',
    responsibilities: [
      'Criar e gerenciar usuários',
      'Ver e editar qualquer item do acervo',
      'Acessar métricas e visão consolidada',
      'Alterar funções e permissões da equipe',
    ],
  },
  {
    role: 'supervisor',
    title: 'Supervisor',
    icon: <Eye className="h-8 w-8" />,
    accent: 'from-primary to-cyan-500/80',
    iconWrap: 'bg-primary/10 text-primary border-primary/20',
    description:
      'Supervisiona o acervo: pode revisar e editar conteúdo da equipe, com mais liberdade que advogado.',
    responsibilities: [
      'Revisar teses e consultivos da equipe',
      'Editar documentos de outros usuários',
      'Orientar estagiários e advogados',
      'Manter padrão de qualidade no acervo',
    ],
  },
  {
    role: 'advogado',
    title: 'Advogado',
    icon: <Briefcase className="h-8 w-8" />,
    accent: 'from-fenix-purple-dark to-fenix-purple-light',
    iconWrap:
      'bg-fenix-purple-dark/10 text-fenix-purple-dark border-fenix-purple-dark/25 dark:text-fenix-purple-light',
    description:
      'Consulta o acervo (visualização), importa e cria teses; não salva alterações no texto das teses no editor; exporta, exclui e usa fluxos conforme política.',
    responsibilities: [
      'Visualizar teses, copiar e exportar para Word',
      'Criar/importar teses e usar o acervo para consulta',
      'Buscar e filtrar o acervo',
      'Não altera o conteúdo textual salvo das teses no acervo',
    ],
  },
  {
    role: 'estagiario',
    title: 'Estagiário',
    icon: <GraduationCap className="h-8 w-8" />,
    accent: 'from-emerald-600 to-teal-500/80',
    iconWrap: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-400',
    description:
      'Acesso de aprendizado: cria e edita o próprio material; sem exclusão ampla nem importações administrativas.',
    responsibilities: [
      'Criar e editar apenas documentos próprios',
      'Consultar o acervo para estudo',
      'Exportar Word e usar IA com orientação',
      'Sem permissão para excluir ou importar Excel',
    ],
  },
]

function PermCell({ allowed }: { allowed: boolean }) {
  return (
    <TableCell className="text-center">
      {allowed ? (
        <Check className="mx-auto h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
      )}
    </TableCell>
  )
}

export default function RolesInfo() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  if (!isAdmin) {
    return (
      <div className="container mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-4 py-12">
        <Card className="w-full border bg-card shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <Shield className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Acesso restrito
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Apenas administradores visualizam funções e permissões.
            </p>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Ir ao dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Usuários
        </Button>
      </div>

      <PageHeader
        title="Funções e permissões"
        description="Papéis da equipe no Fênix I.A e o que cada um pode fazer no acervo, exportações e administração."
      />

      <div className="mb-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {roleDetails.map((role) => (
          <Card
            key={role.role}
            className="overflow-hidden border bg-card shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`h-1.5 bg-gradient-to-r ${role.accent}`} />
            <CardHeader className="pb-2">
              <div
                className={`mb-3 flex h-14 w-14 items-center justify-center rounded-xl border ${role.iconWrap}`}
              >
                {role.icon}
              </div>
              <CardTitle className="text-lg">{role.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {role.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Responsabilidades
              </h4>
              <ul className="space-y-2">
                {role.responsibilities.map((resp, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {resp}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border bg-card shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Matriz de permissões
          </CardTitle>
          <CardDescription>
            Comparativo por função. O controle efetivo pode seguir regras do banco de dados
            (RLS).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Permissão</TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Crown className="h-5 w-5 text-destructive" />
                    <span className="text-xs font-normal">Admin</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Eye className="h-5 w-5 text-primary" />
                    <span className="text-xs font-normal">Supervisor</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Briefcase className="h-5 w-5 text-fenix-purple-dark dark:text-fenix-purple-light" />
                    <span className="text-xs font-normal">Advogado</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-normal">Estagiário</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((perm, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      {perm.icon}
                      {perm.name}
                    </div>
                  </TableCell>
                  <PermCell allowed={perm.admin} />
                  <PermCell allowed={perm.supervisor} />
                  <PermCell allowed={perm.advogado} />
                  <PermCell allowed={perm.estagiario} />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Permitido</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="h-4 w-4 text-muted-foreground/50" />
          <span>Não permitido</span>
        </div>
      </div>
    </div>
  )
}
