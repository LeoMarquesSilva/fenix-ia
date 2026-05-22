import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { SidebarLayoutProvider } from '@/contexts/SidebarLayoutContext'
import { AppShell } from '@/components/layout/AppShell'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import ThesisEditor from '@/pages/ThesisEditor'
import UsersManagement from '@/pages/UsersManagement'
import Profile from '@/pages/Profile'
import RolesInfo from '@/pages/RolesInfo'
import SolicitarTese from '@/pages/SolicitarTese'
import PeticaoInicial from '@/pages/PeticaoInicial'
import PeticaoContestacaoRecurso from '@/pages/PeticaoContestacaoRecurso'
import ManifestacaoWizard from '@/pages/ManifestacaoWizard'
import ContratoPrestacao from '@/pages/ContratoPrestacao'

function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <div className="text-lg text-foreground">Carregando...</div>
      </div>
    </div>
  )
}

function ProtectedLayout() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />

  return (
    <SidebarLayoutProvider>
      <AppShell />
    </SidebarLayoutProvider>
  )
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/solicitar-tese" element={<SolicitarTese />} />
            <Route path="/peticao-inicial" element={<PeticaoInicial />} />
            <Route
              path="/peticao-contestacao-recurso"
              element={<PeticaoContestacaoRecurso />}
            />
            <Route path="/manifestacoes" element={<ManifestacaoWizard />} />
            <Route path="/contratos" element={<ContratoPrestacao />} />
            <Route path="/teses/:id?" element={<ThesisEditor />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/users"
              element={
                <RequireAdmin>
                  <UsersManagement />
                </RequireAdmin>
              }
            />
            <Route
              path="/roles"
              element={
                <RequireAdmin>
                  <RolesInfo />
                </RequireAdmin>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
