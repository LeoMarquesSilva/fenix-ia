# 📋 Changelog - Fênix.IA - Banco de Teses Jurídicas

## Versão 2.0 - Janeiro 2026

### 🔐 Sistema de Roles e Permissões

#### Roles Disponíveis
| Role | Descrição |
|------|-----------|
| `admin` | Administrador do sistema - acesso total |
| `advogado` | Advogado - criar, editar, excluir teses |
| `supervisor` | Supervisor - revisar e editar todas as teses |
| `estagiario` | Estagiário - apenas criar e visualizar teses |

#### Permissões por Role
| Ação | Admin | Advogado | Supervisor | Estagiário |
|------|-------|----------|------------|------------|
| Ver todas as teses | ✅ | ✅ | ✅ | ✅ |
| Criar teses | ✅ | ✅ | ✅ | ✅ |
| Editar próprias teses | ✅ | ✅ | ✅ | ✅ |
| Editar teses de outros | ✅ | ❌ | ✅ | ❌ |
| Excluir teses | ✅ | ✅ | ✅ | ❌ |
| Gerenciar usuários | ✅ | ❌ | ❌ | ❌ |

#### Arquivos Modificados
- `src/hooks/useAuth.tsx` - Hook de autenticação com flags de role
- `src/hooks/useProfile.ts` - Hooks para gerenciar perfis
- `src/pages/UsersManagement.tsx` - Página de gerenciamento de usuários
- `src/App.tsx` - Rotas protegidas por role

---

### 🔍 Filtros Avançados

#### Novos Filtros Adicionados
1. **Filtro por Criador** - Dropdown com todos os usuários do sistema
2. **Filtro por Data Início** - Selecionar data mínima de criação
3. **Filtro por Data Fim** - Selecionar data máxima de criação
4. **Ordenação** - Opções:
   - Mais recentes
   - Mais antigos
   - Título A-Z
   - Título Z-A
5. **Botão Limpar Filtros** - Aparece quando há filtros ativos

#### Arquivos Modificados
- `src/hooks/useTeses.ts` - Novos parâmetros de filtro
- `src/pages/Dashboard.tsx` - UI dos filtros

---

### 📊 Dashboard com Métricas

#### Gráficos Implementados
1. **Teses por Área** - Gráfico de barras horizontal mostrando distribuição por área jurídica
2. **Teses por Mês** - Gráfico de barras vertical dos últimos 6 meses
3. **Top Criadores** - Ranking dos 5 usuários que mais criaram teses

#### Como Usar
- Clique no botão **"Métricas"** na área de filtros para expandir/recolher o painel

#### Arquivos Modificados
- `src/pages/Dashboard.tsx` - Componente de métricas

---

### 👤 Exibição do Criador

#### Funcionalidade
- Cada tese agora mostra o nome do criador
- Visível tanto na visualização em **Grid** quanto em **Lista**
- Ícone de usuário + nome do criador abaixo da data

#### Arquivos Modificados
- `src/pages/Dashboard.tsx` - Componentes TeseCard e TeseListItem

---

### 🗄️ Estrutura do Banco de Dados

#### Tabela `profiles`
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'advogado',
  ativo BOOLEAN DEFAULT true
);
```

#### Políticas RLS (Row Level Security)
```sql
-- SELECT: Todos usuários autenticados podem ver perfis
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- UPDATE: Usuário pode atualizar próprio OU admin pode atualizar qualquer um
CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR get_user_role(auth.uid()) = 'admin');

-- DELETE: Similar ao UPDATE
CREATE POLICY "profiles_delete_policy"
  ON public.profiles FOR DELETE TO authenticated
  USING (auth.uid() = id OR get_user_role(auth.uid()) = 'admin');
```

#### Trigger de Criação Automática
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'advogado'),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = COALESCE(EXCLUDED.nome, profiles.nome),
    email = COALESCE(EXCLUDED.email, profiles.email),
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 🛠️ Arquivos de Migração SQL

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/fix_profiles_with_roles.sql` | Configura tabela profiles e políticas RLS |
| `supabase/migrations/fix_admin_update_profiles.sql` | Permite admin atualizar perfis de outros |
| `supabase/migrations/verify_profiles_structure.sql` | Script para verificar estrutura |

---

### 🎨 Interface do Usuário

#### Header do Dashboard
- Badge mostrando a role do usuário atual
- Nome do usuário logado
- Botão "Usuários" visível apenas para admins

#### Cards de Teses
- Nome do criador exibido abaixo da data
- Ícone de usuário para identificação visual
- Botão de excluir oculto para estagiários

#### Página de Gerenciamento de Usuários (`/users`)
- Listagem de todos os usuários
- Criar novo usuário com role
- Editar nome, email e role
- Desativar/excluir usuários
- Badge visual indicando a role de cada usuário
- Indicador "Você" para o usuário atual

---

### 📁 Estrutura de Arquivos Principais

```
src/
├── hooks/
│   ├── useAuth.tsx        # Autenticação e roles
│   ├── useProfile.ts      # Gerenciamento de perfis
│   └── useTeses.ts        # CRUD de teses com filtros
├── pages/
│   ├── Dashboard.tsx      # Dashboard principal
│   ├── Login.tsx          # Página de login
│   ├── UsersManagement.tsx # Gerenciamento de usuários
│   └── ThesisEditor.tsx   # Editor de teses
├── types/
│   ├── profiles.ts        # Tipos de perfil
│   └── supabase.ts        # Tipos do Supabase
└── lib/
    └── supabase.ts        # Cliente Supabase

supabase/
└── migrations/
    ├── fix_profiles_with_roles.sql
    ├── fix_admin_update_profiles.sql
    └── verify_profiles_structure.sql

docs/
├── SISTEMA_ROLES.md       # Documentação de roles
└── CHANGELOG.md           # Este arquivo
```

---

### 🔧 Configuração Necessária no Supabase

1. Execute os scripts SQL em ordem:
   - `fix_profiles_with_roles.sql`
   - `fix_admin_update_profiles.sql`

2. Verifique a estrutura com:
   - `verify_profiles_structure.sql`

3. Configure pelo menos um usuário admin:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'seu-email@exemplo.com';
```

---

### 🚀 Próximas Melhorias Sugeridas

- [ ] Sistema de favoritos/marcadores
- [ ] Histórico de alterações
- [ ] Notificações por email
- [ ] Busca semântica com IA
- [ ] Exportação em lote
- [ ] Integração com outros sistemas jurídicos
