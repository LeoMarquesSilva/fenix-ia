-- Criar tabela de favoritos
-- Execute este script no Supabase SQL Editor

-- Tabela para armazenar teses favoritas de cada usuário
CREATE TABLE IF NOT EXISTS public.favoritos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tese_id UUID NOT NULL REFERENCES public.teses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que um usuário não pode favoritar a mesma tese duas vezes
  UNIQUE(user_id, tese_id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_favoritos_user_id ON public.favoritos(user_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_tese_id ON public.favoritos(tese_id);

-- Habilitar RLS
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Usuários podem ver apenas seus próprios favoritos
CREATE POLICY "Users can view own favorites" ON public.favoritos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Usuários podem adicionar favoritos para si mesmos
CREATE POLICY "Users can add own favorites" ON public.favoritos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem remover seus próprios favoritos
CREATE POLICY "Users can remove own favorites" ON public.favoritos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Verificar estrutura criada
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'favoritos' AND table_schema = 'public';
