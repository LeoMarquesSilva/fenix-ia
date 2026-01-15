-- ============================================
-- CRIAR TABELA PROFILES COM ROLES - VERSÃO CORRIGIDA
-- ============================================
-- Esta migration cria a tabela profiles com sistema de roles
-- sem dependências circulares nas políticas RLS

-- 1. Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  nome TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'advogado' CHECK (role IN ('admin', 'advogado', 'estagiario', 'supervisor')),
  email TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true NOT NULL
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_ativo ON public.profiles(ativo);

-- 3. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. Criar função para criar perfil automaticamente quando um usuário é criado
-- Esta função usa SECURITY DEFINER para poder inserir na tabela profiles
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
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar trigger para criar perfil automaticamente quando usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Criar políticas RLS SEM dependências circulares

-- SELECT: Usuários podem ver seu próprio perfil
-- Esta política é simples e não depende de outras políticas
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- SELECT: Admins podem ver todos os perfis
-- Esta política verifica se o usuário atual é admin consultando diretamente auth.users
-- através de uma função SECURITY DEFINER para evitar dependência circular
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "profiles_select_admins"
  ON public.profiles
  FOR SELECT
  USING (public.is_user_admin(auth.uid()));

-- INSERT: Usuários podem criar seu próprio perfil
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- INSERT: Admins podem criar perfis de outros usuários
CREATE POLICY "profiles_insert_admins"
  ON public.profiles
  FOR INSERT
  WITH CHECK (public.is_user_admin(auth.uid()));

-- UPDATE: Usuários podem atualizar seu próprio perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- UPDATE: Admins podem atualizar qualquer perfil
CREATE POLICY "profiles_update_admins"
  ON public.profiles
  FOR UPDATE
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

-- DELETE: Apenas admins podem deletar perfis
CREATE POLICY "profiles_delete_admins"
  ON public.profiles
  FOR DELETE
  USING (public.is_user_admin(auth.uid()));

-- 9. Comentários para documentação
COMMENT ON TABLE public.profiles IS 'Perfis de usuários com roles e informações adicionais';
COMMENT ON COLUMN public.profiles.role IS 'Role do usuário: admin, advogado, estagiario, supervisor';
COMMENT ON FUNCTION public.is_user_admin(UUID) IS 'Verifica se um usuário é admin (usa SECURITY DEFINER para evitar dependência circular)';
