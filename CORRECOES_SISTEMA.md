# 🔧 Correções do Sistema - Análise Completa

## Problemas Identificados e Soluções

### 1. ❌ **AbortError nas requisições Supabase**

**Causa:** O cliente Supabase JS usa `AbortController` internamente, que pode cancelar requisições prematuramente quando:
- O React Query cancela queries devido a re-renders
- O componente desmonta antes da resposta
- Múltiplas requisições são disparadas simultaneamente

**Solução:** Implementamos **fetch direto para a API REST do Supabase**, evitando o cliente que causa cancelamentos.

**Arquivos afetados:**
- `src/hooks/useTeses.ts` - Todas as operações agora usam fetch direto

---

### 2. ❌ **Exclusão de teses não funciona (RLS Policy)**

**Causa:** A política RLS original exigia que `auth.uid() = user_id`:

```sql
CREATE POLICY "Auth delete" 
  ON public.teses 
  FOR DELETE 
  USING (auth.role() = 'authenticated' AND auth.uid() = user_id);
```

Isso significa que:
- Teses criadas com `user_id = NULL` não podem ser excluídas
- Usuários só podem excluir suas próprias teses

**Solução:** Execute o script `supabase/migrations/fix_delete_policy.sql` no Supabase para permitir que qualquer usuário autenticado possa excluir:

```sql
DROP POLICY IF EXISTS "Auth delete" ON public.teses;

CREATE POLICY "Auth delete" 
  ON public.teses 
  FOR DELETE 
  USING (auth.role() = 'authenticated');
```

---

### 3. ❌ **Token de autenticação não sendo passado nas mutations**

**Causa:** As mutations originais dependiam do cliente Supabase passar o token automaticamente, mas isso falhava com AbortError.

**Solução:** Criamos função `getAuthToken()` que obtém o token da sessão e passa explicitamente em todas as requisições fetch:

```typescript
async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || supabaseKey
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const authToken = await getAuthToken()
  return fetch(url, {
    ...options,
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${authToken}`,
      ...options.headers,
    },
  })
}
```

---

### 4. ❌ **Erros de tipo TypeScript com Supabase**

**Causa:** O tipo `Database` não incluía a tabela `profiles` e algumas definições estavam incompletas.

**Solução:** 
- Criado `src/vite-env.d.ts` para tipos de ambiente Vite
- Usado `as any` em operações do Supabase onde necessário
- Implementado fetch direto que não depende dos tipos do Supabase

---

## 📋 Checklist de Ações

### No Supabase (SQL Editor):

1. **Corrigir política de DELETE:**
   ```sql
   -- Execute em: Supabase Dashboard > SQL Editor
   DROP POLICY IF EXISTS "Auth delete" ON public.teses;
   
   CREATE POLICY "Auth delete" 
     ON public.teses 
     FOR DELETE 
     USING (auth.role() = 'authenticated');
   ```

2. **Verificar políticas atuais:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE tablename = 'teses';
   ```

### Políticas RLS esperadas para `teses`:

| Política | Comando | Condição |
|----------|---------|----------|
| Leitura pública | SELECT | `true` |
| Auth insert | INSERT | `auth.role() = 'authenticated'` |
| Auth update | UPDATE | `auth.role() = 'authenticated'` |
| Auth delete | DELETE | `auth.role() = 'authenticated'` |

---

## 🏗️ Arquitetura da Solução

### Antes (problemático):
```
React Component → React Query → Supabase Client → AbortController → API
                                    ↑
                                  PROBLEMA!
```

### Depois (funcional):
```
React Component → React Query → Fetch Direto → API REST Supabase
                                    ↑
                         Token obtido de getSession()
```

---

## 📁 Arquivos Modificados

1. **`src/hooks/useTeses.ts`** - Reescrito completamente para usar fetch direto
2. **`src/vite-env.d.ts`** - Tipos para variáveis de ambiente Vite
3. **`src/components/ImportModal.tsx`** - Adicionado useAuth para obter user
4. **`src/components/AIGenerateModal.tsx`** - Adicionado useAuth para obter user
5. **`supabase/migrations/fix_delete_policy.sql`** - Script para corrigir política RLS

---

## 🧪 Testando as Correções

1. **Listar teses:** Deve aparecer no console `✅ useTeses - Sucesso!`
2. **Criar tese:** Upload Word ou AI Generate deve funcionar
3. **Editar tese:** Mudanças devem ser salvas
4. **Excluir tese:** Após executar o script SQL, deve funcionar

Se excluir ainda não funcionar, verifique:
- Se executou o script SQL
- Se está logado (usuário autenticado)
- Console do navegador para mensagens de erro detalhadas
