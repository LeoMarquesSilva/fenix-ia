# 🔐 Sistema de Roles - Fênix.IA

## Visão Geral

O sistema de roles permite controlar o acesso a diferentes funcionalidades com base no tipo de usuário.

## Roles Disponíveis

| Role | Descrição | Permissões |
|------|-----------|------------|
| `admin` | Administrador | Acesso total ao sistema |
| `advogado` | Advogado | Criar, editar, excluir teses |
| `supervisor` | Supervisor | Revisar teses, gerenciar equipe |
| `estagiario` | Estagiário | Criar e visualizar teses |

## Como Funciona

### 1. Armazenamento

As roles são armazenadas na tabela `profiles`:

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'advogado' 
    CHECK (role IN ('admin', 'advogado', 'estagiario', 'supervisor')),
  ativo BOOLEAN DEFAULT true NOT NULL
);
```

### 2. Consulta de Role (Backend)

Função `SECURITY DEFINER` que bypassa RLS para consultar a role:

```sql
-- Obtém a role de um usuário específico
SELECT public.get_user_role('uuid-do-usuario');

-- Verifica se o usuário atual é admin
SELECT public.is_current_user_admin();
```

### 3. Uso no Frontend

O hook `useAuth` fornece as informações de role:

```typescript
import { useAuth } from '@/hooks/useAuth'

function MeuComponente() {
  const { user, profile, isAdmin, isAdvogado } = useAuth()
  
  // profile.role contém: 'admin' | 'advogado' | 'supervisor' | 'estagiario'
  
  if (isAdmin) {
    // Mostrar funcionalidades de admin
  }
  
  if (isAdvogado) {
    // Mostrar funcionalidades de advogado
  }
}
```

## Controle de Acesso por Role

### No Frontend (React)

```typescript
// Exemplo: Botão que só aparece para admins
{isAdmin && (
  <Button onClick={handleAdminAction}>
    Gerenciar Usuários
  </Button>
)}

// Exemplo: Proteção de rota
function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth()
  
  if (loading) return <Loading />
  if (!isAdmin) return <Navigate to="/dashboard" />
  
  return children
}
```

### Na Tabela Teses

As políticas RLS da tabela `teses` são simples:
- **SELECT**: Público (todos podem ler)
- **INSERT/UPDATE/DELETE**: Qualquer usuário autenticado

O controle mais granular (ex: só admin pode excluir teses de outros) é feito no frontend.

## Alterando Role de um Usuário

### Via SQL (Supabase Dashboard)

```sql
-- Tornar um usuário admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'usuario@email.com';

-- Ver todas as roles
SELECT id, nome, email, role FROM public.profiles;
```

### Via Interface (UsersManagement)

Apenas admins podem acessar `/users` e alterar roles de outros usuários.

## Verificação de Permissões

### Exemplo: Excluir Tese

```typescript
// No Dashboard.tsx
const handleDeleteTese = async (teseId: string) => {
  // Verificar se pode excluir
  if (!isAdmin && tese.user_id !== user?.id) {
    toast({
      title: 'Sem permissão',
      description: 'Você só pode excluir suas próprias teses.',
      variant: 'destructive',
    })
    return
  }
  
  // Proceder com exclusão
  await deleteMutation.mutateAsync(teseId)
}
```

## Tabela de Permissões por Role

| Ação | Admin | Advogado | Supervisor | Estagiário |
|------|-------|----------|------------|------------|
| Ver teses | ✅ | ✅ | ✅ | ✅ |
| Criar teses | ✅ | ✅ | ✅ | ✅ |
| Editar próprias teses | ✅ | ✅ | ✅ | ✅ |
| Editar teses de outros | ✅ | ❌ | ✅ | ❌ |
| Excluir próprias teses | ✅ | ✅ | ✅ | ❌ |
| Excluir teses de outros | ✅ | ❌ | ❌ | ❌ |
| Gerenciar usuários | ✅ | ❌ | ❌ | ❌ |
| Ver perfis de outros | ✅ | ✅ | ✅ | ✅ |
| Alterar roles | ✅ | ❌ | ❌ | ❌ |

## Troubleshooting

### Erro: "infinite recursion detected"

Execute o script `supabase/migrations/fix_profiles_with_roles.sql` para corrigir as políticas RLS.

### Usuário não consegue ver seu perfil

Verifique se a política `profiles_select_authenticated` existe:

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Role não está sendo carregada

Verifique se o perfil existe para o usuário:

```sql
SELECT * FROM public.profiles WHERE id = 'uuid-do-usuario';
```

Se não existir, crie manualmente:

```sql
INSERT INTO public.profiles (id, nome, email, role)
VALUES ('uuid-do-usuario', 'Nome', 'email@exemplo.com', 'advogado');
```
