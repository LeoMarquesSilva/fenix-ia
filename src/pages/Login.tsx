import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // Validar senhas
        if (password !== confirmPassword) {
          toast({
            title: 'Erro',
            description: 'As senhas não coincidem',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }

        if (password.length < 6) {
          toast({
            title: 'Erro',
            description: 'A senha deve ter pelo menos 6 caracteres',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }

        await signUp(email, password)
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Você já pode fazer login.',
        })
        // Limpar formulário e voltar para login
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setIsSignUp(false)
      } else {
        await signIn(email, password)
        toast({
          title: 'Login realizado!',
          description: 'Redirecionando...',
        })
        navigate('/dashboard')
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao fazer login',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center text-white p-4" style={{
      backgroundColor: '#101f2e',
      backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(107, 70, 193, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(30, 58, 95, 0.08) 0%, transparent 50%),
        linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)
      `,
      backgroundAttachment: 'fixed'
    }}>
      <Card className="w-full max-w-md border shadow-2xl backdrop-blur-xl" style={{ borderColor: '#101f2e', backgroundColor: '#101f2e' }}>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <img 
              src="/assets/logos/logo-fenix-ia-10.png" 
              alt="Fênix I.A" 
              className="h-16 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent && !parent.querySelector('.fallback-icon')) {
                  const fallback = document.createElement('div')
                  fallback.className = 'fallback-icon flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent'
                  fallback.innerHTML = '<svg class="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/></svg>'
                  parent.insertBefore(fallback, target)
                }
              }}
            />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {isSignUp ? 'Criar Conta' : 'Fênix I.A'}
          </CardTitle>
          <CardDescription className="text-white/70">
            {isSignUp
              ? 'Crie sua conta para começar'
              : 'Banco de Teses Jurídicas com Inteligência Artificial'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setPassword('')
                setConfirmPassword('')
              }}
              className="text-white/80 hover:text-white underline"
            >
              {isSignUp
                ? 'Já tem uma conta? Faça login'
                : 'Não tem uma conta? Criar conta'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
