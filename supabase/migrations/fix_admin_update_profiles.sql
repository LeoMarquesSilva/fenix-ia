-- ============================================
-- CORRIGIR POLÍTICAS PARA ADMIN ATUALIZAR PERFIS
-- ============================================
-- Execute este script no SQL Editor do Supabase

-- 1. Remover política antiga de update
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- 2. Criar nova política de UPDATE que permite:
--    - Usuário atualizar seu próprio perfil
--    - Admin atualizar qualquer perfil (usando função SECURITY DEFINER)
CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    OR public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = id 
    OR public.get_user_role(auth.uid()) = 'admin'
  );

-- 3. Fazer o mesmo para DELETE
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

CREATE POLICY "profiles_delete_policy"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = id 
    OR public.get_user_role(auth.uid()) = 'admin'
  );

-- 4. Verificar se o trigger de criação de perfil existe
-- Se não existir, criar:
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
    nome = COALESCE(EXCLUDED.nome, public.profiles.nome),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    role = COALESCE(EXCLUDED.role, public.profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Verificar políticas atuais
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Ver todos os perfis
SELECT * FROM public.profiles ORDER BY created_at DESC;
