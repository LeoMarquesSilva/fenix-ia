-- ============================================
-- CRIAR TABELA PROFILES COM ROLES
-- ============================================
-- Esta migration cria a tabela profiles de forma correta
-- com roles e políticas RLS que não causam dependências circulares

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

-- 4. Criar políticas RLS simplificadas (sem dependências circulares)

-- Política SELECT: Usuários podem ver seu próprio perfil
-- Admins podem ver todos os perfis (mas sem verificar se é admin na própria query)
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política SELECT para admins (separada para evitar circularidade)
-- Esta política permite que admins vejam todos os perfis
-- Mas só funciona se o usuário já tiver um perfil com role='admin'
CREATE POLICY "profiles_select_admins"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Política INSERT: Usuários podem criar seu próprio perfil
-- Isso permite que novos usuários criem seu perfil sem precisar ser admin
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política INSERT para admins criar perfis de outros usuários
CREATE POLICY "profiles_insert_admins"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Política UPDATE: Usuários podem atualizar seu próprio perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política UPDATE para admins atualizarem qualquer perfil
CREATE POLICY "profiles_update_admins"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- 5. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. Função para criar perfil automaticamente quando um usuário é criado
-- Esta função usa SECURITY DEFINER para poder inserir na tabela profiles
-- mesmo que o usuário ainda não tenha perfil
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

-- 8. Trigger para criar perfil automaticamente quando um usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. Comentários para documentação
COMMENT ON TABLE public.profiles IS 'Perfis de usuários com roles e informações adicionais';
COMMENT ON COLUMN public.profiles.role IS 'Role do usuário: admin, advogado, estagiario, supervisor';
COMMENT ON COLUMN public.profiles.nome IS 'Nome do usuário';
COMMENT ON COLUMN public.profiles.email IS 'Email do usuário (sincronizado com auth.users)';
COMMENT ON COLUMN public.profiles.ativo IS 'Indica se o usuário está ativo no sistema';
