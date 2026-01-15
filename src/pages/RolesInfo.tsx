import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Settings
} from 'lucide-react'

interface Permission {
  name: string
  icon: React.ReactNode
  admin: boolean
  advogado: boolean
  supervisor: boolean
  estagiario: boolean
}

const permissions: Permission[] = [
  {
    name: 'Visualizar todas as teses',
    icon: <FileText className="h-4 w-4" />,
    admin: true,
    advogado: true,
    supervisor: true,
    estagiario: true,
  },
  {
    name: 'Criar novas teses',
    icon: <Upload className="h-4 w-4" />,
    admin: true,
    advogado: true,
    supervisor: true,
    estagiario: true,
  },
  {
    name: 'Editar próprias teses',
    icon: <Edit className="h-4 w-4" />,
    admin: true,
    advogado: true,
    supervisor: true,
    estagiario: true,
  },
  {
    name: 'Editar teses de outros',
    icon: <Edit className="h-4 w-4" />,
    admin: true,
    advogado: false,
    supervisor: true,
    estagiario: false,
  },
  {
    name: 'Excluir teses',
    icon: <Trash2 className="h-4 w-4" />,
    admin: true,
    advogado: true,
    supervisor: true,
    estagiario: false,
  },
  {
    name: 'Exportar para Word',
    icon: <Download className="h-4 w-4" />,
    admin: true,
    advogado: true,
    supervisor: true,
    estagiario: true,
  },
  {
    name: 'Usar IA para gerar teses',
    icon: <Sparkles className="h-4 w-4" />,
    admin: true,
    advogado: true,
    supervisor: true,
    estagiario: true,
  },
  {
    name: 'Importar Excel',
    icon: <Upload className="h-4 w-4" />,
    admin: true,
    advogado: true,
    supervisor: true,
    estagiario: false,
  },
  {
    name: 'Gerenciar usuários',
    icon: <Users className="h-4 w-4" />,
    admin: true,
    advogado: false,
    supervisor: false,
    estagiario: false,
  },
  {
    name: 'Criar novos usuários',
    icon: <Users className="h-4 w-4" />,
    admin: true,
    advogado: false,
    supervisor: false,
    estagiario: false,
  },
  {
    name: 'Alterar roles de usuários',
    icon: <Shield className="h-4 w-4" />,
    admin: true,
    advogado: false,
    supervisor: false,
    estagiario: false,
  },
  {
    name: 'Excluir usuários',
    icon: <Trash2 className="h-4 w-4" />,
    admin: true,
    advogado: false,
    supervisor: false,
    estagiario: false,
  },
  {
    name: 'Acessar configurações do sistema',
    icon: <Settings className="h-4 w-4" />,
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
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    description: 'Acesso total ao sistema. Pode gerenciar usuários, configurações e todas as teses.',
    responsibilities: [
      'Gerenciar todos os usuários do sistema',
      'Criar, editar e excluir qualquer tese',
      'Definir roles e permissões',
      'Configurar integrações e APIs',
      'Monitorar métricas e estatísticas',
    ],
  },
  {
    role: 'supervisor',
    title: 'Supervisor',
    icon: <Eye className="h-8 w-8" />,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    description: 'Supervisiona o trabalho da equipe. Pode editar teses de outros e gerenciar conteúdo.',
    responsibilities: [
      'Revisar e aprovar teses criadas pela equipe',
      'Editar teses de qualquer usuário',
      'Excluir teses quando necessário',
      'Orientar estagiários e advogados',
      'Garantir qualidade do conteúdo',
    ],
  },
  {
    role: 'advogado',
    title: 'Advogado',
    icon: <Briefcase className="h-8 w-8" />,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    description: 'Profissional jurídico completo. Pode criar, editar e excluir suas próprias teses.',
    responsibilities: [
      'Criar e gerenciar próprias teses',
      'Pesquisar e consultar banco de teses',
      'Exportar documentos para Word',
      'Utilizar ferramentas de IA',
      'Importar dados via Excel',
    ],
  },
  {
    role: 'estagiario',
    title: 'Estagiário',
    icon: <GraduationCap className="h-8 w-8" />,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    description: 'Acesso limitado para aprendizado. Pode criar e editar apenas suas próprias teses.',
    responsibilities: [
      'Criar teses sob supervisão',
      'Editar apenas próprias teses',
      'Consultar banco de teses para estudo',
      'Exportar documentos para Word',
      'Aprender com a equipe',
    ],
  },
]

export default function RolesInfo() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a2744] to-[#0f1d32]" />
        <Card className="relative bg-white/10 backdrop-blur-xl border-white/10">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Acesso Negado</h2>
            <p className="text-white/60 mb-6">Apenas administradores podem acessar esta página.</p>
            <Button onClick={() => navigate('/dashboard')} className="bg-white/10 hover:bg-white/20 text-white">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a2744] to-[#0f1d32]" />
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/users')}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-400" />
                    Funções e Permissões
                  </h1>
                  <p className="text-xs text-white/50">Entenda as diferenças entre cada tipo de usuário</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Cards de Roles */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
            {roleDetails.map((role) => (
              <Card 
                key={role.role} 
                className={`bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden hover:scale-[1.02] transition-transform`}
              >
                <div className={`h-2 bg-gradient-to-r ${role.color}`} />
                <CardHeader className="pb-2">
                  <div className={`h-16 w-16 rounded-xl ${role.bgColor} ${role.borderColor} border flex items-center justify-center ${role.textColor} mb-3`}>
                    {role.icon}
                  </div>
                  <CardTitle className="text-white text-lg">{role.title}</CardTitle>
                  <CardDescription className="text-white/60 text-sm">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                    Responsabilidades
                  </h4>
                  <ul className="space-y-2">
                    {role.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                        <Check className={`h-4 w-4 ${role.textColor} shrink-0 mt-0.5`} />
                        {resp}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabela de Permissões */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400" />
                Matriz de Permissões
              </CardTitle>
              <CardDescription className="text-white/60">
                Comparação detalhada das permissões de cada função
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/70 font-medium">Permissão</th>
                      <th className="text-center py-3 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <Crown className="h-5 w-5 text-red-400" />
                          <span className="text-xs text-white/70">Admin</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <Eye className="h-5 w-5 text-blue-400" />
                          <span className="text-xs text-white/70">Supervisor</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <Briefcase className="h-5 w-5 text-purple-400" />
                          <span className="text-xs text-white/70">Advogado</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <GraduationCap className="h-5 w-5 text-green-400" />
                          <span className="text-xs text-white/70">Estagiário</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((perm, idx) => (
                      <tr 
                        key={idx} 
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          idx % 2 === 0 ? 'bg-white/[0.02]' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-white/80">
                            {perm.icon}
                            {perm.name}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          {perm.admin ? (
                            <Check className="h-5 w-5 text-green-400 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-400/50 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          {perm.supervisor ? (
                            <Check className="h-5 w-5 text-green-400 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-400/50 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          {perm.advogado ? (
                            <Check className="h-5 w-5 text-green-400 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-400/50 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          {perm.estagiario ? (
                            <Check className="h-5 w-5 text-green-400 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-400/50 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Legenda */}
          <div className="mt-6 flex items-center justify-center gap-8 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              <span>Permitido</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-400/50" />
              <span>Não permitido</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
