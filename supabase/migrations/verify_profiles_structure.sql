-- ============================================
-- VERIFICAR ESTRUTURA DA TABELA PROFILES
-- ============================================
-- Execute este script no SQL Editor do Supabase para verificar

-- 1. Ver estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;


Resultado:

[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "column_name": "nome",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "role",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'advogado'::text"
  },
  {
    "column_name": "email",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "ativo",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "true"
  }
]

-- 2. Ver todos os perfis existentes
SELECT * FROM public.profiles ORDER BY created_at DESC;

Resultado: [
  {
    "id": "dfd95c15-7787-4db3-ad8a-9d14e1e7852e",
    "created_at": "2026-01-15 14:44:10.563836+00",
    "updated_at": "2026-01-15 14:44:11.802489+00",
    "nome": "Samuel Willian",
    "role": "advogado",
    "email": "controladoria@bismarchipires.com.br",
    "ativo": true
  },
  {
    "id": "0c4e8d7b-e969-4013-a6bf-a2b496a1d031",
    "created_at": "2026-01-15 12:46:24.857575+00",
    "updated_at": "2026-01-15 12:46:37.165985+00",
    "nome": "admin",
    "role": "admin",
    "email": "admin@admin.com",
    "ativo": true
  }
]

-- 3. Verificar se a tabela tem os campos necessários
-- Campos esperados:
--   id (uuid) - chave primária, referência para auth.users
--   created_at (timestamptz) - data de criação
--   updated_at (timestamptz) - data de atualização
--   nome (text) - nome do usuário
--   email (text) - email do usuário
--   role (text) - role: admin, advogado, supervisor, estagiario
--   ativo (boolean) - se o usuário está ativo

-- 4. Se algum campo estiver faltando, execute:
-- ALTER TABLE public.profiles ADD COLUMN nome TEXT;
-- ALTER TABLE public.profiles ADD COLUMN email TEXT;
-- ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'advogado';
-- ALTER TABLE public.profiles ADD COLUMN ativo BOOLEAN DEFAULT true;

-- 5. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

Resultado:

[
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_delete_own",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(auth.uid() = id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_insert_own",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_select_authenticated",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "true"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "profiles_update_own",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)"
  }
]