import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useTeses } from '@/hooks/useTeses'

export default function TestTeses() {
  const [testResults, setTestResults] = useState<any[]>([])
  const { user, profile } = useAuth()
  
  // Testar o hook useTeses diretamente
  const { data: tesesData, isLoading: tesesLoading, error: tesesError } = useTeses({})

  const runTests = () => {
    const results: any[] = []

    // Teste 1: Verificar dados do contexto
    results.push({
      test: '1. Verificar Contexto de Autenticação',
      status: user ? 'success' : 'error',
      message: user 
        ? `Usuário: ${user.email} (ID: ${user.id})`
        : 'Usuário não autenticado',
      data: {
        user: user ? { email: user.email, id: user.id } : null,
        profile: profile ? { nome: profile.nome, role: profile.role, email: profile.email } : null,
      },
    })

    // Teste 2: Verificar hook useTeses
    results.push({
      test: '2. Verificar Hook useTeses',
      status: tesesLoading 
        ? 'running' 
        : tesesError 
        ? 'error' 
        : 'success',
      message: tesesLoading 
        ? 'Carregando teses...'
        : tesesError 
        ? `Erro: ${tesesError.message}` 
        : `${tesesData?.count || 0} teses encontradas`,
      data: tesesData ? {
        count: tesesData.count,
        totalPages: tesesData.totalPages,
        page: tesesData.page,
        pageSize: tesesData.pageSize,
        sample: tesesData.data?.slice(0, 3).map(t => ({
          id: t.id,
          titulo: t.titulo,
          area: t.area,
          creator: (t as any).creator_nome,
        })),
      } : null,
      error: tesesError ? {
        message: tesesError.message,
        code: (tesesError as any).code,
        details: (tesesError as any).details,
        hint: (tesesError as any).hint,
      } : null,
    })

    // Teste 3: Verificar políticas RLS (apenas informação)
    results.push({
      test: '3. Informações sobre RLS',
      status: 'success',
      message: 'Verificando configuração...',
      data: {
        profilesRLS: 'RLS habilitado - usuários podem ver apenas seu próprio perfil',
        tesesRLS: 'RLS habilitado - leitura pública, escrita apenas para autenticados',
        profileExists: profile ? 'Sim' : 'Não (isso pode causar problemas)',
        recommendation: profile 
          ? 'Perfil carregado corretamente'
          : 'PERFIL NÃO ENCONTRADO - O usuário precisa ter um perfil na tabela profiles',
      },
    })

    setTestResults(results)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Teste de Conexão e RLS - Teses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div>
              <p className="font-semibold">Usuário atual (do contexto):</p>
              <p className="text-sm text-gray-600">
                {user ? `${user.email} (${user.id})` : 'Não autenticado'}
              </p>
            </div>
            <div>
              <p className="font-semibold">Perfil (do contexto):</p>
              <p className="text-sm text-gray-600">
                {profile ? `${profile.nome} (${profile.role})` : 'Perfil não carregado'}
              </p>
            </div>
            <div>
              <p className="font-semibold">Hook useTeses:</p>
              <p className="text-sm text-gray-600">
                {tesesLoading 
                  ? 'Carregando...' 
                  : tesesError 
                  ? `Erro: ${tesesError.message}` 
                  : `${tesesData?.count || 0} teses encontradas`}
              </p>
            </div>
          </div>
          <Button onClick={runTests} className="w-full">
            Executar Testes
          </Button>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      result.status === 'success'
                        ? 'bg-green-500'
                        : result.status === 'error'
                        ? 'bg-red-500'
                        : result.status === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500 animate-pulse'
                    }`}
                  />
                  {result.test}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2">{result.message}</p>
                {result.error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                    <p className="font-semibold text-red-800">Erro:</p>
                    <pre className="text-xs text-red-700 mt-2 overflow-auto">
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  </div>
                )}
                {result.data && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                    <p className="font-semibold text-gray-800">Dados:</p>
                    <pre className="text-xs text-gray-700 mt-2 overflow-auto max-h-60">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}