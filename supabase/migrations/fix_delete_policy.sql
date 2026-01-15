-- ============================================
-- CORRIGIR POLÍTICA DE DELETE
-- ============================================
-- Execute este script no SQL Editor do Supabase

-- Remover política antiga de delete
DROP POLICY IF EXISTS "Auth delete" ON public.teses;

-- Criar nova política: qualquer usuário autenticado pode deletar
-- (Isso é apropriado para um sistema interno onde todos os usuários são confiáveis)
CREATE POLICY "Auth delete" 
  ON public.teses 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Alternativa: Se quiser que apenas o dono OU admins possam deletar:
-- CREATE POLICY "Auth delete" 
--   ON public.teses 
--   FOR DELETE 
--   USING (
--     auth.role() = 'authenticated' 
--     AND (
--       auth.uid() = user_id 
--       OR user_id IS NULL 
--       OR EXISTS (
--         SELECT 1 FROM public.profiles 
--         WHERE id = auth.uid() AND role = 'admin'
--       )
--     )
--   );

-- Verificar se a política foi criada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'teses';
