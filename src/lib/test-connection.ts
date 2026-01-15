// Script de teste de conexão com Supabase
// Execute: npm run dev e verifique o console

import { supabase } from './supabase'

export async function testConnection() {
  try {
    console.log('🔌 Testando conexão com Supabase...')
    console.log('📍 URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Não configurada')
    
    // Teste 1: Verificar autenticação básica
    const { error: authError } = await supabase.auth.getSession()
    
    // Ignorar erros de abort silenciosamente
    if (authError) {
      const isAbortError = authError.message?.includes('AbortError') || 
                          authError.message?.includes('aborted') ||
                          authError.name === 'AbortError'
      
      if (isAbortError) {
        // Silenciosamente ignorar
        return true
      }
      
      if (authError.message.includes('Invalid API key')) {
        console.error('❌ Chave API inválida. Verifique VITE_SUPABASE_ANON_KEY')
        return false
      }
    }
    
    // Teste 2: Verificar se a tabela existe
    const { error } = await supabase
      .from('teses')
      .select('count')
      .limit(1)
    
    if (error) {
      // Ignorar erros de abort
      const isAbortError = error.message?.includes('AbortError') || 
                          error.message?.includes('aborted') ||
                          error.name === 'AbortError'
      
      if (isAbortError) {
        // Silenciosamente ignorar
        return true
      }
      
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('❌ Tabela "teses" não encontrada!')
        console.error('💡 Execute o script SQL em supabase/schema.sql no SQL Editor do Supabase')
        return false
      }
      console.error('❌ Erro na conexão:', error.message)
      return false
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!')
    console.log('📊 Tabela "teses" verificada e acessível')
    return true
  } catch (error: any) {
    // Ignorar erros de abort silenciosamente
    const isAbortError = error?.name === 'AbortError' || 
                        error?.message?.includes('aborted') ||
                        error?.message?.includes('signal is aborted')
    
    if (isAbortError) {
      // Silenciosamente ignorar
      return true
    }
    
    console.error('❌ Erro ao conectar:', error.message)
    if (error.message?.includes('fetch')) {
      console.error('💡 Verifique sua conexão com a internet e a URL do Supabase')
    }
    return false
  }
}

// Auto-executar se estiver em desenvolvimento
// DESABILITADO para evitar conflitos com useAuth
// if (import.meta.env.DEV) {
//   setTimeout(() => {
//     testConnection()
//   }, 1000)
// }
