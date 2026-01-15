# Sistema de Roles e Permissões

## Roles Disponíveis

1. **admin** - Acesso total ao sistema
   - ✅ Gerenciar usuários (criar, editar, excluir)
   - ✅ Todas as funcionalidades de advogado
   - ✅ Acesso à página de gerenciamento de usuários

2. **advogado** - Acesso completo de produção
   - ✅ Criar, editar e excluir teses
   - ✅ Upload de documentos Word
   - ✅ Importar Excel
   - ✅ Gerar teses com IA
   - ✅ Exportar teses
   - ❌ Gerenciar usuários

3. **supervisor** - Revisão e aprovação (futuro)
   - ✅ Visualizar todas as teses
   - ✅ Revisar e aprovar teses
   - ❌ Criar teses
   - ❌ Gerenciar usuários

4. **estagiario** - Apenas visualização (futuro)
   - ✅ Visualizar teses
   - ❌ Criar ou editar teses
   - ❌ Gerenciar usuários

## Estrutura do Banco de Dados

### Tabela `profiles`
Armazena informações dos usuários e seus roles:
- `id` (UUID) - Referência para `auth.users(id)`
- `nome` (TEXT) - Nome completo do usuário
- `email` (TEXT) - Email do usuário
- `role` (TEXT) - Role do usuário: 'admin', 'advogado', 'supervisor', 'estagiario'
- `ativo` (BOOLEAN) - Status do usuário

### Tabela `teses`
Atualizada para incluir:
- `user_id` (UUID) - Referência para o usuário que criou a tese

## Funcionalidades Implementadas

1. ✅ Sistema de roles com 4 níveis
2. ✅ Tabela `profiles` com RLS configurado
3. ✅ Trigger automático para criar perfil ao criar usuário
4. ✅ Hook `useProfile` para gerenciar perfis
5. ✅ Hook `useAuth` atualizado com informações de perfil
6. ✅ Página de gerenciamento de usuários (apenas para admin)
7. ✅ Rota protegida `/users` com verificação de admin
8. ✅ `user_id` automaticamente incluído ao criar teses
9. ✅ Nome do usuário criador exibido nos cards das teses
10. ✅ Botão "Usuários" no Dashboard (visível apenas para admin)

## Como Usar

### Para Admin Criar Usuário:

1. Acesse a página de Usuários (botão "Usuários" no Dashboard)
2. Clique em "Novo Usuário"
3. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
   - Role (admin, advogado, supervisor, estagiario)
4. Clique em "Criar Usuário"

**Nota**: A criação de usuários requer permissões de admin no Supabase. Em produção, recomenda-se criar uma Edge Function ou usar a Service Role Key de forma segura.

### Para Ver Quem Criou uma Tese:

O nome do usuário criador aparece automaticamente nos cards das teses:
- No formato: "Por: [Nome do Usuário]"
- Abaixo da data de criação

## Próximos Passos Recomendados

1. Implementar permissões específicas para `supervisor` e `estagiario`
2. Adicionar filtro por criador nas teses
3. Implementar aprovação de teses (para supervisors)
4. Adicionar histórico de edições por usuário
5. Criar Edge Function para criação segura de usuários

## Executar Migration

Para aplicar o schema no Supabase:

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Execute o arquivo: `supabase/migrations/add_profiles_and_roles.sql`

Isso criará:
- Tabela `profiles`
- Triggers e funções necessárias
- Políticas RLS (Row Level Security)
