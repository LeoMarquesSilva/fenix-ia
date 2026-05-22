import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      toast({
        title: 'Login realizado!',
        description: 'Redirecionando...',
      })
      navigate('/dashboard')
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Base: fundo escuro sofisticado */}
      <div className="absolute inset-0 bg-[#e8eef5] dark:bg-[#050a15]" />
      {/* Formas abstratas 3D — canto inferior esquerdo (gradiente Fênix) */}
      <div
        className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] opacity-25 dark:opacity-60 blur-3xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #6b46c1 40%, #a78bfa 100%)',
          boxShadow: '0 0 120px rgba(107, 70, 193, 0.4)',
        }}
      />
      {/* Formas abstratas 3D — canto superior direito */}
      <div
        className="absolute -top-40 -right-40 w-[450px] h-[450px] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-25 dark:opacity-60 blur-3xl pointer-events-none"
        style={{
          background: 'linear-gradient(225deg, #6b46c1 0%, #a78bfa 100%)',
          boxShadow: '0 0 100px rgba(167, 139, 250, 0.35)',
        }}
      />
      {/* Halo suave central */}
      <div
        className="absolute inset-0 opacity-15 dark:opacity-25 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(107, 70, 193, 0.15) 0%, transparent 70%)',
        }}
      />
      {/* Textura starfield — pontos brilhantes */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-100 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 25%, rgba(255,255,255,0.12) 1px, transparent 1px),
            radial-gradient(circle at 85% 15%, rgba(167,139,250,0.1) 1px, transparent 1px),
            radial-gradient(circle at 70% 85%, rgba(107,70,193,0.08) 1px, transparent 1px),
            radial-gradient(circle at 25% 70%, rgba(255,255,255,0.06) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, rgba(167,139,250,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%',
        }}
      />
      <div
        className="absolute inset-0 opacity-20 dark:opacity-70 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '6px 6px',
        }}
      />
      <div className="relative z-10 w-full flex items-center justify-center">
      {/* Card flutuante com split screen */}
      <div
        className={cn(
          'w-full max-w-[960px] min-h-[560px] rounded-3xl overflow-hidden',
          'bg-card shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]',
          'flex flex-col lg:flex-row'
        )}
      >
        {/* Painel esquerdo: visual / branding */}
        <div
          className={cn(
            'relative flex-1 min-h-[240px] lg:min-h-0',
            'bg-gradient-to-b from-fenix-navy via-[#2a3d5c] to-fenix-purple-dark/80',
            'flex flex-col items-center justify-center p-10 lg:p-12',
            'rounded-t-3xl lg:rounded-l-3xl lg:rounded-tr-none'
          )}
        >
          {/* Padrão de pontos */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative flex flex-col items-center text-center">
            <img
              src="/assets/logos/logo-horizontal-branco-fenix.png"
              alt="Fênix I.A"
              className="w-full max-w-[260px] sm:max-w-[300px] lg:max-w-[340px] h-auto object-contain drop-shadow-lg brightness-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <h2 className="mt-6 text-xl lg:text-2xl font-bold text-white leading-tight max-w-sm">
              Consulte e gerencie teses jurídicas com inteligência artificial
            </h2>
            <p className="mt-3 text-sm text-white/80 max-w-xs">
              Banco de teses com busca avançada, assistente IA e relatórios
              integrados.
            </p>
          </div>
        </div>

        {/* Painel direito: formulário */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-12 bg-card">
          <div className="w-full max-w-sm mx-auto">
            {/* Logo pequeno */}
            <div className="flex justify-center mb-6">
              <img
                src="/assets/logos/logo-fenix-ia-10.png"
                alt="Fênix"
                className="h-12 w-12 object-contain dark:brightness-110"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>

            <h1 className="text-2xl font-bold text-foreground text-center">
              Bem-vindo de volta!
            </h1>
            <p className="mt-1 text-sm text-muted-foreground text-center">
              Entre na sua conta Fênix
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-lg border-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 rounded-lg border-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-lg fenix-gradient-primary hover:opacity-95 text-white font-medium shadow-md shadow-fenix-purple-dark/30"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <p className="mt-6 text-xs text-center text-muted-foreground">
              Ao entrar, você concorda com nossa Política de Privacidade e
              Termos de Uso.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
