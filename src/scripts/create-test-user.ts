// Script para criar usuário de teste no Supabase
// Execute: npx tsx src/scripts/create-test-user.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qwvqpnkegcoihcnvencd.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

// Para criar usuário, você precisa da Service Key (não a anon key)
// Acesse: Supabase Dashboard > Settings > API > service_role key

async function createTestUser() {
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_KEY não configurada!')
    console.log('\n📝 Para obter a Service Key:')
    console.log('1. Acesse: https://supabase.com/dashboard')
    console.log('2. Selecione seu projeto')
    console.log('3. Vá em Settings > API')
    console.log('4. Copie a "service_role" key (NÃO a anon key)')
    console.log('5. Adicione no .env.local: SUPABASE_SERVICE_KEY=sua_service_key')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const email = 'admin@teste.com'
  const password = 'senha123456'

  try {
    console.log('🔐 Criando usuário de teste...')
    
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
    })

    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message)
      return
    }

    console.log('✅ Usuário criado com sucesso!')
    console.log('\n📧 Credenciais:')
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${password}`)
    console.log('\n💡 Você pode usar essas credenciais para fazer login na aplicação!')
  } catch (error: any) {
    console.error('❌ Erro:', error.message)
  }
}

createTestUser()
