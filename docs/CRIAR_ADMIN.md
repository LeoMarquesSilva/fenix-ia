# Como Criar Usuário Admin

## Método 1: Via Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** → **Users**
3. Clique em **Add User** (ou **Invite User**)
4. Preencha:
   - **Email**: `admin@admin.com`
   - **Password**: Defina uma senha (ex: `admin123`)
   - **Auto Confirm User**: ✅ **SIM** (marca esta opção para não precisar confirmar email)
5. Clique em **Create User**

6. Depois, execute este SQL para tornar o usuário admin:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@admin.com';
```

## Método 2: Via API Admin (Programático)

Se você tem acesso à API Admin do Supabase, pode criar via código:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Chave de serviço (NÃO a anon key)
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Criar usuário admin
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'admin@admin.com',
  password: 'admin123',
  email_confirm: true, // Confirmar email automaticamente
  user_metadata: {
    nome: 'Administrador',
    role: 'admin'
  }
})

if (error) {
  console.error('Erro ao criar usuário:', error)
} else {
  console.log('Usuário criado:', data.user)
  
  // Atualizar perfil para admin
  await supabaseAdmin
    .from('profiles')
    .update({ role: 'admin' })
    .eq('email', 'admin@admin.com')
}
```

## Método 3: Resetar Senha de Usuário Existente

Se o usuário já existe mas você não sabe a senha:

1. No **Supabase Dashboard** → **Authentication** → **Users**
2. Encontre o usuário `admin@admin.com`
3. Clique nos **3 pontos** (menu) ao lado do usuário
4. Selecione **Reset Password**
5. Um email será enviado para resetar a senha

**OU** via SQL (se você tiver acesso direto ao banco):

```sql
-- Resetar senha via função do Supabase
-- NOTA: Isso requer acesso direto ao banco, não funciona via SQL Editor do Dashboard
SELECT auth.users_reset_password('admin@admin.com');
```

## Verificar Usuário Admin

Depois de criar/atualizar, verifique:

```sql
-- Verificar usuário no auth.users
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'admin@admin.com';

-- Verificar perfil
SELECT id, email, nome, role, ativo 
FROM public.profiles 
WHERE email = 'admin@admin.com';
```

## Senha Padrão Sugerida

Se você está criando um ambiente de desenvolvimento/teste:
- **Email**: `admin@admin.com`
- **Senha**: `admin123` (ou outra senha forte de sua escolha)

**⚠️ IMPORTANTE**: Em produção, use uma senha forte e única!
